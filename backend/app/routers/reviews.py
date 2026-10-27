import datetime
import re
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status
from bson import ObjectId
from ..database import reviews_col, moderation_rules_col, products_col, serialize_doc
from ..schemas.review import ReviewCreate, ReviewResponse, VoteAction, ProductSchema
from ..services.ai_trust import analyze_review_trust

router = APIRouter(prefix="/reviews", tags=["Reviews"])

def get_object_id_query(id_str: str):
    """Attempt ObjectId query, fallback to string matching."""
    try:
        return {"$or": [{"_id": ObjectId(id_str)}, {"id": id_str}]}
    except Exception:
        return {"$or": [{"id": id_str}, {"_id": id_str}]}

@router.get("", response_model=List[ReviewResponse])
def get_reviews(
    status: Optional[str] = Query(None, description="Filter by status: approved, pending, flagged, escalated, or all"),
    rating: Optional[int] = Query(None, ge=1, le=5),
    search: Optional[str] = Query(None),
    sku: Optional[str] = Query(None),
    channel: Optional[str] = Query(None),
    sort: str = Query("recent", pattern="^(recent|highest_rating|lowest_rating|most_helpful)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    filter_q = {}
    
    if status and status.lower() != "all":
        filter_q["status"] = status.lower()
    elif not status:
        # Default for public review hub is approved
        filter_q["status"] = "approved"
        
    if rating is not None:
        filter_q["rating"] = rating
        
    if sku:
        filter_q["sku"] = sku
        
    if channel:
        filter_q["channel"] = channel
        
    if search:
        search_escaped = re.escape(search)
        regex = {"$regex": search_escaped, "$options": "i"}
        filter_q["$or"] = [
            {"title": regex},
            {"body": regex},
            {"customer_name": regex},
            {"product_name": regex},
            {"sku": regex},
            {"tags": regex}
        ]
        
    sort_spec = [("created_at", -1)]
    if sort == "recent":
        sort_spec = [("created_at", -1)]
    elif sort == "highest_rating":
        sort_spec = [("rating", -1), ("created_at", -1)]
    elif sort == "lowest_rating":
        sort_spec = [("rating", 1), ("created_at", -1)]
    elif sort == "most_helpful":
        sort_spec = [("helpful_count", -1), ("created_at", -1)]
        
    cursor = reviews_col.find(filter_q).sort(sort_spec).skip(offset).limit(limit)
    return [serialize_doc(doc) for doc in cursor]

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(review_in: ReviewCreate):
    # Fetch active moderation rule from MongoDB
    active_rule = moderation_rules_col.find_one({"is_active": True})
    
    sentiment_label, sentiment_score, toxicity_score, spam_score, suggested_status = analyze_review_trust(
        title=review_in.title,
        body=review_in.body,
        rating=review_in.rating,
        verified=review_in.verified_purchase or False,
        rule=active_rule
    )
    
    now = datetime.datetime.utcnow()
    images_list = (review_in.images or [])[:6]
    image_url = review_in.image_url or (images_list[0] if images_list else None)
    
    doc = {
        "title": review_in.title,
        "body": review_in.body,
        "rating": review_in.rating,
        "customer_name": review_in.customer_name,
        "customer_email": review_in.customer_email,
        "sku": review_in.sku,
        "product_name": review_in.product_name,
        "channel": review_in.channel or "Direct Web",
        "recommend": review_in.recommend if review_in.recommend is not None else True,
        "verified_purchase": review_in.verified_purchase if review_in.verified_purchase is not None else True,
        "tags": review_in.tags or "",
        "image_url": image_url,
        "images": images_list,
        "status": suggested_status,
        "sentiment_label": sentiment_label,
        "sentiment_score": sentiment_score,
        "toxicity_score": toxicity_score,
        "spam_score": spam_score,
        "helpful_count": 0,
        "unhelpful_count": 0,
        "moderated_by": "Auto-Approval Engine" if suggested_status == "approved" else None,
        "moderated_at": now if suggested_status == "approved" else None,
        "moderation_note": "Auto-Approved by Trust Policy" if suggested_status == "approved" else None,
        "created_at": now,
        "updated_at": now
    }
    
    res = reviews_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    
    # Auto-register product in products collection if not exists
    if review_in.sku:
        products_col.update_one(
            {"sku": review_in.sku},
            {"$setOnInsert": {
                "sku": review_in.sku,
                "name": review_in.product_name,
                "category": "Footwear",
                "attribute": "Performance",
                "icon": "steps"
            }},
            upsert=True
        )
        
    return serialize_doc(doc)

@router.get("/products", response_model=List[ProductSchema])
def get_products():
    """Retrieve catalog of reviewable products."""
    products = list(products_col.find({}, {"_id": 0}))
    return products

@router.post("/products", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductSchema):
    """Add a new product to the catalog."""
    products_col.update_one(
        {"sku": product.sku},
        {"$set": product.dict()},
        upsert=True
    )
    return product

@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: str):
    query = get_object_id_query(review_id)
    doc = reviews_col.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Review not found")
    return serialize_doc(doc)

@router.post("/{review_id}/vote", response_model=ReviewResponse)
def vote_review(review_id: str, vote: VoteAction):
    if vote.vote_type not in ["helpful", "unhelpful"]:
        raise HTTPException(status_code=400, detail="vote_type must be 'helpful' or 'unhelpful'")
        
    field = "helpful_count" if vote.vote_type == "helpful" else "unhelpful_count"
    query = get_object_id_query(review_id)
    
    updated = reviews_col.find_one_and_update(
        query,
        {"$inc": {field: 1}, "$set": {"updated_at": datetime.datetime.utcnow()}},
        return_document=True
    )
    
    if not updated:
        raise HTTPException(status_code=404, detail="Review not found")
        
    return serialize_doc(updated)
