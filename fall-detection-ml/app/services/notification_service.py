import requests
import logging
from typing import Dict
from ..config import settings

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.backend_url = settings.BACKEND_URL
        
    async def send_fall_notification(self, user_id: str, fall_data: Dict) -> bool:
        """
        Send fall notification to backend
        """
        try:
            payload = {
                'userId': user_id,
                'type': 'FALL_DETECTED',
                'data': {
                    'confidence': fall_data['confidence'],
                    'angle': fall_data['angle'],
                    'velocity': fall_data['velocity'],
                    'timestamp': fall_data['timestamp']
                }
            }
            
            response = requests.post(
                f"{self.backend_url}/api/v1/notifications/fall-detected",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"Fall notification sent successfully for user {user_id}")
                return True
            else:
                logger.error(f"Failed to send notification: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            return False