import cv2
import mediapipe as mp
import numpy as np
from typing import List, Dict, Optional, Tuple

class PoseDetector:
    def __init__(self, static_image_mode=False, model_complexity=1, min_detection_confidence=0.7):
        self.mp_pose = mp.solutions.pose
        self.mp_draw = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            static_image_mode=static_image_mode,
            model_complexity=model_complexity,
            min_detection_confidence=min_detection_confidence
        )
        
        # Define key points for fall detection
        self.KEY_POINTS = {
            'NOSE': 0,
            'LEFT_SHOULDER': 11,
            'RIGHT_SHOULDER': 12,
            'LEFT_HIP': 23,
            'RIGHT_HIP': 24,
            'LEFT_KNEE': 25,
            'RIGHT_KNEE': 26,
            'LEFT_ANKLE': 27,
            'RIGHT_ANKLE': 28
        }
    
    def detect_pose(self, frame: np.ndarray) -> Tuple[bool, List[Dict], np.ndarray]:
        """
        Detect pose in frame and return landmarks
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_frame)
        
        landmarks = []
        success = False
        
        if results.pose_landmarks:
            success = True
            h, w, _ = frame.shape
            
            for idx, landmark in enumerate(results.pose_landmarks.landmark):
                landmarks.append({
                    'id': idx,
                    'x': int(landmark.x * w),
                    'y': int(landmark.y * h),
                    'z': landmark.z,
                    'visibility': landmark.visibility
                })
            
            # Draw pose landmarks
            self.mp_draw.draw_landmarks(
                frame, 
                results.pose_landmarks, 
                self.mp_pose.POSE_CONNECTIONS,
                self.mp_draw.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=2),
                self.mp_draw.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2)
            )
        
        return success, landmarks, frame
    
    def get_body_angle(self, landmarks: List[Dict]) -> float:
        """
        Calculate the angle of the body relative to the ground
        """
        if not landmarks:
            return 0.0
        
        # Get shoulder and hip points
        left_shoulder = landmarks[self.KEY_POINTS['LEFT_SHOULDER']]
        right_shoulder = landmarks[self.KEY_POINTS['RIGHT_SHOULDER']]
        left_hip = landmarks[self.KEY_POINTS['LEFT_HIP']]
        right_hip = landmarks[self.KEY_POINTS['RIGHT_HIP']]
        
        # Calculate center points
        shoulder_center = {
            'x': (left_shoulder['x'] + right_shoulder['x']) / 2,
            'y': (left_shoulder['y'] + right_shoulder['y']) / 2
        }
        
        hip_center = {
            'x': (left_hip['x'] + right_hip['x']) / 2,
            'y': (left_hip['y'] + right_hip['y']) / 2
        }
        
        # Calculate body vector
        body_vector = {
            'x': shoulder_center['x'] - hip_center['x'],
            'y': shoulder_center['y'] - hip_center['y']
        }
        
        # Calculate angle with vertical axis
        angle = np.arctan2(abs(body_vector['x']), abs(body_vector['y']))
        angle_degrees = np.degrees(angle)
        
        return angle_degrees
    
    def get_person_bounding_box(self, landmarks: List[Dict]) -> Dict:
        """
        Get bounding box of person from landmarks
        """
        if not landmarks:
            return None
        
        x_coords = [lm['x'] for lm in landmarks if lm['visibility'] > 0.5]
        y_coords = [lm['y'] for lm in landmarks if lm['visibility'] > 0.5]
        
        if not x_coords or not y_coords:
            return None
        
        return {
            'x_min': min(x_coords),
            'y_min': min(y_coords),
            'x_max': max(x_coords),
            'y_max': max(y_coords),
            'width': max(x_coords) - min(x_coords),
            'height': max(y_coords) - min(y_coords)
        }