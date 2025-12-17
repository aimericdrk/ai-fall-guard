#!/usr/bin/env python3
"""
Fixed Headless Fall Detection Camera Application
Handles connection issues and Docker networking
"""

import cv2
import numpy as np
import requests
import json
import time
import logging
import argparse
import os
import socket
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class HeadlessFallDetection:
    def __init__(self, server_url="http://localhost:8001", user_id="default"):
        # Use Docker service name instead of localhost
        self.server_url = server_url  # Changed from localhost to service name
        self.user_id = user_id
        
        # Use headless OpenCV
        os.environ['QT_QPA_PLATFORM'] = 'offscreen'
        os.environ['OPENCV_VIDEOIO_BACKEND'] = 'opencv'
        
        self.cap = None
        self.detection_active = True
        self.frame_count = 0
        self.fall_count = 0
        self.last_detection_time = 0
        
        # Test server connection first
        self.test_server_connection()
        self.initialize_camera()
        
    def test_server_connection(self):
        """Test connection to server before starting"""
        logger.info(f"Testing connection to {self.server_url}...")
        
        max_retries = 3
        for i in range(max_retries):
            try:
                response = requests.get(
                    f"{self.server_url}/health",
                    timeout=5
                )
                if response.status_code == 200:
                    logger.info("✅ Server connection successful")
                    return
                else:
                    logger.warning(f"⚠️ Server returned status {response.status_code}")
            except requests.exceptions.ConnectionError:
                logger.warning(f"❌ Connection attempt {i+1}/{max_retries} failed")
                if i < max_retries - 1:
                    time.sleep(2)
                else:
                    logger.error("❌ Could not connect to server")
                    logger.info("💡 Make sure the server is running and accessible")
                    logger.info("💡 For Docker: use service name (e.g., http://localhost:8001)")
                    logger.info("💡 For local: use http://localhost:8001")
                    raise Exception("Server connection failed")
            except Exception as e:
                logger.error(f"❌ Error testing server connection: {e}")
                if i < max_retries - 1:
                    time.sleep(2)
                else:
                    raise
    
    def initialize_camera(self):
        """Initialize camera without GUI dependencies"""
        logger.info("Initializing camera...")
        
        # Try different camera indices without GUI backends
        camera_indices = [0, 1, 2]
        
        for index in camera_indices:
            try:
                self.cap = cv2.VideoCapture(index)
                if self.cap.isOpened():
                    ret, frame = self.cap.read()
                    if ret:
                        logger.info(f"✅ Camera initialized successfully at index {index}")
                        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                        self.cap.set(cv2.CAP_PROP_FPS, 30)
                        return
                    else:
                        self.cap.release()
                        logger.warning(f"⚠️ Camera opened but cannot read frames at index {index}")
                else:
                    logger.warning(f"❌ Cannot open camera at index {index}")
                    
            except Exception as e:
                logger.warning(f"❌ Failed to open camera {index}: {e}")
                if self.cap:
                    self.cap.release()
        
        # No camera available - use synthetic data
        logger.info("No camera available, will use synthetic test data")
        self.cap = None
        self.create_synthetic_camera()
    
    def create_synthetic_camera(self):
        """Create synthetic camera data for testing"""
        self.synthetic_enabled = True
        self.synthetic_frame = 0
        logger.info("Created synthetic camera for testing")
    
    def capture_synthetic_frame(self):
        """Generate synthetic test frames"""
        width, height = 640, 480
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Background
        frame[:] = (40, 40, 40)
        
        # Simulate person
        self.synthetic_frame += 1
        center_x = width // 2
        
        # Simulate fall every 100 frames
        if (self.synthetic_frame % 200) < 50:
            # Fallen position (horizontal rectangle)
            person_height = 60
            person_width = 120
            y_pos = height // 2
            cv2.rectangle(frame, 
                         (center_x - person_width//2, y_pos), 
                         (center_x + person_width//2, y_pos + person_height), 
                         (200, 200, 200), -1)
            
            # Add "FALL DETECTED" text
            cv2.putText(frame, "FALL DETECTED", (center_x - 80, y_pos - 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        else:
            # Standing position (vertical rectangle)
            person_height = 180
            person_width = 40
            y_pos = height // 2
            cv2.rectangle(frame, 
                         (center_x - person_width//2, y_pos - person_height//2), 
                         (center_x + person_width//2, y_pos + person_height//2), 
                         (200, 200, 200), -1)
        
        # Add timestamp
        timestamp = datetime.now().strftime("%H:%M:%S")
        cv2.putText(frame, timestamp, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        # Add frame counter
        cv2.putText(frame, f"Frame: {self.synthetic_frame}", (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Add detection status
        status = "DETECTION ACTIVE" if self.detection_active else "MONITORING"
        cv2.putText(frame, status, (10, 90), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, 
                   (0, 255, 0) if self.detection_active else (0, 255, 255), 1)
        
        return frame
    
    def capture_frame(self):
        """Capture frame without GUI dependencies"""
        if self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                return frame
            else:
                # End of video or camera error
                if hasattr(self, 'cap') and self.cap:
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = self.cap.read()
                    if ret:
                        return frame
        
        # Use synthetic data
        if hasattr(self, 'synthetic_enabled') and self.synthetic_enabled:
            return self.capture_synthetic_frame()
        
        # Ultimate fallback
        return np.zeros((480, 640, 3), dtype=np.uint8)
    
    def process_frame(self, frame):
        """Process frame and send to server with better error handling"""
        try:
            # Encode frame
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frame_bytes = buffer.tobytes()
            
            # Send to server
            files = {'file': ('frame.jpg', frame_bytes, 'image/jpeg')}
            data = {'user_id': self.user_id}
            
            # Use longer timeout for Docker/network latency
            response = requests.post(
                f"{self.server_url}/api/v1/detect-fall",
                files=files,
                data=data,
                timeout=15  # Increased timeout for Docker
            )
            
            if response.status_code == 200:
                result = response.json()
                return result
            else:
                logger.error(f"Server error: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.ConnectionError as e:
            logger.error(f"❌ Connection refused to {self.server_url}: {e}")
            logger.info("💡 Make sure the server is running at the correct address")
            return None
        except requests.exceptions.Timeout as e:
            logger.error(f"⏰ Request timeout: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Error processing frame: {e}")
            return None
    
    def handle_detection_result(self, result):
        """Handle detection result and send notifications"""
        if result and result.get('fall_detected'):
            current_time = time.time()
            
            # Rate limiting - 5 second cooldown
            if current_time - self.last_detection_time > 5:
                self.last_detection_time = current_time
                self.fall_count += 1
                
                logger.warning("🚨 FALL DETECTED!")
                logger.info(f"   Confidence: {result['confidence']:.1%}")
                logger.info(f"   Angle: {result['angle']:.1f}°")
                logger.info(f"   Velocity: {result['velocity']:.1f}")
                
                # Send notification
                self.send_notification(result)
    
    def send_notification(self, result):
        """Send fall notification to server"""
        try:
            notification_data = {
                'userId': self.user_id,
                'type': 'FALL_DETECTED',
                'data': {
                    'confidence': result['confidence'],
                    'angle': result['angle'],
                    'velocity': result['velocity'],
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
            
            response = requests.post(
                f"{self.server_url}/api/v1/notifications/fall-detected",
                json=notification_data,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info("✅ Fall notification sent successfully")
            else:
                logger.error(f"❌ Failed to send notification: {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ Error sending notification: {e}")
    
    def run(self):
        """Main run loop for headless operation"""
        logger.info("🚀 Starting headless fall detection...")
        logger.info(f"💡 Connecting to server: {self.server_url}")
        logger.info("💡 Running without display - check logs for detections")
        
        if not hasattr(self, 'cap') or not self.cap:
            logger.info("Using synthetic camera data")
        
        frame_count = 0
        last_log_time = time.time()
        
        try:
            while True:
                # Capture frame
                frame = self.capture_frame()
                
                if frame is not None:
                    frame_count += 1
                    
                    # Process frame
                    result = self.process_frame(frame)
                    
                    # Handle detection
                    self.handle_detection_result(result)
                    
                    # Log status periodically
                    current_time = time.time()
                    if current_time - last_log_time >= 5:  # Every 5 seconds
                        fps = frame_count / (current_time - last_log_time)
                        logger.info(f"📊 FPS: {fps:.1f} | Frames: {frame_count} | Falls: {self.fall_count}")
                        frame_count = 0
                        last_log_time = current_time
                    
                    # Small delay to prevent CPU overload
                    time.sleep(0.033)  # ~30 FPS
                
                else:
                    logger.warning("No frame available")
                    time.sleep(0.1)
                    
        except KeyboardInterrupt:
            logger.info("🛑 Headless detection stopped by user")
        except Exception as e:
            logger.error(f"❌ Error in main loop: {e}")
        finally:
            if self.cap:
                self.cap.release()
            
            logger.info(f"📈 Total frames processed: {frame_count}")
            logger.info(f"📊 Total falls detected: {self.fall_count}")

def main():
    parser = argparse.ArgumentParser(description='Fixed Headless Fall Detection Camera App')
    parser.add_argument('--server-url', default='http://localhost:8001', 
                       help='ML server URL (default: http://localhost:8001)')
    parser.add_argument('--user-id', default='default', 
                       help='User ID (default: default)')
    parser.add_argument('--verbose', action='store_true', 
                       help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    app = HeadlessFallDetection(args.server_url, args.user_id)
    
    try:
        app.run()
    except KeyboardInterrupt:
        logger.info("Application stopped")

if __name__ == "__main__":
    main()