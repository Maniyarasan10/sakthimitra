from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "ArogyaMitra"
    DATABASE_URL: str = "sqlite:///./arogyamitra.db"
    SECRET_KEY: str = "your-super-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: List[str] = ["*"]
    PORT: int = 8000
    
    GROQ_API_KEY: str = ""
    
    GOOGLE_CALENDAR_CLIENT_ID: str = ""
    GOOGLE_CALENDAR_CLIENT_SECRET: str = ""
    GOOGLE_CALENDAR_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    class Config:
        env_file = ".env"

settings = Settings()