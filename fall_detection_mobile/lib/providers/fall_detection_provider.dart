import 'package:flutter/material.dart' hide Notification;
import '../models/fall_event.dart';
import '../models/notification.dart';
import '../services/fall_detection_service.dart';

class FallDetectionProvider with ChangeNotifier {
  List<FallEvent> _fallEvents = [];
  List<Notification> _notifications = [];
  bool _isLoading = false;
  String? _error;

  List<FallEvent> get fallEvents => _fallEvents;
  List<Notification> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;

  final FallDetectionService _fallDetectionService = FallDetectionService();

  // Computed properties
  String get avgConfidence {
    if (_fallEvents.isEmpty) return '0%';
    final avg =
        _fallEvents.map((e) => e.confidence).reduce((a, b) => a + b) /
        _fallEvents.length;
    return '${(avg * 100).toStringAsFixed(0)}%';
  }

  int get totalFalls => _fallEvents.length;
  int get acknowledgedFalls =>
      _fallEvents.where((e) => e.isAcknowledged).length;
  int get falseAlarms => _fallEvents.where((e) => e.isFalseAlarm).length;

  Future<void> loadFallEvents() async {
    _isLoading = true;
    notifyListeners();

    try {
      _fallEvents = await _fallDetectionService.getFallEvents();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadNotifications() async {
    try {
      _notifications = await _fallDetectionService.getNotifications();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      notifyListeners();
    }
  }

  Future<void> acknowledgeFallEvent(
    String eventId,
    bool isFalseAlarm,
    String? reason,
  ) async {
    try {
      await _fallDetectionService.acknowledgeFallEvent(
        eventId,
        isFalseAlarm,
        reason,
      );

      // Update local data
      final index = _fallEvents.indexWhere((e) => e.id == eventId);
      if (index != -1) {
        _fallEvents[index] = FallEvent(
          id: _fallEvents[index].id,
          userId: _fallEvents[index].userId,
          confidence: _fallEvents[index].confidence,
          angle: _fallEvents[index].angle,
          velocity: _fallEvents[index].velocity,
          landmarks: _fallEvents[index].landmarks,
          isAcknowledged: true,
          acknowledgedAt: DateTime.now(),
          isFalseAlarm: isFalseAlarm,
          falseAlarmReason: reason,
          imageUrls: _fallEvents[index].imageUrls,
          isActive: _fallEvents[index].isActive,
          createdAt: _fallEvents[index].createdAt,
          updatedAt: DateTime.now(),
        );
      }

      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
