import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Server settings
    HOST = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
    PORT = int(os.getenv("ML_SERVICE_PORT", 8001))
    
    # API settings
    API_V1_STR = "/api/v1"
    
    # NestJS backend URL
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
    
    # Fall detection parameters
    FALL_THRESHOLD_ANGLE = float(os.getenv("FALL_THRESHOLD_ANGLE", 60.0))
    FALL_THRESHOLD_VELOCITY = float(os.getenv("FALL_THRESHOLD_VELOCITY", 2.5))
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", 0.7))
    
    # Notification settings
    NOTIFICATION_COOLDOWN = int(os.getenv("NOTIFICATION_COOLDOWN", 30))  # seconds
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()