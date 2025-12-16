import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/io_web_socket_channel.dart';
import '../models/fall_event.dart';
import '../models/notification.dart';
import 'api_service.dart';
import '../utils/constants.dart';

class FallDetectionService {
  static final FallDetectionService _instance =
      FallDetectionService._internal();
  factory FallDetectionService() => _instance;
  FallDetectionService._internal();

  final ApiService _apiService = ApiService();
  WebSocketChannel? _webSocketChannel;
  Function(Map<String, dynamic>)? _onFallDetected;
  bool _isWebSocketConnected = false;

  bool get isWebSocketConnected => _isWebSocketConnected;

  // Get fall events from server
  Future<List<FallEvent>> getFallEvents() async {
    try {
      final response = await _apiService.get('/fall-detection/events');

      if (response is List) {
        return response.map((json) => FallEvent.fromJson(json)).toList();
      }

      return [];
    } catch (e) {
      print('Error getting fall events: $e');
      return [];
    }
  }

  // Get specific fall event
  Future<FallEvent?> getFallEvent(String eventId) async {
    try {
      final response = await _apiService.get('/fall-detection/events/$eventId');
      return FallEvent.fromJson(response);
    } catch (e) {
      print('Error getting fall event: $e');
      return null;
    }
  }

  // Acknowledge fall event
  Future<FallEvent?> acknowledgeFallEvent(
    String eventId,
    bool isFalseAlarm,
    String? falseAlarmReason,
  ) async {
    try {
      final response = await _apiService.post(
        '/fall-detection/events/$eventId/acknowledge',
        body: {
          'isFalseAlarm': isFalseAlarm,
          'falseAlarmReason': falseAlarmReason,
        },
      );
      return FallEvent.fromJson(response);
    } catch (e) {
      print('Error acknowledging fall event: $e');
      return null;
    }
  }

  // Get fall detection statistics
  Future<Map<String, dynamic>> getStats({int days = 30}) async {
    try {
      final response = await _apiService.get(
        '/fall-detection/stats?days=$days',
      );
      return response;
    } catch (e) {
      print('Error getting fall detection stats: $e');
      return {
        'totalFalls': 0,
        'acknowledgedFalls': 0,
        'falseAlarms': 0,
        'avgConfidence': 0,
        'maxConfidence': 0,
        'minConfidence': 0,
      };
    }
  }

  // Get notifications
  Future<List<Notification>> getNotifications() async {
    try {
      final response = await _apiService.get('/notifications');

      if (response is List) {
        return response.map((json) => Notification.fromJson(json)).toList();
      }

      return [];
    } catch (e) {
      print('Error getting notifications: $e');
      return [];
    }
  }

  // Acknowledge notification
  Future<Notification?> acknowledgeNotification(String notificationId) async {
    try {
      final response = await _apiService.post(
        '/notifications/$notificationId/acknowledge',
      );
      return Notification.fromJson(response);
    } catch (e) {
      print('Error acknowledging notification: $e');
      return null;
    }
  }

  // Mark notification as read
  Future<Notification?> markAsRead(String notificationId) async {
    try {
      final response = await _apiService.post(
        '/notifications/$notificationId/read',
      );
      return Notification.fromJson(response);
    } catch (e) {
      print('Error marking notification as read: $e');
      return null;
    }
  }

  // Get unread notification count
  Future<int> getUnreadCount() async {
    try {
      final response = await _apiService.get('/notifications/unread-count');
      return response['count'] ?? 0;
    } catch (e) {
      print('Error getting unread count: $e');
      return 0;
    }
  }

  // Connect to WebSocket for real-time fall detection
  Future<void> connectWebSocket(
    String userId,
    Function(Map<String, dynamic>) onFallDetected,
  ) async {
    try {
      _onFallDetected = onFallDetected;
      final wsUrl = Constants.wsUrl
          .replace('http://', 'ws://')
          .replace('https://', 'wss://');
      final fullUrl = '$wsUrl/ws/fall-detection/$userId';

      _webSocketChannel = IOWebSocketChannel.connect(fullUrl);
      _isWebSocketConnected = true;

      print('Connected to fall detection WebSocket');

      // Listen for messages
      _webSocketChannel!.stream.listen(
        (message) {
          _handleWebSocketMessage(message);
        },
        onError: (error) {
          print('WebSocket error: $error');
          _isWebSocketConnected = false;
          _reconnectWebSocket(userId, onFallDetected);
        },
        onDone: () {
          print('WebSocket connection closed');
          _isWebSocketConnected = false;
          _reconnectWebSocket(userId, onFallDetected);
        },
      );
    } catch (e) {
      print('Error connecting to WebSocket: $e');
      _isWebSocketConnected = false;
      _reconnectWebSocket(userId, onFallDetected);
    }
  }

  // Reconnect WebSocket with exponential backoff
  Future<void> _reconnectWebSocket(
    String userId,
    Function(Map<String, dynamic>) onFallDetected,
  ) async {
    await Future.delayed(const Duration(seconds: 2));

    if (!_isWebSocketConnected) {
      print('Attempting to reconnect WebSocket...');
      await connectWebSocket(userId, onFallDetected);
    }
  }

  // Handle WebSocket messages
  void _handleWebSocketMessage(dynamic message) {
    try {
      final data = jsonDecode(message);

      if (data['fall_detected'] == true && _onFallDetected != null) {
        _onFallDetected!(data);
      }
    } catch (e) {
      print('Error handling WebSocket message: $e');
    }
  }

  // Send camera frame for processing
  Future<void> sendCameraFrame(Uint8List frameData) async {
    if (_webSocketChannel != null && _isWebSocketConnected) {
      try {
        _webSocketChannel!.sink.add(frameData);
      } catch (e) {
        print('Error sending camera frame: $e');
      }
    }
  }

  // Disconnect WebSocket
  Future<void> disconnectWebSocket() async {
    try {
      _isWebSocketConnected = false;
      await _webSocketChannel?.sink.close();
      _webSocketChannel = null;
      _onFallDetected = null;
      print('Disconnected from WebSocket');
    } catch (e) {
      print('Error disconnecting WebSocket: $e');
    }
  }

  // Create fall event from camera detection
  Future<FallEvent?> createFallEventFromDetection(
    Map<String, dynamic> detectionData,
  ) async {
    try {
      final response = await _apiService.post(
        '/fall-detection/events',
        body: {
          'userId': detectionData['userId'] ?? 'default',
          'confidence': detectionData['confidence'],
          'angle': detectionData['angle'],
          'velocity': detectionData['velocity'],
          'landmarks': detectionData['landmarks'] ?? {},
          'location': detectionData['location'],
          'deviceInfo': detectionData['deviceInfo'],
        },
      );
      return FallEvent.fromJson(response);
    } catch (e) {
      print('Error creating fall event from detection: $e');
      return null;
    }
  }

  // Upload fall detection image
  Future<String?> uploadFallDetectionImage(File imageFile) async {
    try {
      final response = await _apiService.postWithFile(
        '/fall-detection/upload-image',
        imageFile,
        fieldName: 'image',
      );
      return response['imageUrl'];
    } catch (e) {
      print('Error uploading fall detection image: $e');
      return null;
    }
  }

  // Reset fall detector for user
  Future<bool> resetDetector(String userId) async {
    try {
      await _apiService.post('/fall-detection/reset-detector/$userId');
      return true;
    } catch (e) {
      print('Error resetting detector: $e');
      return false;
    }
  }

  // Start camera-based fall detection
  Future<bool> startCameraDetection(String userId) async {
    try {
      await _apiService.post('/fall-detection/start-camera-detection/$userId');
      return true;
    } catch (e) {
      print('Error starting camera detection: $e');
      return false;
    }
  }

  // Stop camera-based fall detection
  Future<bool> stopCameraDetection(String userId) async {
    try {
      await _apiService.post('/fall-detection/stop-camera-detection/$userId');
      return true;
    } catch (e) {
      print('Error stopping camera detection: $e');
      return false;
    }
  }

  // Get recent fall events for real-time updates
  Stream<List<FallEvent>> getFallEventsStream() async* {
    while (true) {
      try {
        final events = await getFallEvents();
        yield events;
        await Future.delayed(
          const Duration(seconds: 5),
        ); // Poll every 5 seconds
      } catch (e) {
        print('Error in fall events stream: $e');
        yield [];
        await Future.delayed(
          const Duration(seconds: 10),
        ); // Wait longer on error
      }
    }
  }

  // Get recent notifications for real-time updates
  Stream<List<Notification>> getNotificationsStream() async* {
    while (true) {
      try {
        final notifications = await getNotifications();
        yield notifications;
        await Future.delayed(
          const Duration(seconds: 5),
        ); // Poll every 5 seconds
      } catch (e) {
        print('Error in notifications stream: $e');
        yield [];
        await Future.delayed(
          const Duration(seconds: 10),
        ); // Wait longer on error
      }
    }
  }

  // Check if server is healthy
  Future<bool> isServerHealthy() async {
    try {
      final response = await _apiService.get('/health');
      return response.get('status') == 'healthy';
    } catch (e) {
      print('Server health check failed: $e');
      return false;
    }
  }

  // Get server status
  Future<Map<String, dynamic>> getServerStatus() async {
    try {
      return await _apiService.get('/health');
    } catch (e) {
      print('Error getting server status: $e');
      return {
        'status': 'unhealthy',
        'timestamp': DateTime.now().toIso8601String(),
        'error': e.toString(),
      };
    }
  }
}
