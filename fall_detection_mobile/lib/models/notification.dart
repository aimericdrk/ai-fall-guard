class Notification {
  final String id;
  final String userId;
  final NotificationType type;
  final String title;
  final String message;
  final Map<String, dynamic> data;
  final NotificationStatus status;
  final bool isAcknowledged;
  final DateTime? acknowledgedAt;
  final int retryCount;
  final DateTime? sentAt;
  final DateTime? deliveredAt;
  final DateTime? readAt;
  final bool isEmergency;
  final List<String> deviceTokens;
  final DateTime createdAt;
  final DateTime updatedAt;

  Notification({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    required this.data,
    required this.status,
    required this.isAcknowledged,
    this.acknowledgedAt,
    required this.retryCount,
    this.sentAt,
    this.deliveredAt,
    this.readAt,
    required this.isEmergency,
    required this.deviceTokens,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['_id'] ?? json['id'],
      userId: json['userId'],
      type: NotificationType.values.firstWhere(
        (e) => e.toString().split('.').last == json['type'],
        orElse: () => NotificationType.SYSTEM_ALERT,
      ),
      title: json['title'],
      message: json['message'],
      data: Map<String, dynamic>.from(json['data'] ?? {}),
      status: NotificationStatus.values.firstWhere(
        (e) => e.toString().split('.').last == json['status'],
        orElse: () => NotificationStatus.PENDING,
      ),
      isAcknowledged: json['isAcknowledged'] ?? false,
      acknowledgedAt: json['acknowledgedAt'] != null
          ? DateTime.parse(json['acknowledgedAt'])
          : null,
      retryCount: json['retryCount'] ?? 0,
      sentAt: json['sentAt'] != null ? DateTime.parse(json['sentAt']) : null,
      deliveredAt: json['deliveredAt'] != null
          ? DateTime.parse(json['deliveredAt'])
          : null,
      readAt: json['readAt'] != null ? DateTime.parse(json['readAt']) : null,
      isEmergency: json['isEmergency'] ?? false,
      deviceTokens: List<String>.from(json['deviceTokens'] ?? []),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

enum NotificationType {
  FALL_DETECTED,
  FALL_CONFIRMED,
  FALL_FALSE_ALARM,
  SYSTEM_ALERT,
  EMERGENCY_CONTACT,
}

enum NotificationStatus { PENDING, SENT, DELIVERED, READ, ACKNOWLEDGED }
