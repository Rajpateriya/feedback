from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
import datetime
from .config import settings

client = MongoClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

reviews_col = db["reviews"]
moderation_rules_col = db["moderation_rules"]
products_col = db["products"]

def get_db():
    return db

def serialize_doc(doc: dict) -> dict:
    """Helper to convert MongoDB BSON document into JSON-serializable dictionary with string `id`."""
    if not doc:
        return doc
    formatted = dict(doc)
    if "_id" in formatted:
        formatted["id"] = str(formatted["_id"])
        del formatted["_id"]
    elif "id" in formatted and isinstance(formatted["id"], ObjectId):
        formatted["id"] = str(formatted["id"])
    
    # Ensure images list is populated
    if "images" not in formatted or formatted["images"] is None:
        if formatted.get("image_url"):
            formatted["images"] = [formatted["image_url"]]
        else:
            formatted["images"] = []
            
    # Ensure default fields
    if "helpful_count" not in formatted:
        formatted["helpful_count"] = 0
    if "unhelpful_count" not in formatted:
        formatted["unhelpful_count"] = 0
        
    return formatted

def init_db():
    """Initialize MongoDB indexes and default rules without seeding any fake reviews."""
    try:
        # Create indexes for fast searching and filtering
        reviews_col.create_index([("status", ASCENDING)])
        reviews_col.create_index([("rating", ASCENDING)])
        reviews_col.create_index([("sku", ASCENDING)])
        reviews_col.create_index([("created_at", DESCENDING)])
        reviews_col.create_index([("toxicity_score", DESCENDING)])
        reviews_col.create_index([
            ("title", "text"),
            ("body", "text"),
            ("customer_name", "text"),
            ("sku", "text"),
            ("product_name", "text")
        ])

        # Ensure default rule exists if collection is empty
        if moderation_rules_col.count_documents({}) == 0:
            default_rule = {
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
            moderation_rules_col.insert_one(default_rule)

        # Seed initial catalog of products if empty (so users have options to review, and can add their own)
        if products_col.count_documents({}) == 0:
            initial_products = [
                {"sku": "SHOE-NIKE-PULSE", "name": "Nike Air Max Pulse", "category": "Air Cushioning", "attribute": "Air Bubble Heel", "icon": "steps"},
                {"sku": "SHOE-ADIDAS-BOOST", "name": "Adidas Ultraboost Light", "category": "Performance Run", "attribute": "Light BOOST Foam", "icon": "sprint"},
                {"sku": "SHOE-AJ1-RETRO", "name": "Air Jordan 1 High OG", "category": "Heritage Classic", "attribute": "Full Grain Leather", "icon": "sports_basketball"},
                {"sku": "SHOE-NB-9060", "name": "New Balance 9060", "category": "Chunky Lifestyle", "attribute": "ABZORB Dual Midsole", "icon": "directions_walk"},
                {"sku": "SHOE-ON-MONSTER", "name": "On Cloudmonster 2", "category": "Max Road Cushion", "attribute": "Monster CloudTec", "icon": "cloud"},
                {"sku": "SHOE-SALOMON-XT6", "name": "Salomon XT-6 Expanse", "category": "Trail / All-Terrain", "attribute": "Agile Chassis System", "icon": "hiking"}
            ]
            products_col.insert_many(initial_products)

        print(f"MongoDB successfully initialized. Connected to: {settings.MONGODB_URL}/{settings.DATABASE_NAME}")
    except Exception as e:
        print(f"MongoDB initialization notice: {e}")
