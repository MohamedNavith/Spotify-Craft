import 'dart:convert';
import 'dart:io';
import 'package:dart_des/dart_des.dart';
import 'package:http/http.dart' as http;
import '../core/database.dart';
import '../core/fuzzy_search.dart';
import '../core/models.dart';

class ResolvedStreamResult {
  const ResolvedStreamResult({
    required this.uri,
    required this.details,
    this.isLocalFile = false,
    this.isPreview = false,
  });

  final String uri;
  final AudioStreamDetails details;
  final bool isLocalFile;
  final bool isPreview;
}

class MasterAudioResolver {
  MasterAudioResolver({
    http.Client? httpClient,
    this.db,
    this.customBackendUrl,
  }) : _http = httpClient ?? http.Client();

  final http.Client _http;
  final WavelengthDatabase? db;
  String? customBackendUrl;

  static final Map<String, ResolvedStreamResult> _cache = {};
  static final DES _jioSaavnDes = DES(
    key: utf8.encode('38346591'),
    mode: DESMode.ECB,
    paddingType: DESPaddingType.PKCS7,
  );

  static String cleanQuery(String title, String artist) {
    final cleanedTitle = title
        .replaceAll(RegExp(r'\(.*?\)'), ' ')
        .replaceAll(RegExp(r'\[.*?\]'), ' ')
        .replaceAll(
            RegExp(r'\b(feat|ft|prod|remix|version|deluxe|remaster|remastered|slowed|reverb)\b.*', caseSensitive: false),
            ' ')
        .replaceAll(RegExp(r'[^\w\s]'), ' ')
        .trim();
    final primaryArtist =
        artist.split(RegExp(r'[,&]')).first.trim();
    return '$cleanedTitle $primaryArtist'.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  static bool isPreviewAudioUrl(String url) {
    final low = url.toLowerCase();
    return low.contains('audio-ssl.itunes.apple.com') ||
        low.contains('audiopreview') ||
        low.contains('.plus.aac.p.m4a') ||
        low.contains('/preview/');
  }

  static String decryptJioSaavnUrl(
    String encryptedBase64, {
    int targetBitrate = 320,
  }) {
    final encryptedBytes = base64Decode(encryptedBase64.trim());
    final decryptedBytes = _jioSaavnDes.decrypt(encryptedBytes);
    var url = utf8.decode(decryptedBytes).trim();
    url = url.replaceAll('http://', 'https://');
    url = url.replaceAllMapped(
      RegExp(r'_[0-9]+\.(mp4|m4a|mp3)'),
      (m) => '_$targetBitrate.${m.group(1)}',
    );
    return url;
  }

  Future<ResolvedStreamResult> resolve(
    WavelengthTrack track,
    StreamQuality quality, {
    AudioOutputDeviceInfo? outputDevice,
  }) async {
    // 1. Offline or device-local file always wins with zero network overhead
    if (track.localFilePath != null && track.localFilePath!.isNotEmpty) {
      final f = File(track.localFilePath!);
      if (await f.exists()) {
        final isFlac = track.localFilePath!.toLowerCase().endsWith('.flac');
        return ResolvedStreamResult(
          uri: Uri.file(track.localFilePath!).toString(),
          isLocalFile: true,
          details: track.qualityDetails ??
              AudioStreamDetails(
                codec: isFlac ? 'FLAC' : 'AAC',
                container: isFlac ? 'flac' : 'm4a',
                bitrateKbps: isFlac ? 1411 : 320,
                sampleRateHz: isFlac ? 44100 : 44100,
                bitDepth: isFlac ? 16 : null,
                sourceProvider: 'Offline Cache',
                isLossless: isFlac,
              ),
        );
      }
    }
    if (db != null) {
      final offlinePath = await db!.getOfflineFilePath(track.id);
      if (offlinePath != null && await File(offlinePath).exists()) {
        final isFlac = offlinePath.toLowerCase().endsWith('.flac');
        return ResolvedStreamResult(
          uri: Uri.file(offlinePath).toString(),
          isLocalFile: true,
          details: AudioStreamDetails(
            codec: isFlac ? 'FLAC' : 'AAC',
            container: isFlac ? 'flac' : 'm4a',
            bitrateKbps: isFlac ? 1411 : 320,
            sampleRateHz: 44100,
            bitDepth: isFlac ? 16 : null,
            sourceProvider: 'Offline Storage',
            isLossless: isFlac,
          ),
        );
      }
    }

    // 2. Direct Jamendo or non-preview stream already attached
    if (track.source == 'jamendo' && track.audioUrl.startsWith('http')) {
      return ResolvedStreamResult(
        uri: track.audioUrl,
        details: const AudioStreamDetails(
          codec: 'MP3 / OGG',
          container: 'mp3',
          bitrateKbps: 320,
          sampleRateHz: 44100,
          sourceProvider: 'Jamendo Direct',
        ),
      );
    }

    final effectiveQuality = _resolveEffectiveQuality(quality, outputDevice);
    final cacheKey = '${track.id}::${effectiveQuality.apiKey}';
    final cached = _cache[cacheKey];
    if (cached != null) return cached;

    // 3. Optional user-configured custom backend override
    final backend = customBackendUrl?.trim() ?? '';
    if (backend.isNotEmpty) {
      final backendResult = await _tryCustomBackend(backend, track, effectiveQuality);
      if (backendResult != null) {
        _cache[cacheKey] = backendResult;
        return backendResult;
      }
    }

    final query = cleanQuery(track.title, track.artist);

    // 4. Lossless / Hi-Res pipeline via Monochrome FLAC
    if (effectiveQuality == StreamQuality.lossless ||
        effectiveQuality == StreamQuality.hiResLossless) {
      final mono = await _tryMonochromeLossless(query, track, effectiveQuality);
      if (mono != null) {
        _cache[cacheKey] = mono;
        return mono;
      }
    }

    // 5. High Quality (320k AAC) / Data Saver (96k HE-AAC) via JioSaavn endpoints
    final targetKbps = effectiveQuality == StreamQuality.highEfficiency ? 96 : 320;
    final saavnPrivate = await _tryJioSaavnPrivate(query, track, targetKbps);
    if (saavnPrivate != null) {
      _cache[cacheKey] = saavnPrivate;
      return saavnPrivate;
    }

    final saavnDirect = await _tryJioSaavnDirectDes(query, track, targetKbps);
    if (saavnDirect != null) {
      _cache[cacheKey] = saavnDirect;
      return saavnDirect;
    }

    // 6. Fallback to attached URL (honestly labeled if 30s Apple/iTunes preview)
    if (track.audioUrl.startsWith('http')) {
      final preview = isPreviewAudioUrl(track.audioUrl);
      final fallback = ResolvedStreamResult(
        uri: track.audioUrl,
        isPreview: preview,
        details: AudioStreamDetails(
          codec: 'AAC',
          container: 'm4a',
          bitrateKbps: 256,
          sampleRateHz: 44100,
          sourceProvider: preview ? 'Apple Preview Fallback' : 'Direct Stream',
          note: preview
              ? 'Full master stream unavailable right now; playing official 30s preview.'
              : null,
        ),
      );
      return fallback;
    }

    throw StateError('No playable stream could be resolved for "${track.title}".');
  }

  StreamQuality _resolveEffectiveQuality(
    StreamQuality requested,
    AudioOutputDeviceInfo? device,
  ) {
    if (requested != StreamQuality.auto) return requested;
    if (device != null && (device.isExternalDac || device.route == 'wired')) {
      return StreamQuality.hiResLossless;
    }
    if (device != null && device.route == 'bluetooth_le') {
      return StreamQuality.lossless;
    }
    return StreamQuality.highQuality;
  }

  Future<ResolvedStreamResult?> _tryCustomBackend(
    String baseUrl,
    WavelengthTrack track,
    StreamQuality quality,
  ) async {
    try {
      final cleanBase = baseUrl.endsWith('/')
          ? baseUrl.substring(0, baseUrl.length - 1)
          : baseUrl;
      final uri = Uri.parse(
        '$cleanBase/api/v1/stream/resolve?title=${Uri.encodeQueryComponent(track.title)}&artist=${Uri.encodeQueryComponent(track.artist)}&quality=${quality.apiKey}',
      );
      final resp = await _http.get(uri).timeout(const Duration(seconds: 5));
      if (resp.statusCode != 200) return null;
      final json = jsonDecode(resp.body) as Map<String, dynamic>;
      final streamUrl = json['url']?.toString();
      if (streamUrl == null || streamUrl.isEmpty) return null;
      return ResolvedStreamResult(
        uri: streamUrl,
        details: AudioStreamDetails(
          codec: json['codec']?.toString() ?? 'FLAC',
          container: json['container']?.toString() ?? 'flac',
          bitrateKbps: (json['bitrateKbps'] as num?)?.toInt(),
          sampleRateHz: (json['sampleRateHz'] as num?)?.toInt() ?? 44100,
          bitDepth: (json['bitDepth'] as num?)?.toInt(),
          sourceProvider: 'Custom Backend',
          isLossless: json['isLossless'] as bool? ?? false,
          isHiRes: json['isHiRes'] as bool? ?? false,
        ),
      );
    } catch (_) {
      return null;
    }
  }

  Future<ResolvedStreamResult?> _tryMonochromeLossless(
    String query,
    WavelengthTrack target,
    StreamQuality quality,
  ) async {
    try {
      final searchUri = Uri.parse(
        'https://tracks.monochrome.st/search/tracks?q=${Uri.encodeQueryComponent(query)}&limit=5',
      );
      final resp =
          await _http.get(searchUri).timeout(const Duration(seconds: 7));
      if (resp.statusCode != 200) return null;
      final decoded = jsonDecode(resp.body);
      final items = (decoded is Map<String, dynamic>)
          ? (decoded['items'] as List<dynamic>? ??
              decoded['data'] as List<dynamic>? ??
              const [])
          : (decoded is List<dynamic> ? decoded : const []);
      if (items.isEmpty) return null;

      Map<String, dynamic>? bestItem;
      var bestScore = 0.0;
      for (final raw in items.whereType<Map<String, dynamic>>()) {
        final itemTitle = raw['title']?.toString() ?? '';
        final artistObj = raw['artist'];
        final itemArtist = artistObj is Map
            ? artistObj['name']?.toString() ?? ''
            : raw['artistName']?.toString() ?? '';
        final score = (FuzzySearchEngine.similarityScore(target.title, itemTitle) *
                0.7) +
            (FuzzySearchEngine.similarityScore(target.artist, itemArtist) * 0.3);
        if (score > bestScore) {
          bestScore = score;
          bestItem = raw;
        }
      }

      if (bestItem == null || bestScore < 0.48) return null;
      final trackId = bestItem['id']?.toString();
      if (trackId == null || trackId.isEmpty) return null;

      final streamUrl = 'https://tracks.monochrome.st/track/$trackId';
      final isHiRes = quality == StreamQuality.hiResLossless;
      return ResolvedStreamResult(
        uri: streamUrl,
        details: AudioStreamDetails(
          codec: 'FLAC',
          container: 'flac',
          bitrateKbps: isHiRes ? 2116 : 1411,
          sampleRateHz: isHiRes ? 96000 : 44100,
          bitDepth: isHiRes ? 24 : 16,
          sourceProvider: 'Monochrome Lossless',
          isLossless: true,
          isHiRes: isHiRes,
        ),
      );
    } catch (_) {
      return null;
    }
  }

  Future<ResolvedStreamResult?> _tryJioSaavnPrivate(
    String query,
    WavelengthTrack target,
    int targetKbps,
  ) async {
    try {
      final uri = Uri.parse(
        'https://jiosaavn-api-private.vercel.app/search/songs?query=${Uri.encodeQueryComponent(query)}&limit=5',
      );
      final resp = await _http.get(uri).timeout(const Duration(seconds: 4));
      if (resp.statusCode != 200) return null;
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final results =
          (data['data']?['results'] as List<dynamic>?) ?? const [];
      if (results.isEmpty) return null;

      Map<String, dynamic>? bestSong;
      var bestScore = 0.0;
      for (final raw in results.whereType<Map<String, dynamic>>()) {
        final name = raw['name']?.toString() ?? '';
        final artist = raw['artists']?['primary'] is List
            ? ((raw['artists']['primary'] as List)
                    .firstOrNull?['name']
                    ?.toString() ??
                '')
            : (raw['primaryArtists']?.toString() ?? '');
        final score = (FuzzySearchEngine.similarityScore(target.title, name) *
                0.7) +
            (FuzzySearchEngine.similarityScore(target.artist, artist) * 0.3);
        if (score > bestScore) {
          bestScore = score;
          bestSong = raw;
        }
      }

      if (bestSong == null || bestScore < 0.45) return null;
      final downloadUrls =
          (bestSong['downloadUrl'] as List<dynamic>?) ?? const [];
      if (downloadUrls.isEmpty) return null;

      final preferredOrder = targetKbps <= 96
          ? ['96kbps', '48kbps', '160kbps', '320kbps']
          : ['320kbps', '160kbps', '96kbps'];

      String? pickedUrl;
      var pickedBitrate = targetKbps;
      for (final qLabel in preferredOrder) {
        for (final entry in downloadUrls.whereType<Map<String, dynamic>>()) {
          if (entry['quality']?.toString() == qLabel &&
              (entry['url']?.toString().isNotEmpty ?? false)) {
            pickedUrl = entry['url'].toString();
            pickedBitrate = int.tryParse(qLabel.replaceAll('kbps', '')) ?? targetKbps;
            break;
          }
        }
        if (pickedUrl != null) break;
      }
      if (pickedUrl == null) return null;

      return ResolvedStreamResult(
        uri: pickedUrl.replaceAll('http://', 'https://'),
        details: AudioStreamDetails(
          codec: pickedBitrate <= 96 ? 'HE-AAC' : 'AAC',
          container: 'm4a',
          bitrateKbps: pickedBitrate,
          sampleRateHz: 44100,
          sourceProvider: 'JioSaavn HD',
        ),
      );
    } catch (_) {
      return null;
    }
  }

  Future<ResolvedStreamResult?> _tryJioSaavnDirectDes(
    String query,
    WavelengthTrack target,
    int targetKbps,
  ) async {
    try {
      final uri = Uri.parse(
        'https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&n=5&p=1&q=${Uri.encodeQueryComponent(query)}',
      );
      final resp = await _http.get(uri).timeout(const Duration(seconds: 5));
      if (resp.statusCode != 200) return null;
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final results = (data['results'] as List<dynamic>?) ?? const [];
      if (results.isEmpty) return null;

      Map<String, dynamic>? bestSong;
      var bestScore = 0.0;
      for (final raw in results.whereType<Map<String, dynamic>>()) {
        final name = raw['song']?.toString() ?? raw['title']?.toString() ?? '';
        final artist = raw['primary_artists']?.toString() ?? '';
        final score = (FuzzySearchEngine.similarityScore(target.title, name) *
                0.7) +
            (FuzzySearchEngine.similarityScore(target.artist, artist) * 0.3);
        if (score > bestScore) {
          bestScore = score;
          bestSong = raw;
        }
      }

      if (bestSong == null || bestScore < 0.45) return null;
      final encrypted = bestSong['encrypted_media_url']?.toString();
      if (encrypted == null || encrypted.isEmpty) return null;

      final url = decryptJioSaavnUrl(encrypted, targetBitrate: targetKbps);
      return ResolvedStreamResult(
        uri: url,
        details: AudioStreamDetails(
          codec: targetKbps <= 96 ? 'HE-AAC' : 'AAC',
          container: 'mp4',
          bitrateKbps: targetKbps,
          sampleRateHz: 44100,
          sourceProvider: 'JioSaavn Direct DES',
        ),
      );
    } catch (_) {
      return null;
    }
  }
}
