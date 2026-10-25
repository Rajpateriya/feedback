from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .models.review import Review, ModerationRule
from .services.seed_data import seed_database
from .routers import reviews, moderation, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed initial database
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scalable Production-Ready Review & Moderation Telemetry Backend",
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

@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "PulseReview Enterprise API",
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to PulseReview API. Explore /docs for OpenAPI specs."
    }
