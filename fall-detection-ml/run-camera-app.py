#!/usr/bin/env python3
"""
Real-time Fall Detection Camera Application
Streams video with fall detection overlay and notifies server
"""

import cv2
import numpy as np
import requests
import asyncio
import websockets
import json
import base64
import time
from datetime import datetime
import argparse
import logging
from pathlib import Path
import threading
import queue

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealTimeFallDetection:
    def __init__(self, server_url="http://localhost:8001", user_id="default"):
        self.server_url = server_url
        self.user_id = user_id
        self.ws_url = server_url.replace("http://", "ws://").replace("https://", "wss://")
        
        # Initialize camera
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        # Detection parameters
        self.detection_active = False
        self.frame_queue = queue.Queue(maxsize=10)
        self.result_queue = queue.Queue(maxsize=10)
        
        # WebSocket connection
        self.websocket = None
        self.ws_connected = False
        
    async def connect_to_server(self):
        """Connect to WebSocket server"""
        try:
            ws_url = f"{self.ws_url}/ws/camera-stream/{self.user_id}"
            self.websocket = await websockets.connect(ws_url)
            self.ws_connected = True
            logger.info(f"Connected to WebSocket server at {ws_url}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            return False
    
    async def send_frame_to_server(self, frame):
        """Send frame to server for processing"""
        if not self.ws_connected or not self.detection_active:
            return
            
        try:
            # Encode frame to JPEG
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frame_bytes = buffer.tobytes()
            
            # Send frame to server
            await self.websocket.send(frame_bytes)
            
            # Receive processed frame
            processed_bytes = await self.websocket.recv()
            
            # Decode processed frame
            nparr = np.frombuffer(processed_bytes, np.uint8)
            processed_frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return processed_frame
            
        except Exception as e:
            logger.error(f"Error sending frame to server: {e}")
            return frame
    
    def capture_frames(self):
        """Capture frames from camera"""
        while True:
            ret, frame = self.cap.read()
            if ret:
                if self.frame_queue.full():
                    self.frame_queue.get()
                self.frame_queue.put(frame)
            else:
                logger.error("Failed to capture frame")
                break
    
    def display_frames(self):
        """Display processed frames"""
        cv2.namedWindow('Fall Detection Camera', cv2.WINDOW_NORMAL)
        
        while True:
            try:
                # Get processed frame from queue or use original
                if not self.result_queue.empty():
                    frame = self.result_queue.get()
                elif not self.frame_queue.empty():
                    frame = self.frame_queue.get()
                else:
                    continue
                
                # Add UI overlay
                display_frame = self.add_ui_overlay(frame)
                
                # Show frame
                cv2.imshow('Fall Detection Camera', display_frame)
                
                # Handle keyboard input
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                elif key == ord('d'):
                    self.toggle_detection()
                elif key == ord('r'):
                    self.reset_detector()
                    
            except Exception as e:
                logger.error(f"Error displaying frame: {e}")
                break
        
        cv2.destroyAllWindows()
    
    def add_ui_overlay(self, frame):
        """Add UI overlay to frame"""
        h, w, _ = frame.shape
        
        # Add status bar
        status_color = (0, 255, 0) if self.detection_active else (0, 0, 255)
        status_text = "DETECTION ACTIVE" if self.detection_active else "DETECTION STOPPED"
        
        cv2.rectangle(frame, (10, 10), (300, 60), status_color, -1)
        cv2.putText(frame, status_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Add instructions
        cv2.putText(frame, "Press 'D' to toggle detection", (10, h - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, "Press 'R' to reset detector", (10, h - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, "Press 'Q' to quit", (10, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        return frame
    
    def toggle_detection(self):
        """Toggle fall detection"""
        self.detection_active = not self.detection_active
        logger.info(f"Detection {'started' if self.detection_active else 'stopped'}")
    
    def reset_detector(self):
        """Reset fall detector"""
        try:
            response = requests.post(
                f"{self.server_url}/api/v1/reset-detector/{self.user_id}"
            )
            if response.status_code == 200:
                logger.info("Detector reset successfully")
            else:
                logger.error(f"Failed to reset detector: {response.status_code}")
        except Exception as e:
            logger.error(f"Error resetting detector: {e}")
    
    async def process_frames_async(self):
        """Process frames asynchronously"""
        while True:
            try:
                if not self.frame_queue.empty() and self.detection_active and self.ws_connected:
                    frame = self.frame_queue.get()
                    
                    # Send to server and get processed frame
                    processed_frame = await self.send_frame_to_server(frame)
                    
                    # Add to result queue
                    if self.result_queue.full():
                        self.result_queue.get()
                    self.result_queue.put(processed_frame)
                    
                    # Small delay to prevent overwhelming the server
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                logger.error(f"Error processing frame: {e}")
                await asyncio.sleep(1)
    
    def run_sync_processing(self):
        """Run frame processing in sync mode (fallback)"""
        while True:
            try:
                if not self.frame_queue.empty() and self.detection_active:
                    frame = self.frame_queue.get()
                    
                    # Simple local processing (fallback)
                    processed_frame = self.local_process_frame(frame)
                    
                    if self.result_queue.full():
                        self.result_queue.get()
                    self.result_queue.put(processed_frame)
                    
                    time.sleep(0.1)
                    
            except Exception as e:
                logger.error(f"Error in sync processing: {e}")
                time.sleep(1)
    
    def local_process_frame(self, frame):
        """Local frame processing (fallback when server is unavailable)"""
        # Add simple text overlay indicating local processing
        cv2.putText(frame, "LOCAL PROCESSING", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        return frame
    
    async def run_async(self):
        """Run the application with async processing"""
        # Connect to server
        if await self.connect_to_server():
            logger.info("Connected to server, using remote processing")
            processing_task = asyncio.create_task(self.process_frames_async())
        else:
            logger.warning("Could not connect to server, using local processing")
            processing_thread = threading.Thread(target=self.run_sync_processing)
            processing_thread.daemon = True
            processing_thread.start()
        
        # Start capture thread
        capture_thread = threading.Thread(target=self.capture_frames)
        capture_thread.daemon = True
        capture_thread.start()
        
        # Run display in main thread
        self.display_frames()
        
        # Cleanup
        self.cap.release()
        if self.websocket:
            await self.websocket.close()
    
    def run_sync(self):
        """Run the application synchronously"""
        # Start capture thread
        capture_thread = threading.Thread(target=self.capture_frames)
        capture_thread.daemon = True
        capture_thread.start()
        
        # Start processing thread
        processing_thread = threading.Thread(target=self.run_sync_processing)
        processing_thread.daemon = True
        processing_thread.start()
        
        # Run display in main thread
        self.display_frames()
        
        # Cleanup
        self.cap.release()

def main():
    parser = argparse.ArgumentParser(description='Real-time Fall Detection Camera App')
    parser.add_argument('--server-url', default='http://localhost:3000', 
                       help='Server URL (default: http://localhost:3000)')
    parser.add_argument('--user-id', default='default', 
                       help='User ID (default: default)')
    parser.add_argument('--use-async', dest='use_async', action='store_true', 
                       help='Use async processing (requires server connection)')
    parser.add_argument('--local-only', action='store_true', 
                       help='Run in local-only mode without server')
    
    args = parser.parse_args()
    
    app = RealTimeFallDetection(
        server_url=args.server_url,
        user_id=args.user_id
    )
    
    if args.use_async and not args.local_only:
        try:
            asyncio.run(app.run_async())
        except KeyboardInterrupt:
            logger.info("Application stopped by user")
    else:
        try:
            app.run_sync()
        except KeyboardInterrupt:
            logger.info("Application stopped by user")

if __name__ == "__main__":
    main()