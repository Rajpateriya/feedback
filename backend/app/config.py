import os

class Settings:
    PROJECT_NAME: str = "PulseReview Enterprise Moderation System"
    API_V1_STR: str = "/api"
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "feedback_db")
    PORT: int = int(os.getenv("PORT", 8008))
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
