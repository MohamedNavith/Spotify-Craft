import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:path/path.dart' as p;
import 'package:permission_handler/permission_handler.dart';
import '../core/models.dart';

class LocalAudioScanner {
  static Future<List<WavelengthTrack>> pickLocalAudioFiles() async {
    final files = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['mp3', 'flac', 'm4a', 'aac', 'wav', 'ogg', 'opus'],
    );
    if (files.isEmpty) return const [];

    final tracks = <WavelengthTrack>[];
    for (final file in files) {
      final path = file.path;
      if (path == null || path.isEmpty) continue;
      tracks.add(_trackFromFile(File(path)));
    }
    return tracks;
  }

  static Future<List<WavelengthTrack>> scanCommonAudioFolders() async {
    final granted = await _ensureAudioPermission();
    if (!granted) return const [];

    final candidateDirs = [
      '/storage/emulated/0/Music',
      '/storage/emulated/0/Download',
      '/storage/emulated/0/Downloads',
    ];
    final found = <WavelengthTrack>[];
    for (final dirPath in candidateDirs) {
      final dir = Directory(dirPath);
      if (!await dir.exists()) continue;
      try {
        await for (final entity in dir.list(recursive: true, followLinks: false)) {
          if (entity is! File) continue;
          final ext = p.extension(entity.path).toLowerCase();
          if (const ['.mp3', '.flac', '.m4a', '.aac', '.wav', '.ogg', '.opus']
              .contains(ext)) {
            found.add(_trackFromFile(entity));
          }
          if (found.length >= 120) break;
        }
      } catch (_) {}
    }
    return found;
  }

  static Future<bool> _ensureAudioPermission() async {
    if (!Platform.isAndroid) return true;
    final audioStatus = await Permission.audio.status;
    if (audioStatus.isGranted) return true;
    final reqAudio = await Permission.audio.request();
    if (reqAudio.isGranted) return true;
    final storageStatus = await Permission.storage.request();
    return storageStatus.isGranted;
  }

  static WavelengthTrack _trackFromFile(File file) {
    final baseName = p.basenameWithoutExtension(file.path);
    final parts = baseName.split(RegExp(r'\s+[-–]\s+'));
    final artist = parts.length >= 2 ? parts.first.trim() : 'Local Audio';
    final title =
        parts.length >= 2 ? parts.sublist(1).join(' - ').trim() : baseName;
    final ext = p.extension(file.path).replaceFirst('.', '').toUpperCase();
    final isFlac = ext == 'FLAC' || ext == 'WAV';
    return WavelengthTrack(
      id: 'local:${file.path.hashCode}',
      title: title,
      artist: artist,
      album: p.basename(p.dirname(file.path)),
      localFilePath: file.path,
      source: 'local',
      credits: 'Device Storage ($ext) • ${file.path}',
      qualityDetails: AudioStreamDetails(
        codec: ext.isNotEmpty ? ext : 'AUDIO',
        container: ext.toLowerCase(),
        sampleRateHz: 44100,
        bitDepth: isFlac ? 16 : null,
        sourceProvider: 'Local Device File',
        isLossless: isFlac,
      ),
    );
  }
}
