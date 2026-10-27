from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
import datetime
from .config import settings

client = MongoClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

reviews_col = db["reviews"]
moderation_rules_col = db["moderation_rules"]
products_col = db["products"]
tags_col = db["tags"]
channels_col = db["channels"]

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
    """Initialize MongoDB indexes and populate database collections if empty."""
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

        from .services.seed_data import seed_database
        seed_database(force=False)

        print(f"MongoDB successfully initialized. Connected to: {settings.DATABASE_NAME}")
    except Exception as e:
        print(f"MongoDB initialization notice: {e}")
