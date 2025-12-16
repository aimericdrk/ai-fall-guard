class FallEvent {
  final String id;
  final String userId;
  final double confidence;
  final double angle;
  final double velocity;
  final Map<String, dynamic> landmarks;
  final bool isAcknowledged;
  final DateTime? acknowledgedAt;
  final bool isFalseAlarm;
  final String? falseAlarmReason;
  final List<String> imageUrls;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  FallEvent({
    required this.id,
    required this.userId,
    required this.confidence,
    required this.angle,
    required this.velocity,
    required this.landmarks,
    required this.isAcknowledged,
    this.acknowledgedAt,
    required this.isFalseAlarm,
    this.falseAlarmReason,
    required this.imageUrls,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory FallEvent.fromJson(Map<String, dynamic> json) {
    return FallEvent(
      id: json['_id'] ?? json['id'],
      userId: json['userId'],
      confidence: json['confidence'].toDouble(),
      angle: json['angle'].toDouble(),
      velocity: json['velocity'].toDouble(),
      landmarks: Map<String, dynamic>.from(json['landmarks'] ?? {}),
      isAcknowledged: json['isAcknowledged'] ?? false,
      acknowledgedAt: json['acknowledgedAt'] != null
          ? DateTime.parse(json['acknowledgedAt'])
          : null,
      isFalseAlarm: json['isFalseAlarm'] ?? false,
      falseAlarmReason: json['falseAlarmReason'],
      imageUrls: List<String>.from(json['imageUrls'] ?? []),
      isActive: json['isActive'] ?? true,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}
