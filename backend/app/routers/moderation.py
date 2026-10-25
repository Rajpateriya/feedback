import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from ..database import get_db
from ..models.review import Review, ModerationRule
from ..schemas.review import (
    ReviewResponse,
    ModerationAction,
    BulkModerationAction,
    ModerationRuleSchema,
    ModerationRuleUpdate
)

router = APIRouter(prefix="/moderation", tags=["Moderation"])

@router.get("/queue")
def get_moderation_queue(
    tab: str = Query("pending", pattern="^(pending|approved|flagged|escalated|all)$"),
    search: Optional[str] = Query(None),
    sku: Optional[str] = Query(None),
    min_toxicity: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    # Overall queue counter metrics
    pending_count = db.query(Review).filter(Review.status == "pending").count()
    approved_count = db.query(Review).filter(Review.status == "approved").count()
    flagged_count = db.query(Review).filter(Review.status == "flagged").count()
    escalated_count = db.query(Review).filter(Review.status == "escalated").count()
    total_count = db.query(Review).count()

    # Query for the requested tab
    query = db.query(Review)
    if tab != "all":
        query = query.filter(Review.status == tab)

    if sku:
        query = query.filter(Review.sku == sku)

    if min_toxicity is not None:
        query = query.filter(Review.toxicity_score >= min_toxicity)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Review.title.ilike(search_term),
                Review.body.ilike(search_term),
                Review.customer_name.ilike(search_term),
                Review.sku.ilike(search_term),
                Review.tags.ilike(search_term)
            )
        )

    # Sort priority: highest toxicity and newest first
    if tab == "flagged":
        reviews = query.order_by(desc(Review.toxicity_score), desc(Review.created_at)).all()
    else:
        reviews = query.order_by(desc(Review.created_at)).all()

    auto_clear_rate = round((approved_count / max(1, total_count)) * 100, 1)

    return {
        "metrics": {
            "pending_count": pending_count,
            "approved_count": approved_count,
            "flagged_count": flagged_count,
            "escalated_count": escalated_count,
            "total_count": total_count,
            "median_sla_minutes": 4.2,
            "auto_clear_rate": auto_clear_rate
        },
        "reviews": [ReviewResponse.from_orm(r) for r in reviews]
    }

@router.post("/reviews/{review_id}/action", response_model=ReviewResponse)
def execute_moderation_action(
    review_id: int,
    action_in: ModerationAction,
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    action_map = {
        "approve": "approved",
        "reject": "rejected",
        "flag": "flagged",
        "escalate": "escalated"
    }

    if action_in.action.lower() not in action_map:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action: {action_in.action}. Must be one of: approve, reject, flag, escalate"
        )

    review.status = action_map[action_in.action.lower()]
    review.moderator_note = action_in.note or review.moderation_note
    review.moderated_by = action_in.moderator_name or "Eleanor Vance"
    review.moderated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(review)
    return review

@router.post("/bulk-action")
def execute_bulk_moderation(
    bulk_in: BulkModerationAction,
    db: Session = Depends(get_db)
):
    action_map = {
        "approve": "approved",
        "reject": "rejected",
        "flag": "flagged",
        "escalate": "escalated"
    }

    if bulk_in.action.lower() not in action_map:
        raise HTTPException(status_code=400, detail="Invalid action")

    reviews = db.query(Review).filter(Review.id.in_(bulk_in.review_ids)).all()
    now = datetime.datetime.utcnow()
    target_status = action_map[bulk_in.action.lower()]

    for r in reviews:
        r.status = target_status
        r.moderated_by = bulk_in.moderator_name or "Eleanor Vance"
        r.moderated_at = now
        if bulk_in.note:
            r.moderation_note = bulk_in.note

    db.commit()
    return {"updated_count": len(reviews), "target_status": target_status}

@router.get("/rules", response_model=ModerationRuleSchema)
def get_moderation_rules(db: Session = Depends(get_db)):
    rule = db.query(ModerationRule).filter(ModerationRule.is_active == True).first()
    if not rule:
        rule = ModerationRule(
            name="Enterprise Trust Engine v4.2",
            min_rating_for_auto_approve=4,
            max_toxicity_threshold=0.15,
            require_verified_purchase=True,
            require_sentiment_positive=True,
            auto_flag_keywords="scam,fake,broken,terrible,horrible,refund,cheat,lawsuit,toxic",
            is_active=True
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
    return rule

@router.put("/rules", response_model=ModerationRuleSchema)
def update_moderation_rules(rule_in: ModerationRuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(ModerationRule).filter(ModerationRule.is_active == True).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule configuration not found")

    if rule_in.min_rating_for_auto_approve is not None:
        rule.min_rating_for_auto_approve = rule_in.min_rating_for_auto_approve
    if rule_in.max_toxicity_threshold is not None:
        rule.max_toxicity_threshold = rule_in.max_toxicity_threshold
    if rule_in.require_verified_purchase is not None:
        rule.require_verified_purchase = rule_in.require_verified_purchase
    if rule_in.require_sentiment_positive is not None:
        rule.require_sentiment_positive = rule_in.require_sentiment_positive
    if rule_in.auto_flag_keywords is not None:
        rule.auto_flag_keywords = rule_in.auto_flag_keywords
    if rule_in.is_active is not None:
        rule.is_active = rule_in.is_active

    db.commit()
    db.refresh(rule)
    return rule
