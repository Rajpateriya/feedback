import datetime
import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from bson import ObjectId
from ..database import reviews_col, moderation_rules_col, serialize_doc
from ..schemas.review import (
    ReviewResponse,
    ModerationAction,
    BulkModerationAction,
    ModerationRuleSchema,
    ModerationRuleUpdate
)

router = APIRouter(prefix="/moderation", tags=["Moderation"])

def get_object_id_query(id_str: str):
    """Attempt ObjectId query, fallback to string matching."""
    try:
        return {"$or": [{"_id": ObjectId(id_str)}, {"id": id_str}]}
    except Exception:
        return {"$or": [{"id": id_str}, {"_id": id_str}]}

@router.get("/queue")
def get_moderation_queue(
    tab: str = Query("pending", pattern="^(pending|approved|flagged|escalated|all)$"),
    search: Optional[str] = Query(None),
    sku: Optional[str] = Query(None),
    min_toxicity: Optional[float] = Query(None)
):
    # Overall queue counter metrics from MongoDB
    pending_count = reviews_col.count_documents({"status": "pending"})
    approved_count = reviews_col.count_documents({"status": "approved"})
    flagged_count = reviews_col.count_documents({"status": "flagged"})
    escalated_count = reviews_col.count_documents({"status": "escalated"})
    total_count = reviews_col.count_documents({})

    filter_q = {}
    if tab != "all":
        filter_q["status"] = tab

    if sku:
        filter_q["sku"] = sku

    if min_toxicity is not None:
        filter_q["toxicity_score"] = {"$gte": min_toxicity}

    if search:
        search_escaped = re.escape(search)
        regex = {"$regex": search_escaped, "$options": "i"}
        filter_q["$or"] = [
            {"title": regex},
            {"body": regex},
            {"customer_name": regex},
            {"sku": regex},
            {"product_name": regex},
            {"tags": regex}
        ]

    # Sort priority: highest toxicity and newest first
    if tab == "flagged":
        sort_spec = [("toxicity_score", -1), ("created_at", -1)]
    else:
        sort_spec = [("created_at", -1)]

    cursor = reviews_col.find(filter_q).sort(sort_spec)
    reviews_list = [serialize_doc(doc) for doc in cursor]

    # Calculate real SLA turnaround from moderated reviews
    moderated_cursor = reviews_col.find({"moderated_at": {"$ne": None}, "created_at": {"$ne": None}})
    sla_times = []
    for doc in moderated_cursor:
        mod_at = doc.get("moderated_at")
        cre_at = doc.get("created_at")
        if isinstance(mod_at, datetime.datetime) and isinstance(cre_at, datetime.datetime):
            diff_min = max(0.1, (mod_at - cre_at).total_seconds() / 60.0)
            sla_times.append(diff_min)
            
    if sla_times:
        sla_times.sort()
        median_sla = round(sla_times[len(sla_times) // 2], 1)
    else:
        median_sla = 0.0

    auto_clear_rate = round((approved_count / max(1, total_count)) * 100, 1) if total_count > 0 else 0.0

    return {
        "metrics": {
            "pending_count": pending_count,
            "approved_count": approved_count,
            "flagged_count": flagged_count,
            "escalated_count": escalated_count,
            "total_count": total_count,
            "median_sla_minutes": median_sla,
            "auto_clear_rate": auto_clear_rate
        },
        "reviews": reviews_list
    }

@router.post("/reviews/{review_id}/action", response_model=ReviewResponse)
def execute_moderation_action(
    review_id: str,
    action_in: ModerationAction
):
    action_map = {
        "approve": "approved",
        "reject": "rejected",
        "flag": "flagged",
        "escalate": "escalated"
    }

    action_lower = action_in.action.lower()
    if action_lower not in action_map:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action: {action_in.action}. Must be one of: approve, reject, flag, escalate"
        )

    now = datetime.datetime.utcnow()
    target_status = action_map[action_lower]
    query = get_object_id_query(review_id)
    
    update_data = {
        "status": target_status,
        "moderated_by": action_in.moderator_name or "Eleanor Vance",
        "moderated_at": now,
        "updated_at": now
    }
    if action_in.note:
        update_data["moderation_note"] = action_in.note

    updated = reviews_col.find_one_and_update(
        query,
        {"$set": update_data},
        return_document=True
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Review not found")

    return serialize_doc(updated)

@router.post("/bulk-action")
def execute_bulk_moderation(
    bulk_in: BulkModerationAction
):
    action_map = {
        "approve": "approved",
        "reject": "rejected",
        "flag": "flagged",
        "escalate": "escalated"
    }

    action_lower = bulk_in.action.lower()
    if action_lower not in action_map:
        raise HTTPException(status_code=400, detail="Invalid action")

    target_status = action_map[action_lower]
    now = datetime.datetime.utcnow()

    id_queries = []
    for rid in bulk_in.review_ids:
        try:
            id_queries.append(ObjectId(rid))
        except Exception:
            pass
        id_queries.append(rid)

    update_fields = {
        "status": target_status,
        "moderated_by": bulk_in.moderator_name or "Eleanor Vance",
        "moderated_at": now,
        "updated_at": now
    }
    if bulk_in.note:
        update_fields["moderation_note"] = bulk_in.note

    res = reviews_col.update_many(
        {"$or": [{"_id": {"$in": id_queries}}, {"id": {"$in": bulk_in.review_ids}}]},
        {"$set": update_fields}
    )

    return {"updated_count": res.modified_count, "target_status": target_status}

@router.get("/rules", response_model=ModerationRuleSchema)
def get_moderation_rules():
    rule = moderation_rules_col.find_one({"is_active": True})
    if not rule:
        rule = {
            "name": "Enterprise Trust Engine v4.2",
            "min_rating_for_auto_approve": 4,
            "max_toxicity_threshold": 0.15,
            "require_verified_purchase": True,
            "require_sentiment_positive": False,
            "auto_flag_keywords": "scam,fake,broken,terrible,horrible,refund,cheat,lawsuit,toxic",
            "is_active": True,
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
        res = moderation_rules_col.insert_one(rule)
        rule["_id"] = res.inserted_id
    return serialize_doc(rule)

@router.put("/rules", response_model=ModerationRuleSchema)
def update_moderation_rules(rule_in: ModerationRuleUpdate):
    update_data = {}
    if rule_in.min_rating_for_auto_approve is not None:
        update_data["min_rating_for_auto_approve"] = rule_in.min_rating_for_auto_approve
    if rule_in.max_toxicity_threshold is not None:
        update_data["max_toxicity_threshold"] = rule_in.max_toxicity_threshold
    if rule_in.require_verified_purchase is not None:
        update_data["require_verified_purchase"] = rule_in.require_verified_purchase
    if rule_in.require_sentiment_positive is not None:
        update_data["require_sentiment_positive"] = rule_in.require_sentiment_positive
    if rule_in.auto_flag_keywords is not None:
        update_data["auto_flag_keywords"] = rule_in.auto_flag_keywords
    if rule_in.is_active is not None:
        update_data["is_active"] = rule_in.is_active

    update_data["updated_at"] = datetime.datetime.utcnow()

    updated = moderation_rules_col.find_one_and_update(
        {"is_active": True},
        {"$set": update_data},
        return_document=True
    )
    if not updated:
        # If no rule was marked is_active, update any or insert
        updated = moderation_rules_col.find_one_and_update(
            {},
            {"$set": update_data},
            return_document=True
        )
    if not updated:
        rule = {
            "name": "Enterprise Trust Engine v4.2",
            "min_rating_for_auto_approve": rule_in.min_rating_for_auto_approve or 4,
            "max_toxicity_threshold": rule_in.max_toxicity_threshold or 0.15,
            "require_verified_purchase": rule_in.require_verified_purchase if rule_in.require_verified_purchase is not None else True,
            "require_sentiment_positive": rule_in.require_sentiment_positive if rule_in.require_sentiment_positive is not None else False,
            "auto_flag_keywords": rule_in.auto_flag_keywords or "scam,fake,broken,terrible,horrible,refund,cheat,lawsuit,toxic",
            "is_active": True,
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
        res = moderation_rules_col.insert_one(rule)
        rule["_id"] = res.inserted_id
        return serialize_doc(rule)

    return serialize_doc(updated)
