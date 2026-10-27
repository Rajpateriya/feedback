import datetime
from typing import Dict, Any, List
from fastapi import APIRouter
from ..database import reviews_col, products_col
from ..schemas.review import AnalyticsOverview

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview():
    all_reviews = list(reviews_col.find({}))
    total = len(all_reviews)

    # Fetch products catalog
    products_catalog = list(products_col.find({}, {"_id": 0}))

    # Helper for days of week
    now = datetime.datetime.utcnow()
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    # 7-day chronological sequence ending today
    past_7_days = [(now - datetime.timedelta(days=i)) for i in range(6, -1, -1)]
    daily_volume = []
    for d in past_7_days:
        day_str = d.strftime("%a")
        day_reviews = [
            r for r in all_reviews 
            if isinstance(r.get("created_at"), datetime.datetime) and r["created_at"].date() == d.date()
        ]
        vol = len(day_reviews)
        appr = sum(1 for r in day_reviews if r.get("status") == "approved")
        flag = sum(1 for r in day_reviews if r.get("status") in ["flagged", "escalated"])
        daily_volume.append({
            "day": day_str,
            "volume": vol,
            "approved": appr,
            "flagged": flag
        })

    # Hourly intervals (00-04h, 04-08h, 08-12h, 12-16h, 16-20h, 20-24h)
    slot_buckets = [
        {"slot": "00-04h", "label": "Overnight", "range": range(0, 4)},
        {"slot": "04-08h", "label": "Early Bird", "range": range(4, 8)},
        {"slot": "08-12h", "label": "Morning Peak", "range": range(8, 12)},
        {"slot": "12-16h", "label": "Midday Rush", "range": range(12, 16)},
        {"slot": "16-20h", "label": "Evening Prime", "range": range(16, 20)},
        {"slot": "20-24h", "label": "Late Evening", "range": range(20, 24)},
    ]
    
    hourly_counts = [0] * len(slot_buckets)
    for r in all_reviews:
        c_at = r.get("created_at")
        if isinstance(c_at, datetime.datetime):
            h = c_at.hour
            for idx, b in enumerate(slot_buckets):
                if h in b["range"]:
                    hourly_counts[idx] += 1
                    break

    max_hourly = max(hourly_counts) if hourly_counts and max(hourly_counts) > 0 else 1
    hourly_intervals = []
    for idx, b in enumerate(slot_buckets):
        count = hourly_counts[idx]
        pct = round((count / max_hourly) * 100) if total > 0 else 0
        hourly_intervals.append({
            "slot": b["slot"],
            "label": b["label"],
            "volume": count,
            "pct": pct,
            "peak": count == max_hourly and total > 0
        })

    # Real SLA Turnaround calculation
    sla_buckets = {"<2m": 0, "2-5m": 0, "5-10m": 0, ">10m": 0}
    moderated_count = 0
    sla_times = []

    for r in all_reviews:
        mod_at = r.get("moderated_at")
        cre_at = r.get("created_at")
        if isinstance(mod_at, datetime.datetime) and isinstance(cre_at, datetime.datetime):
            diff_min = max(0.1, (mod_at - cre_at).total_seconds() / 60.0)
            sla_times.append(diff_min)
            moderated_count += 1
            if diff_min < 2.0:
                sla_buckets["<2m"] += 1
            elif diff_min <= 5.0:
                sla_buckets["2-5m"] += 1
            elif diff_min <= 10.0:
                sla_buckets["5-10m"] += 1
            else:
                sla_buckets[">10m"] += 1

    median_sla = 0.0
    if sla_times:
        sla_times.sort()
        median_sla = round(sla_times[len(sla_times) // 2], 1)

    denom_sla = max(1, moderated_count)
    sla_breakdown = [
        {"tier": "< 2m (Instant AI)", "label": "Zero-Touch Pass", "count": sla_buckets["<2m"], "pct": round((sla_buckets["<2m"] / denom_sla) * 100, 1) if moderated_count > 0 else 0.0, "color": "from-[#5122fe] to-[#7b4eff]", "badge": "Ultra-Fast"},
        {"tier": "2 - 5m", "label": "Fast Moderator Pass", "count": sla_buckets["2-5m"], "pct": round((sla_buckets["2-5m"] / denom_sla) * 100, 1) if moderated_count > 0 else 0.0, "color": "from-emerald-500 to-teal-500", "badge": "On-Track"},
        {"tier": "5 - 10m", "label": "In-Depth Triage", "count": sla_buckets["5-10m"], "pct": round((sla_buckets["5-10m"] / denom_sla) * 100, 1) if moderated_count > 0 else 0.0, "color": "from-amber-400 to-amber-500", "badge": "Within SLA"},
        {"tier": "> 10m", "label": "SLA Breach Target", "count": sla_buckets[">10m"], "pct": round((sla_buckets[">10m"] / denom_sla) * 100, 1) if moderated_count > 0 else 0.0, "color": "from-rose-500 to-red-600", "badge": "Zero Breaches"}
    ]

    # Dynamic Product Models Telemetry aggregated from real MongoDB reviews
    product_map = {p["sku"]: p for p in products_catalog}
    # Add any other SKUs found in reviews
    for r in all_reviews:
        sku = r.get("sku")
        if sku and sku not in product_map:
            product_map[sku] = {
                "sku": sku,
                "name": r.get("product_name", sku),
                "category": "Footwear",
                "attribute": "Custom Gear",
                "icon": "steps"
            }

    product_telemetry = []
    for sku, p_info in product_map.items():
        prod_reviews = [r for r in all_reviews if r.get("sku") == sku]
        p_vol = len(prod_reviews)
        if p_vol > 0:
            p_avg = round(sum(r.get("rating", 5) for r in prod_reviews) / p_vol, 1)
            p_ver = round((sum(1 for r in prod_reviews if r.get("verified_purchase")) / p_vol) * 100)
        else:
            p_avg = 0.0
            p_ver = 0
            
        product_telemetry.append({
            "sku": sku,
            "name": p_info.get("name", sku),
            "category": p_info.get("category", "Footwear"),
            "baseRating": p_avg,
            "baseVolume": p_vol,
            "verifiedPct": p_ver,
            "attribute": p_info.get("attribute", "Cushioning"),
            "icon": p_info.get("icon", "steps")
        })

    # Sort product telemetry by volume descending
    product_telemetry.sort(key=lambda x: (x["baseVolume"], x["baseRating"]), reverse=True)

    if total == 0:
        return {
            "total_reviews": 0,
            "average_rating": 0.0,
            "verified_percentage": 0.0,
            "photo_percentage": 0.0,
            "auto_clear_rate": 0.0,
            "median_sla_minutes": 0.0,
            "pending_count": 0,
            "approved_count": 0,
            "flagged_count": 0,
            "escalated_count": 0,
            "rejected_count": 0,
            "rating_distribution": {f"{i}_star": {"count": 0, "percentage": 0.0} for i in range(1, 6)},
            "sentiment_breakdown": {"Positive": 0, "Neutral": 0, "Negative": 0},
            "channel_breakdown": {},
            "daily_volume": daily_volume,
            "sla_breakdown": sla_breakdown,
            "hourly_intervals": hourly_intervals,
            "product_telemetry": product_telemetry
        }

    # Aggregate metrics
    ratings = [r.get("rating", 5) for r in all_reviews]
    avg_rating = round(sum(ratings) / total, 2)
    verified_count = sum(1 for r in all_reviews if r.get("verified_purchase"))
    verified_pct = round((verified_count / total) * 100, 1)

    photo_count = sum(1 for r in all_reviews if (r.get("images") and len(r["images"]) > 0) or r.get("image_url"))
    photo_pct = round((photo_count / total) * 100, 1)

    pending_count = sum(1 for r in all_reviews if r.get("status") == "pending")
    approved_count = sum(1 for r in all_reviews if r.get("status") == "approved")
    flagged_count = sum(1 for r in all_reviews if r.get("status") == "flagged")
    escalated_count = sum(1 for r in all_reviews if r.get("status") == "escalated")
    rejected_count = sum(1 for r in all_reviews if r.get("status") == "rejected")

    auto_clear_rate = round((approved_count / max(1, total)) * 100, 1)

    rating_distribution = {}
    for star in range(5, 0, -1):
        c = sum(1 for r in all_reviews if r.get("rating") == star)
        pct = round((c / total) * 100, 1)
        rating_distribution[f"{star}_star"] = {"count": c, "percentage": pct}

    sentiment_breakdown = {
        "Positive": sum(1 for r in all_reviews if r.get("sentiment_label") == "Positive"),
        "Neutral": sum(1 for r in all_reviews if r.get("sentiment_label") == "Neutral"),
        "Negative": sum(1 for r in all_reviews if r.get("sentiment_label") == "Negative"),
    }

    channel_breakdown = {}
    for r in all_reviews:
        ch = r.get("channel") or "Direct Web"
        channel_breakdown[ch] = channel_breakdown.get(ch, 0) + 1

    return {
        "total_reviews": total,
        "average_rating": avg_rating,
        "verified_percentage": verified_pct,
        "photo_percentage": photo_pct,
        "auto_clear_rate": auto_clear_rate,
        "median_sla_minutes": median_sla,
        "pending_count": pending_count,
        "approved_count": approved_count,
        "flagged_count": flagged_count,
        "escalated_count": escalated_count,
        "rejected_count": rejected_count,
        "rating_distribution": rating_distribution,
        "sentiment_breakdown": sentiment_breakdown,
        "channel_breakdown": channel_breakdown,
        "daily_volume": daily_volume,
        "sla_breakdown": sla_breakdown,
        "hourly_intervals": hourly_intervals,
        "product_telemetry": product_telemetry
    }
