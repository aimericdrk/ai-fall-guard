import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/fall_detection_provider.dart';
import '../fall_detection/camera_screen.dart';
import '../settings/settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final fallDetectionProvider = Provider.of<FallDetectionProvider>(
      context,
      listen: false,
    );

    // Load fall events and notifications
    await fallDetectionProvider.loadFallEvents();
    await fallDetectionProvider.loadNotifications();
  }

  void _onItemTapped(int index) {
    setState(() => _selectedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Welcome, ${authProvider.user?.firstName ?? 'User'}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Alerts',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CameraScreen()),
          );
        },
        child: const Icon(Icons.camera_alt),
        tooltip: 'Start Fall Detection',
      ),
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildDashboard();
      case 1:
        return _buildHistory();
      case 2:
        return _buildAlerts();
      default:
        return _buildDashboard();
    }
  }

  Widget _buildDashboard() {
    return Consumer<FallDetectionProvider>(
      builder: (context, provider, child) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Quick Stats
              _buildStatsCards(provider),
              const SizedBox(height: 24),

              // Recent Activity
              _buildRecentActivity(provider),
              const SizedBox(height: 24),

              // Quick Actions
              _buildQuickActions(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatsCards(FallDetectionProvider provider) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.5,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      children: [
        _StatCard(
          title: 'Total Falls',
          value: provider.fallEvents.length.toString(),
          icon: Icons.warning,
          color: Colors.red,
        ),
        _StatCard(
          title: 'Acknowledged',
          value: provider.fallEvents
              .where((event) => event.isAcknowledged)
              .length
              .toString(),
          icon: Icons.check_circle,
          color: Colors.green,
        ),
        _StatCard(
          title: 'False Alarms',
          value: provider.fallEvents
              .where((event) => event.isFalseAlarm)
              .length
              .toString(),
          icon: Icons.error_outline,
          color: Colors.orange,
        ),
        _StatCard(
          title: 'Avg Confidence',
          value: provider.avgConfidence,
          icon: Icons.analytics,
          color: Colors.blue,
        ),
      ],
    );
  }

  Widget _buildRecentActivity(FallDetectionProvider provider) {
    final recentEvents = provider.fallEvents.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activity',
          style: Theme.of(
            context,
          ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        if (recentEvents.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'No recent fall events',
                style: TextStyle(color: Colors.grey.shade600),
              ),
            ),
          )
        else
          ...recentEvents.map((event) => _FallEventCard(event: event)),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(
            context,
          ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const CameraScreen(),
                    ),
                  );
                },
                icon: const Icon(Icons.camera_alt),
                label: const Text('Start Detection'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  // Navigate to emergency contacts
                },
                icon: const Icon(Icons.contacts),
                label: const Text('Emergency'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHistory() {
    return Consumer<FallDetectionProvider>(
      builder: (context, provider, child) {
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: provider.fallEvents.length,
          itemBuilder: (context, index) {
            final event = provider.fallEvents[index];
            return _FallEventCard(event: event);
          },
        );
      },
    );
  }

  Widget _buildAlerts() {
    return Consumer<FallDetectionProvider>(
      builder: (context, provider, child) {
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: provider.notifications.length,
          itemBuilder: (context, index) {
            final notification = provider.notifications[index];
            return _NotificationCard(notification: notification);
          },
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [color.withOpacity(0.1), color.withOpacity(0.05)],
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _FallEventCard extends StatelessWidget {
  final dynamic event;

  const _FallEventCard({required this.event});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: event.isAcknowledged
              ? (event.isFalseAlarm ? Colors.orange : Colors.green)
              : Colors.red,
          width: 2,
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: event.isAcknowledged
              ? (event.isFalseAlarm ? Colors.orange : Colors.green)
              : Colors.red,
          child: Icon(
            event.isAcknowledged ? Icons.check : Icons.warning,
            color: Colors.white,
          ),
        ),
        title: Text(
          'Fall Detected - ${(event.confidence * 100).toStringAsFixed(0)}% Confidence',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Angle: ${event.angle.toStringAsFixed(1)}°'),
            Text('Velocity: ${event.velocity.toStringAsFixed(2)} m/s'),
            Text(
              _formatDateTime(event.createdAt),
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
          ],
        ),
        trailing: event.isAcknowledged
            ? null
            : IconButton(
                icon: const Icon(Icons.check_circle, color: Colors.blue),
                onPressed: () {
                  // Acknowledge fall event
                },
              ),
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}

class _NotificationCard extends StatelessWidget {
  final dynamic notification;

  const _NotificationCard({required this.notification});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 1,
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: notification.isEmergency ? Colors.red : Colors.blue,
          child: Icon(
            _getNotificationIcon(notification.type),
            color: Colors.white,
            size: 20,
          ),
        ),
        title: Text(
          notification.title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(notification.message),
            const SizedBox(height: 4),
            Text(
              _formatDateTime(notification.createdAt),
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
          ],
        ),
        trailing: notification.isAcknowledged
            ? const Icon(Icons.check, color: Colors.green)
            : const Icon(Icons.circle, color: Colors.red, size: 12),
      ),
    );
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'FALL_DETECTED':
        return Icons.warning;
      case 'FALL_CONFIRMED':
        return Icons.check_circle;
      case 'FALL_FALSE_ALARM':
        return Icons.cancel;
      case 'SYSTEM_ALERT':
        return Icons.info;
      case 'EMERGENCY_CONTACT':
        return Icons.contact_phone;
      default:
        return Icons.notifications;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}
