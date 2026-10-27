from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db, client, db, products_col, serialize_doc
from .routers import reviews, moderation, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize MongoDB collections and indexes (zero seed reviews)
    init_db()
    yield
    # Shutdown
    client.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scalable Production-Ready MongoDB Review & Moderation Telemetry Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend Vite development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(reviews.router, prefix=settings.API_V1_STR)
app.include_router(moderation.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/api/products")
def get_products():
    """Top-level products endpoint for frontend selectors."""
    return list(products_col.find({}, {"_id": 0}))

@app.get("/api/tags")
def get_tags():
    """Retrieve review tags directly from MongoDB Atlas."""
    from .database import tags_col
    docs = list(tags_col.find({}, {"name": 1, "_id": 0}))
    return [d["name"] for d in docs]

@app.get("/api/channels")
def get_channels():
    """Retrieve sales channels directly from MongoDB Atlas."""
    from .database import channels_col
    docs = list(channels_col.find({}, {"name": 1, "_id": 0}))
    return [d["name"] for d in docs]

@app.get("/api/health")
def healthcheck():
    try:
        # Ping MongoDB
        client.admin.command('ping')
        mongo_status = "connected"
    except Exception as e:
        mongo_status = f"error: {str(e)}"

    return {
        "status": "healthy" if mongo_status == "connected" else "degraded",
        "service": "PulseReview Enterprise API",
        "database": "MongoDB",
        "database_status": mongo_status,
        "database_name": settings.DATABASE_NAME,
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to PulseReview API backed by MongoDB. Explore /docs for OpenAPI specs."
    }
