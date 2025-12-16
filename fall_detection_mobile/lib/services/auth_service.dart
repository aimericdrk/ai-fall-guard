import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiService.post(
        '/auth/login',
        body: {'email': email, 'password': password},
      );

      if (response['access_token'] != null) {
        await _apiService.saveToken(response['access_token']);
      }

      return response;
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phoneNumber,
  }) async {
    try {
      final response = await _apiService.post(
        '/auth/register',
        body: {
          'email': email,
          'password': password,
          'firstName': firstName,
          'lastName': lastName,
          'phoneNumber': phoneNumber,
          'fallDetectionEnabled': true,
          'notificationsEnabled': true,
        },
      );

      if (response['access_token'] != null) {
        await _apiService.saveToken(response['access_token']);
      }

      return response;
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }

  Future<User> getProfile() async {
    try {
      final response = await _apiService.get('/auth/profile');
      return User.fromJson(response);
    } catch (e) {
      throw Exception('Failed to get profile: $e');
    }
  }

  Future<void> logout() async {
    try {
      await _apiService.removeToken();
    } catch (e) {
      throw Exception('Logout failed: $e');
    }
  }

  Future<bool> isAuthenticated() async {
    final token = await _apiService.getToken();
    return token != null;
  }

  Future<void> updateProfile({
    String? firstName,
    String? lastName,
    String? phoneNumber,
    bool? fallDetectionEnabled,
    bool? notificationsEnabled,
  }) async {
    try {
      final body = {
        if (firstName != null) 'firstName': firstName,
        if (lastName != null) 'lastName': lastName,
        if (phoneNumber != null) 'phoneNumber': phoneNumber,
        if (fallDetectionEnabled != null)
          'fallDetectionEnabled': fallDetectionEnabled,
        if (notificationsEnabled != null)
          'notificationsEnabled': notificationsEnabled,
      };

      await _apiService.put('/users/profile', body: body);
    } catch (e) {
      throw Exception('Profile update failed: $e');
    }
  }

  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    try {
      await _apiService.put(
        '/users/change-password',
        body: {'currentPassword': currentPassword, 'newPassword': newPassword},
      );
    } catch (e) {
      throw Exception('Password change failed: $e');
    }
  }
}
