import 'dart:async';
import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../providers/fall_detection_provider.dart';
import '../../services/fall_detection_service.dart';
import '../../utils/constants.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({Key? key}) : super(key: key);

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  CameraController? _controller;
  late List<CameraDescription> _cameras;
  bool _isCameraInitialized = false;
  bool _isDetecting = false;
  IO.Socket? _socket;
  Timer? _detectionTimer;
  Uint8List? _lastFrame;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _initializeSocket();
  }

  Future<void> _initializeCamera() async {
    _cameras = await availableCameras();
    if (_cameras.isNotEmpty) {
      _controller = CameraController(
        _cameras[0],
        ResolutionPreset.medium,
        enableAudio: false,
      );

      try {
        await _controller!.initialize();
        setState(() => _isCameraInitialized = true);
      } catch (e) {
        print('Error initializing camera: $e');
      }
    }
  }

  void _initializeSocket() {
    _socket = IO.io(Constants.wsUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    _socket!.on('connect', (_) {
      print('Connected to fall detection server');
    });

    _socket!.on('fall-detected', (data) {
      _handleFallDetection(data);
    });

    _socket!.on('disconnect', (_) {
      print('Disconnected from fall detection server');
    });

    _socket!.connect();
  }

  void _handleFallDetection(Map<String, dynamic> data) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Fall detected with ${(data['confidence'] * 100).toStringAsFixed(0)}% confidence',
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'View',
            textColor: Colors.white,
            onPressed: () {
              // Navigate to fall event details
            },
          ),
        ),
      );
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    _socket?.disconnect();
    _socket?.dispose();
    _detectionTimer?.cancel();
    super.dispose();
  }

  void _toggleDetection() {
    setState(() => _isDetecting = !_isDetecting);

    if (_isDetecting) {
      _startDetection();
    } else {
      _stopDetection();
    }
  }

  void _startDetection() {
    _detectionTimer = Timer.periodic(const Duration(milliseconds: 500), (
      timer,
    ) {
      _captureAndSendFrame();
    });
  }

  void _stopDetection() {
    _detectionTimer?.cancel();
  }

  Future<void> _captureAndSendFrame() async {
    if (_controller == null || !_controller!.value.isInitialized) return;

    try {
      final image = await _controller!.takePicture();
      final bytes = await image.readAsBytes();

      _socket?.emit('frame', {
        'frame': bytes,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      print('Error capturing frame: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fall Detection Camera'),
        actions: [
          IconButton(
            icon: Icon(_isDetecting ? Icons.stop : Icons.play_arrow),
            onPressed: _toggleDetection,
          ),
        ],
      ),
      body: Column(
        children: [
          // Camera Preview
          Expanded(
            child: _isCameraInitialized
                ? Stack(
                    children: [
                      CameraPreview(_controller!),
                      if (_isDetecting)
                        Positioned(
                          top: 20,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.8),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text(
                                'DETECTING FALLS...',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  )
                : const Center(child: CircularProgressIndicator()),
          ),

          // Control Panel
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.shade300,
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Column(
              children: [
                // Detection Status
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: _isDetecting ? Colors.green : Colors.grey,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _isDetecting ? 'Detection Active' : 'Detection Stopped',
                      style: TextStyle(
                        color: _isDetecting ? Colors.green : Colors.grey,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Control Buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _toggleDetection,
                        icon: Icon(
                          _isDetecting ? Icons.stop : Icons.play_arrow,
                        ),
                        label: Text(
                          _isDetecting ? 'Stop Detection' : 'Start Detection',
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isDetecting
                              ? Colors.red
                              : Colors.green,
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
                        onPressed: () => _showSettingsDialog(),
                        icon: const Icon(Icons.settings),
                        label: const Text('Settings'),
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
            ),
          ),
        ],
      ),
    );
  }

  void _showSettingsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Detection Settings'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Confidence Threshold'),
              subtitle: Text(
                '${(Constants.fallDetectionThreshold * 100).toStringAsFixed(0)}%',
              ),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {
                // Show threshold adjustment
              },
            ),
            ListTile(
              title: const Text('Camera Resolution'),
              subtitle: Text(
                '${Constants.cameraResolutionWidth}x${Constants.cameraResolutionHeight}',
              ),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {
                // Show resolution options
              },
            ),
            ListTile(
              title: const Text('Frame Rate'),
              subtitle: const Text('2 fps'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {
                // Show frame rate options
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
