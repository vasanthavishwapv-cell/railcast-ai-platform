import os
from pydantic_settings import BaseSettings

def get_default_db_url() -> str:
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    if os.getenv("VERCEL"):
        return "sqlite:////tmp/railcast.db"
    return "sqlite:///./railcast.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "RAIL-CAST AI"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Database (auto /tmp path on Vercel serverless)
    DATABASE_URL: str = get_default_db_url()
    
    # Simulation & Telemetry
    SIMULATION_INTERVAL_SECONDS: float = 3.0
    CONGESTION_UPDATE_INTERVAL_SECONDS: float = 10.0
    
    # ML Thresholds & Targets
    TARGET_TRAVEL_TIME_MAE: float = 4.0   # minutes
    TARGET_ECE_SCORE: float = 0.05        # Expected Calibration Error
    ANOMALY_ZSCORE_THRESHOLD: float = 2.8 # standard deviations
    
    # CORS (allows all origins, including *.vercel.app)
    CORS_ORIGINS: list[str] = ["*"]
    
    # RailRadar Real-Time API Integration (https://api.railradar.in/v1)
    RAILRADAR_BASE_URL: str = os.getenv("RAILRADAR_BASE_URL", "https://api.railradar.in/v1")
    RAILRADAR_API_KEY: str = os.getenv("RAILRADAR_API_KEY", "")
    RAILRADAR_TIMEOUT_SECONDS: float = 8.0
    RAILRADAR_FALLBACK_SIMULATION: bool = True
    
    class Config:
        case_sensitive = True

settings = Settings()

