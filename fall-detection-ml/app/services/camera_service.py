import cv2
import numpy as np
from typing import Optional
import logging
from datetime import datetime
import asyncio

from ..models.pose_detector import PoseDetector
from ..services.fall_detector import FallDetector
from ..config import settings

logger = logging.getLogger(__name__)

class CameraService:
    def __init__(self):
        self.pose_detector = PoseDetector()
        self.fall_detector = FallDetector()
        self.active_detections = {}  # user_id -> detection info
        
    def process_frame_with_overlay(self, frame: np.ndarray, user_id: str) -> np.ndarray:
        """
        Process frame with pose detection and fall detection overlay
        """
        try:
            # Detect pose and get landmarks
            success, landmarks, processed_frame = self.pose_detector.detect_pose(frame)
            
            if success:
                # Add pose landmarks overlay
                processed_frame = self._add_pose_overlay(processed_frame, landmarks)
                
                # Perform fall detection
                fall_result = self.fall_detector.detect_fall(processed_frame, user_id)
                
                # Add fall detection overlay
                processed_frame = self._add_fall_detection_overlay(
                    processed_frame, fall_result
                )
                
                # Store detection info
                self._update_detection_info(user_id, fall_result)
            
            return processed_frame
            
        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
            return frame
    
    def _add_pose_overlay(self, frame: np.ndarray, landmarks: list) -> np.ndarray:
        """
        Add pose landmarks overlay to frame
        """
        h, w, _ = frame.shape
        
        # Draw stick figure connections
        connections = [
            (11, 12),  # shoulders
            (11, 23),  # left shoulder to hip
            (12, 24),  # right shoulder to hip
            (23, 24),  # hips
            (23, 25),  # left hip to knee
            (24, 26),  # right hip to knee
            (25, 27),  # left knee to ankle
            (26, 28),  # right knee to ankle
        ]
        
        for connection in connections:
            if connection[0] < len(landmarks) and connection[1] < len(landmarks):
                point1 = landmarks[connection[0]]
                point2 = landmarks[connection[1]]
                
                if point1['visibility'] > 0.5 and point2['visibility'] > 0.5:
                    cv2.line(
                        frame,
                        (int(point1['x']), int(point1['y'])),
                        (int(point2['x']), int(point2['y'])),
                        (0, 255, 0),
                        2
                    )
        
        # Draw key points
        for landmark in landmarks:
            if landmark['visibility'] > 0.5:
                cv2.circle(
                    frame,
                    (int(landmark['x']), int(landmark['y'])),
                    5,
                    (255, 0, 0),
                    -1
                )
        
        return frame
    
    def _add_fall_detection_overlay(self, frame: np.ndarray, fall_result: dict) -> np.ndarray:
        """
        Add fall detection overlay to frame
        """
        h, w, _ = frame.shape
        
        # Add semi-transparent background for text
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (350, 120), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.6, frame, 0.4, 0)
        
        # Add detection status
        status_text = "FALL DETECTED!" if fall_result['fall_detected'] else "MONITORING"
        status_color = (0, 0, 255) if fall_result['fall_detected'] else (0, 255, 0)
        
        cv2.putText(
            frame,
            status_text,
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            status_color,
            2
        )
        
        # Add confidence and metrics
        if fall_result['fall_detected']:
            cv2.putText(
                frame,
                f"Confidence: {fall_result['confidence']:.1%}",
                (20, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                1
            )
            cv2.putText(
                frame,
                f"Angle: {fall_result['angle']:.1f}°",
                (20, 90),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                1
            )
            cv2.putText(
                frame,
                f"Velocity: {fall_result['velocity']:.1f}",
                (20, 110),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                1
            )
        
        return frame
    
    def _update_detection_info(self, user_id: str, fall_result: dict):
        """
        Update detection information for user
        """
        if user_id not in self.active_detections:
            self.active_detections[user_id] = {
                'last_detection': None,
                'detection_count': 0,
                'is_falling': False
            }
        
        detection_info = self.active_detections[user_id]
        
        if fall_result['fall_detected']:
            detection_info['last_detection'] = {
                'timestamp': datetime.utcnow(),
                'confidence': fall_result['confidence'],
                'angle': fall_result['angle'],
                'velocity': fall_result['velocity']
            }
            detection_info['detection_count'] += 1
            detection_info['is_falling'] = True
        else:
            detection_info['is_falling'] = False
    
    def start_detection(self, user_id: str):
        """
        Start camera detection for user
        """
        if user_id not in self.active_detections:
            self.active_detections[user_id] = {
                'last_detection': None,
                'detection_count': 0,
                'is_falling': False
            }
        logger.info(f"Started camera detection for user {user_id}")
    
    def stop_detection(self, user_id: str):
        """
        Stop camera detection for user
        """
        if user_id in self.active_detections:
            del self.active_detections[user_id]
        logger.info(f"Stopped camera detection for user {user_id}")
    
    def cleanup_user(self, user_id: str):
        """
        Cleanup all data for user
        """
        self.stop_detection(user_id)
        self.fall_detector.reset_person(user_id)
        logger.info(f"Cleaned up camera data for user {user_id}")
    
    def get_detection_status(self, user_id: str) -> Optional[dict]:
        """
        Get current detection status for user
        """
        return self.active_detections.get(user_id)