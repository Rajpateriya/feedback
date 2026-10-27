import re
from typing import Tuple, Optional, Any

POSITIVE_WORDS = {
    "great", "excellent", "amazing", "love", "perfect", "fantastic", "best", "good",
    "awesome", "stellar", "clean", "smooth", "high-end", "premium", "superb", "brilliant",
    "durable", "fast", "reliable", "satisfied", "recommend", "flawless", "crisp", "comfortable", "cushion"
}

NEGATIVE_WORDS = {
    "terrible", "bad", "horrible", "awful", "worst", "broken", "failed", "scam",
    "useless", "disappointed", "poor", "waste", "defective", "refund", "crash",
    "garbage", "hated", "cheap", "flimsy", "lag", "buggy", "uncomfortable", "pain"
}

RISK_KEYWORDS = {
    "scam", "fraud", "lawsuit", "sue", "fake", "stolen", "counterfeit", "dangerous",
    "hazard", "poison", "illegal", "death", "toxic"
}

def analyze_review_trust(title: str, body: str, rating: int, verified: bool, rule: Optional[Any] = None) -> Tuple[str, float, float, float, str]:
    """
    Returns:
    (sentiment_label, sentiment_score, toxicity_score, spam_score, suggested_status)
    """
    combined_text = f"{title} {body}".lower()
    words = re.findall(r"\b\w+\b", combined_text)
    
    pos_count = sum(1 for w in words if w in POSITIVE_WORDS)
    neg_count = sum(1 for w in words if w in NEGATIVE_WORDS)
    risk_count = sum(1 for w in words if w in RISK_KEYWORDS)
    
    # Extract rule values whether rule is dict or object
    auto_flag_keywords = ""
    min_rating = 4
    max_toxicity = 0.15
    req_verified = True
    
    if rule:
        if isinstance(rule, dict):
            auto_flag_keywords = rule.get("auto_flag_keywords", "")
            min_rating = rule.get("min_rating_for_auto_approve", 4)
            max_toxicity = rule.get("max_toxicity_threshold", 0.15)
            req_verified = rule.get("require_verified_purchase", True)
        else:
            auto_flag_keywords = getattr(rule, "auto_flag_keywords", "")
            min_rating = getattr(rule, "min_rating_for_auto_approve", 4)
            max_toxicity = getattr(rule, "max_toxicity_threshold", 0.15)
            req_verified = getattr(rule, "require_verified_purchase", True)
            
    # Check rule keywords if custom
    if auto_flag_keywords:
        custom_keywords = [k.strip().lower() for k in auto_flag_keywords.split(",") if k.strip()]
        risk_count += sum(1 for k in custom_keywords if k in combined_text)
        
    # Sentiment calculation
    if rating >= 4:
        base_score = 0.75 + (0.05 * (rating - 4)) + min(0.2, pos_count * 0.04) - (neg_count * 0.05)
    elif rating == 3:
        base_score = 0.50 + (pos_count * 0.04) - (neg_count * 0.04)
    else:
        base_score = 0.20 - ((3 - rating) * 0.05) - (neg_count * 0.03) + (pos_count * 0.02)
        
    sentiment_score = max(0.02, min(0.99, round(base_score, 2)))
    
    if sentiment_score >= 0.65:
        sentiment_label = "Positive"
    elif sentiment_score <= 0.35:
        sentiment_label = "Negative"
    else:
        sentiment_label = "Neutral"
        
    # Toxicity calculation
    base_toxicity = 0.02
    if risk_count > 0:
        base_toxicity += 0.40 * risk_count
    if neg_count > 2 and rating <= 2:
        base_toxicity += 0.15
    if re.search(r"[A-Z]{5,}", f"{title} {body}"):
        base_toxicity += 0.05  # excessive caps
    toxicity_score = max(0.01, min(0.98, round(base_toxicity, 2)))
    
    # Spam score
    spam_score = 0.01
    if len(body) < 15:
        spam_score += 0.15
    if len(set(words)) / max(1, len(words)) < 0.4:
        spam_score += 0.35  # word repetition
    if "http" in combined_text or ".com" in combined_text:
        spam_score += 0.45
    spam_score = max(0.01, min(0.95, round(spam_score, 2)))
    
    # Moderation Queue Routing: all reviews must be triaged in the moderation queue
    if toxicity_score >= 0.5 or risk_count > 0 or toxicity_score > max_toxicity or spam_score > 0.4:
        suggested_status = "flagged"
    else:
        suggested_status = "pending"
        
    return sentiment_label, sentiment_score, toxicity_score, spam_score, suggested_status
