#!/usr/bin/env python3
"""
Fixed Real-time Fall Detection Camera Application
Handles camera access and display issues
"""

import cv2
import numpy as np
import requests
import json
import time
import base64
import logging
import argparse
import platform
import os
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealTimeFallDetection:
    def __init__(self, server_url="http://localhost:8001", user_id="default"):
        self.server_url = server_url
        self.user_id = user_id
        
        # Initialize camera with better error handling
        self.cap = None
        self.initialize_camera()
        
        self.detection_active = False
        self.frame_queue = []
        self.max_queue_size = 5
        
    def initialize_camera(self):
        """Initialize camera with multiple fallback attempts"""
        camera_indices = [0, 1, 2]  # Try multiple camera indices
        backend_preferences = [
            cv2.CAP_DSHOW,  # Windows
            cv2.CAP_V4L2,   # Linux
            cv2.CAP_AVFOUNDATION,  # macOS
            cv2.CAP_ANY     # Any available backend
        ]
        
        for backend in backend_preferences:
            for index in camera_indices:
                try:
                    self.cap = cv2.VideoCapture(index, backend)
                    if self.cap.isOpened():
                        # Set camera properties
                        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                        self.cap.set(cv2.CAP_PROP_FPS, 30)
                        
                        # Test read
                        ret, frame = self.cap.read()
                        if ret:
                            logger.info(f"Camera initialized successfully with backend {backend} on index {index}")
                            return
                        else:
                            self.cap.release()
                except Exception as e:
                    logger.warning(f"Failed to open camera {index} with backend {backend}: {e}")
                    if self.cap:
                        self.cap.release()
        
        # If no camera works, create a test pattern
        logger.error("No camera available, creating test pattern")
        self.create_test_pattern()
    
    def create_test_pattern(self):
        """Create a test pattern when camera is not available"""
        self.cap = None
        self.test_pattern_enabled = True
        self.frame_count = 0
        
        # Try to use a video file as fallback
        self.video_fallback_paths = [
            "test_video.mp4",
            "sample.mp4",
            "/dev/video0"  # Linux video device
        ]
        
        for video_path in self.video_fallback_paths:
            if os.path.exists(video_path):
                try:
                    self.cap = cv2.VideoCapture(video_path)
                    if self.cap.isOpened():
                        logger.info(f"Using video file: {video_path}")
                        self.test_pattern_enabled = False
                        return
                except:
                    continue
        
        # If no video file, create synthetic frames
        logger.info("Using synthetic test pattern")
        self.test_pattern_enabled = True
    
    def generate_test_frame(self):
        """Generate synthetic test frames for testing"""
        width, height = 640, 480
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Animate a simple pattern
        self.frame_count += 1
        
        # Background
        frame[:] = (50, 50, 50)
        
        # Moving circle
        x = (self.frame_count * 2) % width
        y = height // 2
        cv2.circle(frame, (x, y), 50, (0, 255, 0), -1)
        
        # Simulate person (rectangle)
        person_x = width // 2
        person_y = height // 2
        person_height = 200
        person_width = 60
        
        # Simulate fall if detection is active
        if self.detection_active and (self.frame_count % 100) < 30:
            # Fallen position
            cv2.rectangle(frame, 
                         (person_x - person_width//2, person_y), 
                         (person_x + person_width//2, person_y + person_height//3), 
                         (255, 255, 255), -1)
            cv2.putText(frame, "FALL DETECTED", (person_x - 80, person_y - 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        else:
            # Standing position
            cv2.rectangle(frame, 
                         (person_x - person_width//2, person_y - person_height), 
                         (person_x + person_width//2, person_y), 
                         (255, 255, 255), -1)
        
        # Add timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, timestamp, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Add status
        status = "DETECTION ACTIVE" if self.detection_active else "MONITORING"
        cv2.putText(frame, status, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, 
                   (0, 255, 0) if self.detection_active else (0, 255, 255), 1)
        
        return frame
    
    def capture_frame(self):
        """Capture frame with fallback options"""
        if self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                return frame
            else:
                # End of video file, restart
                if hasattr(self, 'cap') and self.cap:
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = self.cap.read()
                    if ret:
                        return frame
        
        # Fallback to test pattern
        if self.test_pattern_enabled:
            return self.generate_test_frame()
        
        # Ultimate fallback - black frame with text
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(frame, "NO CAMERA AVAILABLE", (100, 240), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(frame, "Using test pattern", (150, 280), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        return frame
    
    def send_frame_to_server(self, frame):
        """Send frame to server for processing"""
        try:
            # Encode frame to JPEG
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frame_bytes = buffer.tobytes()
            
            # Send to server
            files = {'file': ('frame.jpg', frame_bytes, 'image/jpeg')}
            data = {'user_id': self.user_id}
            
            response = requests.post(
                f"{self.server_url}/api/v1/detect-fall",
                files=files,
                data=data,
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Server error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return None
    
    def add_overlay_to_frame(self, frame, result):
        """Add detection overlay to frame"""
        h, w, _ = frame.shape
        
        if result and result.get('fall_detected'):
            # Fall detected - add red overlay
            confidence = result.get('confidence', 0)
            angle = result.get('angle', 0)
            velocity = result.get('velocity', 0)
            
            cv2.rectangle(frame, (10, 10), (350, 120), (0, 0, 255), -1)
            cv2.putText(frame, "FALL DETECTED!", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, f"Confidence: {confidence:.1%}", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(frame, f"Angle: {angle:.1f}°", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(frame, f"Velocity: {velocity:.1f}", (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            # Flashing effect for high confidence falls
            if confidence > 0.8:
                alpha = 0.3
                overlay = frame.copy()
                cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 255), -1)
                frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
                
        else:
            # Normal monitoring - add green overlay
            cv2.rectangle(frame, (10, 10), (300, 60), (0, 255, 0), -1)
            cv2.putText(frame, "MONITORING", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        
        return frame
    
    def handle_fall_detection(self, result):
        """Handle fall detection result"""
        if result and result.get('fall_detected'):
            current_time = time.time()
            
            # Check cooldown to avoid spam
            if current_time - self.last_detection_time > 5:  # 5 second cooldown
                self.last_detection_time = current_time
                
                logger.warning(f"FALL DETECTED! Confidence: {result['confidence']:.1%}")
                
                # Send notification to server
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
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        logger.info("Fall notification sent to server")
                    else:
                        logger.error(f"Failed to send notification: {response.status_code}")
                        
                except Exception as e:
                    logger.error(f"Error sending notification: {e}")
    
    def run(self):
        """Main run loop with improved display handling"""
        # Try different display backends
        display_backends = [
            cv2.CAP_ANY,           # Any available
            cv2.CAP_DSHOW,         # Windows DirectShow
            cv2.CAP_V4L2,          # Linux V4L2
            cv2.CAP_GSTREAMER,     # GStreamer
        ]
        
        # Set display backend based on platform
        if platform.system() == 'Windows':
            os.environ['OPENCV_VIDEOIO_BACKEND'] = 'dshow'
        elif platform.system() == 'Linux':
            os.environ['OPENCV_VIDEOIO_BACKEND'] = 'v4l2'
        elif platform.system() == 'Darwin':  # macOS
            os.environ['OPENCV_VIDEOIO_BACKEND'] = 'avfoundation'
        
        # Try to create window
        window_created = False
        try:
            cv2.namedWindow('Fall Detection Camera', cv2.WINDOW_NORMAL)
            window_created = True
        except Exception as e:
            logger.warning(f"Could not create window: {e}")
        
        logger.info("Starting fall detection camera...")
        logger.info("Press 'D' to toggle detection")
        logger.info("Press 'Q' to quit")
        
        frame_count = 0
        last_fps_time = time.time()
        fps = 0
        
        try:
            while True:
                # Capture frame
                frame = self.capture_frame()
                
                if frame is not None:
                    # Process frame if detection is active
                    if self.detection_active:
                        result = self.send_frame_to_server(frame)
                        frame = self.add_overlay_to_frame(frame, result)
                        self.handle_fall_detection(result)
                    
                    # Calculate FPS
                    frame_count += 1
                    current_time = time.time()
                    if current_time - last_fps_time >= 1.0:
                        fps = frame_count / (current_time - last_fps_time)
                        frame_count = 0
                        last_fps_time = current_time
                    
                    # Add FPS counter
                    cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    
                    # Show frame if window was created
                    if window_created:
                        try:
                            cv2.imshow('Fall Detection Camera', frame)
                            
                            # Handle keyboard input
                            key = cv2.waitKey(1) & 0xFF
                            if key == ord('q'):
                                break
                            elif key == ord('d'):
                                self.detection_active = not self.detection_active
                                logger.info(f"Detection {'started' if self.detection_active else 'stopped'}")
                                
                        except Exception as e:
                            logger.warning(f"Could not display frame: {e}")
                            # Continue without display
                            if key == ord('q'):
                                break
                    else:
                        # No display available, just process
                        if self.detection_active:
                            result = self.send_frame_to_server(frame)
                            self.handle_fall_detection(result)
                            
                # Small delay to prevent CPU overload
                time.sleep(0.01)
                        
        except KeyboardInterrupt:
            logger.info("Application stopped by user")
        finally:
            # Cleanup
            if self.cap:
                self.cap.release()
            if window_created:
                try:
                    cv2.destroyAllWindows()
                except:
                    pass
            logger.info("Camera stopped")
    
    def test_camera_connection(self):
        """Test camera connection and provide diagnostic information"""
        logger.info("Testing camera connection...")
        
        # Test different backends
        backends = [
            (cv2.CAP_DSHOW, "DirectShow"),
            (cv2.CAP_V4L2, "V4L2"),
            (cv2.CAP_AVFOUNDATION, "AVFoundation"),
            (cv2.CAP_ANY, "Any"),
        ]
        
        for backend, name in backends:
            try:
                cap = cv2.VideoCapture(0, backend)
                if cap.isOpened():
                    ret, frame = cap.read()
                    if ret:
                        logger.info(f"✅ Camera works with {name} backend")
                        logger.info(f"Frame shape: {frame.shape}")
                        cap.release()
                        return True
                    else:
                        logger.warning(f"❌ Camera opened but cannot read frames with {name}")
                cap.release()
            except Exception as e:
                logger.warning(f"❌ Failed with {name}: {e}")
        
        # Check available cameras
        logger.info("Checking available camera indices...")
        for i in range(5):
            try:
                cap = cv2.VideoCapture(i)
                if cap.isOpened():
                    logger.info(f"✅ Camera found at index {i}")
                    cap.release()
                else:
                    logger.info(f"❌ No camera at index {i}")
            except:
                logger.info(f"❌ Cannot access index {i}")
        
        return False

def main():
    parser = argparse.ArgumentParser(description='Fixed Fall Detection Camera App')
    parser.add_argument('--server-url', default='http://localhost:8001', 
                       help='ML server URL (default: http://localhost:8001)')
    parser.add_argument('--user-id', default='default', 
                       help='User ID (default: default)')
    parser.add_argument('--test-camera', action='store_true', 
                       help='Test camera connection and exit')
    parser.add_argument('--no-display', action='store_true', 
                       help='Run without display (headless mode)')
    
    args = parser.parse_args()
    
    app = RealTimeFallDetection(
        server_url=args.server_url,
        user_id=args.user_id
    )
    
    if args.test_camera:
        app.test_camera_connection()
        return
    
    try:
        app.run()
    except KeyboardInterrupt:
        logger.info("Application stopped by user")

if __name__ == "__main__":
    main()