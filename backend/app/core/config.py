import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hierarchical Attendance Management System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-key-change-in-production-1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SQLite local database
    DATABASE_URL: str = "sqlite:///./attendance.db"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
