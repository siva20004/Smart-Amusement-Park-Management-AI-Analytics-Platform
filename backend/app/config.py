import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartPark AI - Intelligent Amusement Park Management Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database URL: Supports PostgreSQL (Neon/Render/local) or falls back to SQLite
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartpark.db")
    
    # JWT & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fujiq-dx-smartpark-supersecret-jwt-key-2026-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEMO_MODE: bool = True
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
