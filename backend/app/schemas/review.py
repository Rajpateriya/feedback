from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ReviewBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    body: str = Field(..., min_length=5)
    rating: int = Field(..., ge=1, le=5)
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_email: str = Field(..., min_length=3, max_length=255)
    sku: str = Field(..., min_length=1, max_length=50)
    product_name: str = Field(..., min_length=1, max_length=255)
    channel: Optional[str] = "Direct Web"
    recommend: Optional[bool] = True
    verified_purchase: Optional[bool] = True
    tags: Optional[str] = ""
    image_url: Optional[str] = None
    images: Optional[List[str]] = Field(default_factory=list)

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    tags: Optional[str] = None
    status: Optional[str] = None

class ReviewResponse(ReviewBase):
    id: str
    status: str
    sentiment_label: str
    sentiment_score: float
    toxicity_score: float
    spam_score: float
    helpful_count: int = 0
    unhelpful_count: int = 0
    moderation_note: Optional[str] = None
    moderated_by: Optional[str] = None
    moderated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ModerationAction(BaseModel):
    action: str = Field(..., description="'approve', 'reject', 'flag', 'escalate'")
    note: Optional[str] = None
    moderator_name: Optional[str] = "Eleanor Vance"

class BulkModerationAction(BaseModel):
    review_ids: List[str]
    action: str = Field(..., description="'approve', 'reject', 'flag', 'escalate'")
    note: Optional[str] = None
    moderator_name: Optional[str] = "Eleanor Vance"

class VoteAction(BaseModel):
    vote_type: str = Field(..., description="'helpful' or 'unhelpful'")

class ModerationRuleSchema(BaseModel):
    id: Optional[str] = None
    name: str = "Enterprise Trust Engine v4.2"
    min_rating_for_auto_approve: int = 4
    max_toxicity_threshold: float = 0.15
    require_verified_purchase: bool = True
    require_sentiment_positive: bool = False
    auto_flag_keywords: str = "scam,fake,broken,terrible,horrible,refund,cheat,lawsuit,toxic"
    is_active: bool = True

    class Config:
        from_attributes = True

class ModerationRuleUpdate(BaseModel):
    min_rating_for_auto_approve: Optional[int] = None
    max_toxicity_threshold: Optional[float] = None
    require_verified_purchase: Optional[bool] = None
    require_sentiment_positive: Optional[bool] = None
    auto_flag_keywords: Optional[str] = None
    is_active: Optional[bool] = None

class ProductSchema(BaseModel):
    sku: str
    name: str
    category: Optional[str] = "Footwear"
    attribute: Optional[str] = ""
    icon: Optional[str] = "steps"

class AnalyticsOverview(BaseModel):
    total_reviews: int
    average_rating: float
    verified_percentage: float
    photo_percentage: float
    auto_clear_rate: float
    median_sla_minutes: float
    pending_count: int
    approved_count: int
    flagged_count: int
    escalated_count: int
    rejected_count: int
    rating_distribution: Dict[str, Dict[str, Any]]
    sentiment_breakdown: Dict[str, int]
    channel_breakdown: Dict[str, int]
    daily_volume: List[Dict[str, Any]]
    sla_breakdown: List[Dict[str, Any]] = []
    hourly_intervals: List[Dict[str, Any]] = []
    product_telemetry: List[Dict[str, Any]] = []
