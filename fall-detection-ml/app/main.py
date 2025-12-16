from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import json
import logging
from typing import Dict, List
import asyncio
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image
import uvicorn
from pathlib import Path

from .config import settings
from .services.fall_detector import FallDetector
from .services.notification_service import NotificationService
from .services.camera_service import CameraService

# Configure logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fall Detection ML Service",
    description="AI-powered real-time fall detection service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
fall_detector = FallDetector()
notification_service = NotificationService()
camera_service = CameraService()

# WebSocket connections
active_connections: List[WebSocket] = []

@app.get("/")
async def root():
    return {"message": "Fall Detection ML Service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/v1/detect-fall")
async def detect_fall_endpoint(file: UploadFile = File(...), user_id: str = "default"):
    """
    Detect fall from uploaded image
    """
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Detect fall
        result = fall_detector.detect_fall(frame, user_id)
        
        # Send notification if fall detected
        if result['fall_detected'] and result.get('should_notify', False):
            await notification_service.send_fall_notification(user_id, result)
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/fall-detection/{user_id}")
async def websocket_fall_detection(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time fall detection with camera stream
    """
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Receive frame data
            data = await websocket.receive_bytes()
            
            # Decode frame
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is not None:
                # Detect fall
                result = fall_detector.detect_fall(frame, user_id)
                
                # Send notification if fall detected
                if result['fall_detected'] and result.get('should_notify', False):
                    await notification_service.send_fall_notification(user_id, result)
                
                # Send result back to client
                await websocket.send_json({
                    'fall_detected': result['fall_detected'],
                    'confidence': result['confidence'],
                    'angle': result['angle'],
                    'velocity': result['velocity'],
                    'timestamp': result['timestamp'],
                    'landmarks': result['landmarks'],
                    'processed_frame': _encode_frame_to_base64(result['processed_frame'])
                })
                
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        fall_detector.reset_person(user_id)
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if websocket in active_connections:
            active_connections.remove(websocket)

@app.post("/api/v1/reset-detector/{user_id}")
async def reset_detector(user_id: str):
    """
    Reset fall detector for specific user
    """
    fall_detector.reset_person(user_id)
    return {"message": f"Detector reset for user {user_id}"}

@app.websocket("/ws/camera-stream/{user_id}")
async def websocket_camera_stream(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time camera streaming with fall detection overlay
    """
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Receive frame data
            data = await websocket.receive_bytes()
            
            # Decode frame
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is not None:
                # Process frame with fall detection and overlay
                processed_frame = camera_service.process_frame_with_overlay(frame, user_id)
                
                # Encode processed frame back to bytes
                _, buffer = cv2.imencode('.jpg', processed_frame)
                processed_bytes = buffer.tobytes()
                
                # Send processed frame back to client
                await websocket.send_bytes(processed_bytes)
                
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        camera_service.cleanup_user(user_id)
        logger.info(f"Camera stream disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"Camera stream error: {str(e)}")
        if websocket in active_connections:
            active_connections.remove(websocket)

@app.post("/api/v1/start-camera-detection/{user_id}")
async def start_camera_detection(user_id: str):
    """
    Start camera-based fall detection for a user
    """
    camera_service.start_detection(user_id)
    return {"message": f"Camera detection started for user {user_id}"}

@app.post("/api/v1/stop-camera-detection/{user_id}")
async def stop_camera_detection(user_id: str):
    """
    Stop camera-based fall detection for a user
    """
    camera_service.stop_detection(user_id)
    return {"message": f"Camera detection stopped for user {user_id}"}

def _encode_frame_to_base64(frame: np.ndarray) -> str:
    """Encode frame to base64 string"""
    _, buffer = cv2.imencode('.jpg', frame)
    return base64.b64encode(buffer).decode('utf-8')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )