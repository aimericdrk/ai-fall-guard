class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phoneNumber;
  final bool isActive;
  final bool isAdmin;
  final List<String> deviceTokens;
  final bool fallDetectionEnabled;
  final bool notificationsEnabled;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phoneNumber,
    required this.isActive,
    required this.isAdmin,
    required this.deviceTokens,
    required this.fallDetectionEnabled,
    required this.notificationsEnabled,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'],
      email: json['email'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      phoneNumber: json['phoneNumber'],
      isActive: json['isActive'] ?? true,
      isAdmin: json['isAdmin'] ?? false,
      deviceTokens: List<String>.from(json['deviceTokens'] ?? []),
      fallDetectionEnabled: json['fallDetectionEnabled'] ?? false,
      notificationsEnabled: json['notificationsEnabled'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'phoneNumber': phoneNumber,
      'isActive': isActive,
      'isAdmin': isAdmin,
      'deviceTokens': deviceTokens,
      'fallDetectionEnabled': fallDetectionEnabled,
      'notificationsEnabled': notificationsEnabled,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  String get fullName => '$firstName $lastName';
}
