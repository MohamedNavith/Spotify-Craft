import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import '../core/database.dart';
import '../core/models.dart';
import 'master_audio_resolver.dart';

class OfflineService {
  OfflineService({
    required this.db,
    required this.resolver,
    http.Client? httpClient,
  }) : _http = httpClient ?? http.Client();

  final WavelengthDatabase db;
  final MasterAudioResolver resolver;
  final http.Client _http;

  Future<Directory> _offlineDir() async {
    final appDir = await getApplicationDocumentsDirectory();
    final dir = Directory(p.join(appDir.path, 'wavelength_offline'));
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    return dir;
  }

  Future<OfflineTrackEntry> downloadTrack(
    WavelengthTrack track,
    StreamQuality quality, {
    AudioOutputDeviceInfo? outputDevice,
    void Function(double progress)? onProgress,
  }) async {
    final resolved = await resolver.resolve(
      track,
      quality,
      outputDevice: outputDevice,
    );
    if (resolved.isLocalFile) {
      final f = File(Uri.parse(resolved.uri).toFilePath());
      final len = await f.length();
      final entry = OfflineTrackEntry(
        track: track.copyWith(localFilePath: f.path),
        localPath: f.path,
        sizeBytes: len,
        qualityLabel: resolved.details.badgeLabel,
        codec: resolved.details.codec,
        downloadedAtMs: DateTime.now().millisecondsSinceEpoch,
      );
      await db.saveOfflineTrack(entry);
      return entry;
    }

    final req = http.Request('GET', Uri.parse(resolved.uri));
    final streamed = await _http.send(req).timeout(const Duration(seconds: 25));
    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw HttpException('Download failed with HTTP ${streamed.statusCode}');
    }

    final ext = resolved.details.container.isNotEmpty
        ? resolved.details.container
        : 'm4a';
    final safeId = track.id.replaceAll(RegExp(r'[^\w\-]+'), '_');
    final dir = await _offlineDir();
    final outFile = File(p.join(dir.path, '$safeId.$ext'));

    final contentLen = streamed.contentLength ?? 0;
    var received = 0;
    final sink = outFile.openWrite();
    try {
      await for (final chunk in streamed.stream) {
        sink.add(chunk);
        received += chunk.length;
        if (contentLen > 0 && onProgress != null) {
          onProgress((received / contentLen).clamp(0.0, 1.0));
        }
      }
      await sink.flush();
    } finally {
      await sink.close();
    }

    final fileSize = await outFile.length();
    final entry = OfflineTrackEntry(
      track: track.copyWith(
        localFilePath: outFile.path,
        qualityDetails: resolved.details,
      ),
      localPath: outFile.path,
      sizeBytes: fileSize,
      qualityLabel: resolved.details.badgeLabel,
      codec: resolved.details.codec,
      downloadedAtMs: DateTime.now().millisecondsSinceEpoch,
    );
    await db.saveOfflineTrack(entry);
    onProgress?.call(1.0);
    return entry;
  }

  Future<void> deleteOfflineTrack(String trackId) async {
    final path = await db.getOfflineFilePath(trackId);
    if (path != null) {
      final f = File(path);
      if (await f.exists()) {
        await f.delete();
      }
    }
    await db.removeOfflineTrack(trackId);
  }

  Future<void> clearAllOfflineDownloads() async {
    final list = await db.getOfflineTracks();
    for (final e in list) {
      final f = File(e.localPath);
      if (await f.exists()) {
        await f.delete();
      }
      await db.removeOfflineTrack(e.track.id);
    }
  }
}
