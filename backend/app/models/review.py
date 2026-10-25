import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from ..database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(255), nullable=False)
    sku = Column(String(50), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    channel = Column(String(50), default="Direct Web", index=True)
    
    # Status: 'pending', 'approved', 'flagged', 'rejected', 'escalated'
    status = Column(String(30), default="pending", index=True)
    
    # AI Trust & Sentiment telemetry
    sentiment_label = Column(String(20), default="Positive")  # Positive, Neutral, Negative
    sentiment_score = Column(Float, default=0.92)  # 0.0 - 1.0
    toxicity_score = Column(Float, default=0.02)   # 0.0 - 1.0
    spam_score = Column(Float, default=0.01)       # 0.0 - 1.0
    
    # Customer Metadata
    verified_purchase = Column(Boolean, default=True)
    recommend = Column(Boolean, default=True)
    helpful_count = Column(Integer, default=0)
    unhelpful_count = Column(Integer, default=0)
    tags = Column(String(255), default="")  # Comma-separated: "Audio Quality, Battery"
    image_url = Column(String(500), nullable=True)
    images_json = Column(Text, nullable=True)  # JSON array storing up to 6 photo URLs/base64 strings

    @property
    def images(self):
        import json
        if self.images_json:
            try:
                loaded = json.loads(self.images_json)
                if isinstance(loaded, list):
                    return loaded
            except Exception:
                pass
        if self.image_url:
            return [self.image_url]
        return []

    @images.setter
    def images(self, value):
        import json
        if isinstance(value, list):
            self.images_json = json.dumps(value)
            if value and len(value) > 0 and not self.image_url:
                self.image_url = value[0]
        elif isinstance(value, str):
            self.images_json = json.dumps([value])
            if not self.image_url:
                self.image_url = value
        else:
            self.images_json = "[]"

    # Moderation SLA & Audit Trail
    moderation_note = Column(Text, nullable=True)
    moderated_by = Column(String(100), nullable=True)
    moderated_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class ModerationRule(Base):
    __tablename__ = "moderation_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Default Trust Governance")
    min_rating_for_auto_approve = Column(Integer, default=4)
    max_toxicity_threshold = Column(Float, default=0.15)
    require_verified_purchase = Column(Boolean, default=True)
    require_sentiment_positive = Column(Boolean, default=False)
    auto_flag_keywords = Column(Text, default="scam,fake,broken,terrible,horrible,refund,cheat,lawsuit,toxic")
    is_active = Column(Boolean, default=True)
