import 'dart:async';
import 'dart:io';
import 'package:flutter/services.dart';
import '../core/models.dart';

class EqualizerCapabilities {
  const EqualizerCapabilities({
    required this.initialized,
    this.bandCount = 5,
    this.minMb = -1500,
    this.maxMb = 1500,
    this.centerFreqsHz = const [60, 230, 910, 3600, 14000],
    this.bassSupported = false,
  });

  final bool initialized;
  final int bandCount;
  final int minMb;
  final int maxMb;
  final List<int> centerFreqsHz;
  final bool bassSupported;
}

class NativeBridge {
  NativeBridge._();

  static const MethodChannel _channel = MethodChannel('fm.wavelength.app/native');
  static const EventChannel _deepLinkChannel =
      EventChannel('fm.wavelength.app/deep_links');
  static const EventChannel _audioDeviceChannel =
      EventChannel('fm.wavelength.app/audio_devices');

  static Stream<String> get deepLinkStream {
    if (!Platform.isAndroid) return const Stream.empty();
    return _deepLinkChannel
        .receiveBroadcastStream()
        .where((e) => e is String && e.isNotEmpty)
        .cast<String>();
  }

  static Stream<AudioOutputDeviceInfo> get audioDeviceStream {
    if (!Platform.isAndroid) return const Stream.empty();
    return _audioDeviceChannel
        .receiveBroadcastStream()
        .where((e) => e is Map)
        .map((e) => AudioOutputDeviceInfo.fromMap(e as Map));
  }

  static Future<String?> getInitialDeepLink() async {
    if (!Platform.isAndroid) return null;
    try {
      return await _channel.invokeMethod<String>('getInitialDeepLink');
    } catch (_) {
      return null;
    }
  }

  static Future<EqualizerCapabilities> initAudioEffects(int sessionId) async {
    if (!Platform.isAndroid || sessionId <= 0) {
      return const EqualizerCapabilities(initialized: false);
    }
    try {
      final raw = await _channel.invokeMapMethod<String, dynamic>(
        'initAudioEffects',
        {'sessionId': sessionId},
      );
      if (raw == null || raw['initialized'] != true) {
        return const EqualizerCapabilities(initialized: false);
      }
      final freqsRaw = (raw['centerFreqsHz'] as List<dynamic>?) ?? const [];
      return EqualizerCapabilities(
        initialized: true,
        bandCount: (raw['bandCount'] as num?)?.toInt() ?? 5,
        minMb: (raw['minMb'] as num?)?.toInt() ?? -1500,
        maxMb: (raw['maxMb'] as num?)?.toInt() ?? 1500,
        centerFreqsHz: freqsRaw.map((e) => (e as num).toInt()).toList(),
        bassSupported: raw['bassSupported'] as bool? ?? false,
      );
    } catch (_) {
      return const EqualizerCapabilities(initialized: false);
    }
  }

  static Future<bool> setEqualizerEnabled(bool enabled) async {
    if (!Platform.isAndroid) return false;
    try {
      return await _channel.invokeMethod<bool>(
            'setEqualizerEnabled',
            {'enabled': enabled},
          ) ??
          false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> setEqualizerBand(int band, int gainMb) async {
    if (!Platform.isAndroid) return false;
    try {
      return await _channel.invokeMethod<bool>(
            'setEqualizerBand',
            {'band': band, 'gainMb': gainMb},
          ) ??
          false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> setBassBoost(int strength) async {
    if (!Platform.isAndroid) return false;
    try {
      return await _channel.invokeMethod<bool>(
            'setBassBoost',
            {'strength': strength},
          ) ??
          false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> setLoudnessGain(int gainMb) async {
    if (!Platform.isAndroid) return false;
    try {
      return await _channel.invokeMethod<bool>(
            'setLoudnessGain',
            {'gainMb': gainMb},
          ) ??
          false;
    } catch (_) {
      return false;
    }
  }

  static Future<AudioOutputDeviceInfo> getAudioOutputDevice() async {
    if (!Platform.isAndroid) {
      return const AudioOutputDeviceInfo(
        route: 'speaker',
        name: 'System Output',
      );
    }
    try {
      final raw = await _channel.invokeMapMethod<dynamic, dynamic>(
        'getAudioOutputDevice',
      );
      if (raw != null) return AudioOutputDeviceInfo.fromMap(raw);
    } catch (_) {}
    return const AudioOutputDeviceInfo(
      route: 'speaker',
      name: 'Phone Speaker',
    );
  }

  static Future<Map<String, bool>> getInstalledShareApps() async {
    if (!Platform.isAndroid) return const {};
    try {
      final raw = await _channel.invokeMapMethod<String, dynamic>(
        'getInstalledShareApps',
      );
      if (raw == null) return const {};
      return raw.map((k, v) => MapEntry(k, v == true));
    } catch (_) {
      return const {};
    }
  }

  static Future<Map<String, dynamic>> shareToInstagramStory({
    String? backgroundPath,
    String? stickerPath,
    String topColor = '#121212',
    String bottomColor = '#1DB954',
    String metaAppId = '',
    String attributionUrl = '',
  }) async {
    if (!Platform.isAndroid) {
      return {'launched': false, 'reason': 'android_only'};
    }
    try {
      final res = await _channel.invokeMapMethod<String, dynamic>(
        'shareToInstagramStory',
        {
          'backgroundPath': backgroundPath,
          'stickerPath': stickerPath,
          'topColor': topColor,
          'bottomColor': bottomColor,
          'metaAppId': metaAppId,
          'attributionUrl': attributionUrl,
        },
      );
      return res ?? {'launched': false};
    } catch (e) {
      return {'launched': false, 'reason': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> shareToSnapchat({
    required String filePath,
    String mimeType = 'image/png',
    String caption = '',
    String snapClientId = '',
  }) async {
    if (!Platform.isAndroid) {
      return {'launched': false, 'reason': 'android_only'};
    }
    try {
      final res = await _channel.invokeMapMethod<String, dynamic>(
        'shareToSnapchat',
        {
          'filePath': filePath,
          'mimeType': mimeType,
          'caption': caption,
          'snapClientId': snapClientId,
        },
      );
      return res ?? {'launched': false};
    } catch (e) {
      return {'launched': false, 'reason': e.toString()};
    }
  }

  static Future<bool> shareMediaToPackage({
    String? packageName,
    String? filePath,
    String mimeType = 'image/png',
    String? text,
  }) async {
    if (!Platform.isAndroid) return false;
    try {
      return await _channel.invokeMethod<bool>(
            'shareMediaToPackage',
            {
              'packageName': packageName,
              'filePath': filePath,
              'mimeType': mimeType,
              'text': text,
            },
          ) ??
          false;
    } catch (_) {
      return false;
    }
  }

  static Future<String?> saveImageToGallery({
    required String filePath,
    required String displayName,
  }) async {
    if (!Platform.isAndroid) return null;
    try {
      return await _channel.invokeMethod<String>(
        'saveImageToGallery',
        {'filePath': filePath, 'displayName': displayName},
      );
    } catch (_) {
      return null;
    }
  }

  static Future<String> renderWaveformVideo({
    String? artworkPath,
    required String title,
    required String artist,
    required int accentColor,
    int durationSeconds = 15,
    required String outputPath,
  }) async {
    final res = await _channel.invokeMethod<String>(
      'renderWaveformVideo',
      {
        'artworkPath': artworkPath,
        'title': title,
        'artist': artist,
        'accentColor': accentColor,
        'durationSeconds': durationSeconds,
        'outputPath': outputPath,
      },
    );
    if (res == null || res.isEmpty) {
      throw StateError('Video exporter returned empty path');
    }
    return res;
  }

  static Future<void> updateWidgetState({
    required String title,
    required String artist,
    required bool isPlaying,
    String? artPath,
  }) async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod<void>(
        'updateWidgetState',
        {
          'title': title,
          'artist': artist,
          'isPlaying': isPlaying,
          'artPath': artPath,
        },
      );
    } catch (_) {}
  }

  static Future<void> openBatteryOptimizationSettings() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod<bool>('openBatteryOptimizationSettings');
    } catch (_) {}
  }
}
