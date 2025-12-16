import time
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime
from ..models.pose_detector import PoseDetector
from ..config import settings

class FallDetector:
    def __init__(self):
        self.pose_detector = PoseDetector()
        self.previous_positions = {}
        self.fall_history = {}
        self.last_notification_time = {}
        
    def detect_fall(self, frame: np.ndarray, person_id: str = "default") -> Dict:
        """
        Detect if a person has fallen
        """
        result = {
            'fall_detected': False,
            'confidence': 0.0,
            'angle': 0.0,
            'velocity': 0.0,
            'landmarks': [],
            'processed_frame': frame,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Detect pose
        success, landmarks, processed_frame = self.pose_detector.detect_pose(frame)
        
        if not success:
            return result
        
        result['landmarks'] = landmarks
        
        # Calculate body angle
        body_angle = self.pose_detector.get_body_angle(landmarks)
        result['angle'] = body_angle
        
        # Calculate velocity if we have previous position
        velocity = 0.0
        current_time = time.time()
        
        if person_id in self.previous_positions:
            prev_data = self.previous_positions[person_id]
            prev_time = prev_data['timestamp']
            prev_bbox = prev_data['bbox']
            
            current_bbox = self.pose_detector.get_person_bounding_box(landmarks)
            
            if current_bbox and prev_bbox:
                # Calculate center movement
                prev_center_y = (prev_bbox['y_min'] + prev_bbox['y_max']) / 2
                current_center_y = (current_bbox['y_min'] + current_bbox['y_max']) / 2
                
                time_diff = current_time - prev_time
                if time_diff > 0:
                    velocity = abs(current_center_y - prev_center_y) / time_diff
        
        result['velocity'] = velocity
        
        # Fall detection logic
        fall_confidence = 0.0
        
        # Check body angle (horizontal position)
        if body_angle > settings.FALL_THRESHOLD_ANGLE:
            fall_confidence += 0.5
        
        # Check velocity (sudden movement)
        if velocity > settings.FALL_THRESHOLD_VELOCITY:
            fall_confidence += 0.3
        
        # Check if person is close to ground
        bbox = self.pose_detector.get_person_bounding_box(landmarks)
        if bbox:
            frame_height = frame.shape[0]
            if bbox['y_max'] > frame_height * 0.8:  # Close to bottom of frame
                fall_confidence += 0.2
        
        result['confidence'] = min(fall_confidence, 1.0)
        result['fall_detected'] = fall_confidence >= settings.CONFIDENCE_THRESHOLD
        
        # Update history
        self.previous_positions[person_id] = {
            'timestamp': current_time,
            'bbox': bbox,
            'angle': body_angle
        }
        
        # Check if we should send notification
        if result['fall_detected']:
            cooldown_passed = self._check_notification_cooldown(person_id)
            if cooldown_passed:
                result['should_notify'] = True
                self.last_notification_time[person_id] = current_time
        
        result['processed_frame'] = processed_frame
        return result
    
    def _check_notification_cooldown(self, person_id: str) -> bool:
        """
        Check if enough time has passed since last notification
        """
        if person_id not in self.last_notification_time:
            return True
        
        current_time = time.time()
        time_since_last = current_time - self.last_notification_time[person_id]
        
        return time_since_last >= settings.NOTIFICATION_COOLDOWN
    
    def reset_person(self, person_id: str):
        """
        Reset data for a specific person
        """
        if person_id in self.previous_positions:
            del self.previous_positions[person_id]
        if person_id in self.last_notification_time:
            del self.last_notification_time[person_id]