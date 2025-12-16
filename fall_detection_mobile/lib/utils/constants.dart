class Constants {
  // API Configuration
  static const String baseUrl = 'http://your-api-url.com/api/v1';
  static const String wsUrl = 'ws://your-api-url.com';

  // Storage Keys
  static const String tokenKey = 'access_token';
  static const String userKey = 'user_data';
  static const String firstTimeKey = 'first_time';

  // Notification Channels
  static const String fallDetectionChannel = 'fall_detection_channel';
  static const String generalChannel = 'general_channel';

  // Camera Configuration
  static const double fallDetectionThreshold = 0.7;
  static const int cameraResolutionWidth = 640;
  static const int cameraResolutionHeight = 480;

  // Location Configuration
  static const double locationUpdateInterval = 5.0; // seconds
  static const double locationDistanceFilter = 10.0; // meters
}
