from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
from ..database import get_db
from ..models.review import Review, ModerationRule
from ..schemas.review import ReviewCreate, ReviewResponse, VoteAction
from ..services.ai_trust import analyze_review_trust

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.get("", response_model=List[ReviewResponse])
def get_reviews(
    status: Optional[str] = Query(None, description="Filter by status: approved, pending, flagged, escalated, or all"),
    rating: Optional[int] = Query(None, ge=1, le=5),
    search: Optional[str] = Query(None),
    sku: Optional[str] = Query(None),
    channel: Optional[str] = Query(None),
    sort: str = Query("recent", pattern="^(recent|highest_rating|lowest_rating|most_helpful)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Review)
    
    if status and status.lower() != "all":
        query = query.filter(Review.status == status.lower())
    elif not status:
        # Default for public review hub is approved
        query = query.filter(Review.status == "approved")
        
    if rating is not None:
        query = query.filter(Review.rating == rating)
        
    if sku:
        query = query.filter(Review.sku == sku)
        
    if channel:
        query = query.filter(Review.channel == channel)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Review.title.ilike(search_term),
                Review.body.ilike(search_term),
                Review.customer_name.ilike(search_term),
                Review.product_name.ilike(search_term),
                Review.sku.ilike(search_term)
            )
        )
        
    if sort == "recent":
        query = query.order_by(desc(Review.created_at))
    elif sort == "highest_rating":
        query = query.order_by(desc(Review.rating), desc(Review.created_at))
    elif sort == "lowest_rating":
        query = query.order_by(asc(Review.rating), desc(Review.created_at))
    elif sort == "most_helpful":
        query = query.order_by(desc(Review.helpful_count), desc(Review.created_at))
        
    return query.offset(offset).limit(limit).all()

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(review_in: ReviewCreate, db: Session = Depends(get_db)):
    # Fetch active moderation rule
    active_rule = db.query(ModerationRule).filter(ModerationRule.is_active == True).first()
    
    sentiment_label, sentiment_score, toxicity_score, spam_score, suggested_status = analyze_review_trust(
        title=review_in.title,
        body=review_in.body,
        rating=review_in.rating,
        verified=review_in.verified_purchase,
        rule=active_rule
    )
    
    new_review = Review(
        title=review_in.title,
        body=review_in.body,
        rating=review_in.rating,
        customer_name=review_in.customer_name,
        customer_email=review_in.customer_email,
        sku=review_in.sku,
        product_name=review_in.product_name,
        channel=review_in.channel or "Direct Web",
        recommend=review_in.recommend,
        verified_purchase=review_in.verified_purchase,
        tags=review_in.tags or "",
        image_url=review_in.image_url or (review_in.images[0] if review_in.images else None),
        status=suggested_status,
        sentiment_label=sentiment_label,
        sentiment_score=sentiment_score,
        toxicity_score=toxicity_score,
        spam_score=spam_score,
        helpful_count=0,
        unhelpful_count=0,
        moderated_by="Auto-Approval Engine" if suggested_status == "approved" else None
    )
    
    # Store up to 6 photos in images property
    if review_in.images:
        new_review.images = review_in.images[:6]
    elif review_in.image_url:
        new_review.images = [review_in.image_url]
    
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

@router.post("/{review_id}/vote", response_model=ReviewResponse)
def vote_review(review_id: int, vote: VoteAction, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if vote.vote_type == "helpful":
        review.helpful_count += 1
    elif vote.vote_type == "unhelpful":
        review.unhelpful_count += 1
    else:
        raise HTTPException(status_code=400, detail="vote_type must be 'helpful' or 'unhelpful'")
        
    db.commit()
    db.refresh(review)
    return review
