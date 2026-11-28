import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/database.dart';
import '../core/fuzzy_search.dart';
import '../core/models.dart';

class CatalogService {
  CatalogService({http.Client? httpClient, this.db})
      : _http = httpClient ?? http.Client();

  final http.Client _http;
  final WavelengthDatabase? db;

  static const String _jamendoClientId = '17ed92bf';

  static String formatRetinaArtwork(String url) {
    if (url.isEmpty) return '';
    return url
        .replaceAll('100x100bb', '600x600bb')
        .replaceAll('60x60bb', '600x600bb')
        .replaceAll('http://', 'https://');
  }

  /// Searches iTunes + Jamendo in parallel and ranks results with FuzzySearchEngine.
  Future<List<WavelengthTrack>> searchTracksRemote(
    String rawQuery, {
    int limit = 25,
  }) async {
    final q = rawQuery.trim();
    if (q.isEmpty) return const [];

    final futures = await Future.wait([
      _searchItunes(q, country: 'IN', limit: 15),
      _searchItunes(q, country: 'US', limit: 12),
      _searchJioSaavnMetadata(q, limit: 10),
      _searchJamendo(q, limit: 10),
    ]);

    final combined = <WavelengthTrack>[
      ...futures[0],
      ...futures[1],
      ...futures[2],
      ...futures[3],
    ];

    // Deduplicate normalized title + artist, prioritizing iTunes/JioSaavn metadata richness
    final byKey = <String, WavelengthTrack>{};
    for (final t in combined) {
      final key =
          '${FuzzySearchEngine.normalize(t.title)}::${FuzzySearchEngine.normalize(t.artist)}';
      if (!byKey.containsKey(key)) {
        byKey[key] = t;
      }
    }

    final ranked = byKey.values
        .map((t) => (track: t, score: FuzzySearchEngine.scoreTrack(q, t)))
        .where((e) => e.score >= 0.35)
        .toList()
      ..sort((a, b) => b.score.compareTo(a.score));

    return ranked.take(limit).map((e) => e.track).toList();
  }

  Future<List<WavelengthTrack>> _searchItunes(
    String query, {
    required String country,
    int limit = 15,
  }) async {
    try {
      final uri = Uri.parse(
        'https://itunes.apple.com/search?term=${Uri.encodeQueryComponent(query)}&entity=song&country=$country&limit=$limit',
      );
      final resp = await _http.get(uri).timeout(const Duration(seconds: 6));
      if (resp.statusCode != 200) return const [];
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final results = (data['results'] as List<dynamic>?) ?? const [];
      return results.whereType<Map<String, dynamic>>().map((r) {
        final trackId = r['trackId']?.toString() ?? '';
        final art = formatRetinaArtwork(r['artworkUrl100']?.toString() ?? '');
        final releaseDate = r['releaseDate']?.toString() ?? '';
        final year = releaseDate.length >= 4 ? releaseDate.substring(0, 4) : null;
        return WavelengthTrack(
          id: 'official:$trackId',
          title: r['trackName']?.toString() ?? 'Unknown Track',
          artist: r['artistName']?.toString() ?? 'Unknown Artist',
          artistId: r['artistId']?.toString(),
          album: r['collectionName']?.toString() ?? 'Single',
          albumId: r['collectionId']?.toString(),
          artworkUrl: art,
          audioUrl: r['previewUrl']?.toString() ?? '',
          durationMs: (r['trackTimeMillis'] as num?)?.toInt() ?? 0,
          source: 'itunes',
          releaseYear: year,
          genre: r['primaryGenreName']?.toString(),
          credits:
              'Performed by ${r['artistName'] ?? 'Artist'} • Genre: ${r['primaryGenreName'] ?? 'Music'}${year != null ? ' • Released $year' : ''}',
        );
      }).toList();
    } catch (_) {
      return const [];
    }
  }

  Future<List<WavelengthTrack>> _searchJioSaavnMetadata(
    String query, {
    int limit = 10,
  }) async {
    try {
      final uri = Uri.parse(
        'https://jiosaavn-api-private.vercel.app/search/songs?query=${Uri.encodeQueryComponent(query)}&limit=$limit',
      );
      final resp = await _http.get(uri).timeout(const Duration(seconds: 5));
      if (resp.statusCode != 200) return const [];
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final results =
          (data['data']?['results'] as List<dynamic>?) ?? const [];
      return results.whereType<Map<String, dynamic>>().map((r) {
        final images = (r['image'] as List<dynamic>?) ?? const [];
        var art = '';
        for (final img in images.whereType<Map<String, dynamic>>()) {
          art = img['url']?.toString() ?? art;
        }
        final downloads = (r['downloadUrl'] as List<dynamic>?) ?? const [];
        var stream = '';
        for (final dl in downloads.whereType<Map<String, dynamic>>()) {
          if (dl['quality'] == '320kbps') {
            stream = dl['url']?.toString() ?? '';
            break;
          }
          stream = dl['url']?.toString() ?? stream;
        }
        final artistsRaw = r['artists']?['primary'] as List<dynamic>? ?? const [];
        final artistNames = artistsRaw
            .whereType<Map<String, dynamic>>()
            .map((a) => a['name']?.toString() ?? '')
            .where((n) => n.isNotEmpty)
            .join(', ');
        final durationSec = (r['duration'] as num?)?.toInt() ?? 0;
        return WavelengthTrack(
          id: 'saavn:${r['id']}',
          title: _decodeHtmlEntities(r['name']?.toString() ?? 'Unknown'),
          artist: artistNames.isNotEmpty
              ? _decodeHtmlEntities(artistNames)
              : 'Unknown Artist',
          album: _decodeHtmlEntities(r['album']?['name']?.toString() ?? 'Single'),
          artworkUrl: art.replaceAll('http://', 'https://'),
          audioUrl: stream.replaceAll('http://', 'https://'),
          durationMs: durationSec * 1000,
          source: 'jiosaavn',
          releaseYear: r['year']?.toString(),
          credits: 'Label: ${r['label'] ?? 'JioSaavn'} • Year: ${r['year'] ?? '—'}',
        );
      }).toList();
    } catch (_) {
      return const [];
    }
  }

  Future<List<WavelengthTrack>> _searchJamendo(
    String query, {
    int limit = 10,
  }) async {
    try {
      final uri = Uri.parse(
        'https://api.jamendo.com/v3.0/tracks/?client_id=$_jamendoClientId&format=json&limit=$limit&search=${Uri.encodeQueryComponent(query)}&audioformat=mp32',
      );
      final resp = await _http.get(uri).timeout(const Duration(seconds: 5));
      if (resp.statusCode != 200) return const [];
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final results = (data['results'] as List<dynamic>?) ?? const [];
      return results.whereType<Map<String, dynamic>>().map((r) {
        return WavelengthTrack(
          id: 'jamendo:${r['id']}',
          title: r['name']?.toString() ?? 'Unknown',
          artist: r['artist_name']?.toString() ?? 'Jamendo Artist',
          artistId: r['artist_id']?.toString(),
          album: r['album_name']?.toString() ?? 'Jamendo Single',
          albumId: r['album_id']?.toString(),
          artworkUrl: (r['album_image'] ?? r['image'] ?? '').toString(),
          audioUrl: (r['audio'] ?? '').toString(),
          durationMs: ((r['duration'] as num?)?.toInt() ?? 0) * 1000,
          source: 'jamendo',
          credits: 'Creative Commons Track on Jamendo • License: ${r['license_ccurl'] ?? 'CC'}',
        );
      }).toList();
    } catch (_) {
      return const [];
    }
  }

  /// Searches LRCLIB for songs matching a lyric snippet!
  Future<List<WavelengthTrack>> searchByLyricsSnippet(String snippet) async {
    final q = snippet.trim();
    if (q.length < 3) return const [];
    try {
      final uri = Uri.parse(
        'https://lrclib.net/api/search?q=${Uri.encodeQueryComponent(q)}',
      );
      final resp = await _http.get(uri, headers: {
        'User-Agent': 'WavelengthFlutter/2.0 (https://wavelength.fm)',
      }).timeout(const Duration(seconds: 6));
      if (resp.statusCode != 200) return const [];
      final items = (jsonDecode(resp.body) as List<dynamic>?) ?? const [];
      final tracks = <WavelengthTrack>[];
      final seen = <String>{};
      for (final item in items.whereType<Map<String, dynamic>>()) {
        final name = item['trackName']?.toString() ?? '';
        final artist = item['artistName']?.toString() ?? '';
        final album = item['albumName']?.toString() ?? 'Single';
        if (name.isEmpty || artist.isEmpty) continue;
        final key = '${FuzzySearchEngine.normalize(name)}::${FuzzySearchEngine.normalize(artist)}';
        if (!seen.add(key)) continue;
        final durationSec = (item['duration'] as num?)?.toInt() ?? 0;
        tracks.add(WavelengthTrack(
          id: 'lrclib:${item['id'] ?? key.hashCode}',
          title: name,
          artist: artist,
          album: album,
          durationMs: durationSec * 1000,
          source: 'itunes',
          credits: 'Matched via lyric snippet in LRCLIB',
        ));
        if (tracks.length >= 12) break;
      }
      return tracks;
    } catch (_) {
      return const [];
    }
  }

  /// Fetches synced LRC or plain lyrics from LRCLIB with SQLite offline cache & offset parsing.
  Future<LyricsResult?> getLyricsForTrack(WavelengthTrack track) async {
    final cleanTitle = track.title
        .replaceAll(RegExp(r'\(.*?\)'), '')
        .replaceAll(RegExp(r'\[.*?\]'), '')
        .trim();
    final primaryArtist = track.artist.split(RegExp(r'[,&]')).first.trim();
    final cacheKey =
        '${FuzzySearchEngine.normalize(cleanTitle)}::${FuzzySearchEngine.normalize(primaryArtist)}';

    if (db != null) {
      final cachedJson = await db!.getLyricsCache(cacheKey);
      if (cachedJson != null) {
        try {
          final map = jsonDecode(cachedJson) as Map<String, dynamic>;
          return parseLyricsPayload(map);
        } catch (_) {}
      }
    }

    try {
      final getUri = Uri.parse(
        'https://lrclib.net/api/get?track_name=${Uri.encodeQueryComponent(cleanTitle)}&artist_name=${Uri.encodeQueryComponent(primaryArtist)}',
      );
      final resp = await _http.get(getUri, headers: {
        'User-Agent': 'WavelengthFlutter/2.0 (https://wavelength.fm)',
      }).timeout(const Duration(seconds: 6));
      if (resp.statusCode == 200) {
        final map = jsonDecode(resp.body) as Map<String, dynamic>;
        final parsed = parseLyricsPayload(map);
        if (parsed.hasAnyLyrics) {
          if (db != null) await db!.saveLyricsCache(cacheKey, resp.body);
          return parsed;
        }
      }
    } catch (_) {}

    // Fallback: LRCLIB fuzzy search
    try {
      final searchUri = Uri.parse(
        'https://lrclib.net/api/search?q=${Uri.encodeQueryComponent('$cleanTitle $primaryArtist')}',
      );
      final resp = await _http.get(searchUri, headers: {
        'User-Agent': 'WavelengthFlutter/2.0 (https://wavelength.fm)',
      }).timeout(const Duration(seconds: 6));
      if (resp.statusCode == 200) {
        final list = (jsonDecode(resp.body) as List<dynamic>?) ?? const [];
        for (final item in list.whereType<Map<String, dynamic>>()) {
          final parsed = parseLyricsPayload(item);
          if (parsed.hasAnyLyrics) {
            if (db != null) {
              await db!.saveLyricsCache(cacheKey, jsonEncode(item));
            }
            return parsed;
          }
        }
      }
    } catch (_) {}

    return null;
  }

  static LyricsResult parseLyricsPayload(Map<String, dynamic> map) {
    final syncedRaw = map['syncedLyrics']?.toString() ?? '';
    final plainRaw = map['plainLyrics']?.toString();
    var globalOffsetMs = 0;

    final offsetMatch = RegExp(r'\[offset:\s*([+-]?\d+)\s*\]', caseSensitive: false)
        .firstMatch(syncedRaw);
    if (offsetMatch != null) {
      globalOffsetMs = int.tryParse(offsetMatch.group(1) ?? '0') ?? 0;
    }

    final lines = <LyricLine>[];
    final tagRegex = RegExp(r'\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]');
    for (final rawLine in syncedRaw.split('\n')) {
      final matches = tagRegex.allMatches(rawLine).toList();
      if (matches.isEmpty) continue;
      final lyricText = rawLine.replaceAll(tagRegex, '').trim();
      if (lyricText.isEmpty) continue;
      for (final m in matches) {
        final min = int.tryParse(m.group(1) ?? '0') ?? 0;
        final sec = int.tryParse(m.group(2) ?? '0') ?? 0;
        final fracRaw = m.group(3) ?? '0';
        final fracMs = fracRaw.length == 3
            ? int.tryParse(fracRaw) ?? 0
            : (fracRaw.length == 2
                ? (int.tryParse(fracRaw) ?? 0) * 10
                : (int.tryParse(fracRaw) ?? 0) * 100);
        final timeMs = (min * 60 * 1000 + sec * 1000 + fracMs - globalOffsetMs)
            .clamp(0, 36000000);
        lines.add(LyricLine(timeMs: timeMs, text: lyricText));
      }
    }
    lines.sort((a, b) => a.timeMs.compareTo(b.timeMs));
    return LyricsResult(
      syncedLines: lines,
      plainLyrics: plainRaw,
      source: 'LRCLIB',
      offsetMs: globalOffsetMs,
    );
  }

  /// Generates a 20-track Song/Artist Radio queue starting from a seed track.
  Future<List<WavelengthTrack>> buildSongRadio(
    WavelengthTrack seed, {
    List<WavelengthTrack> localPool = const [],
  }) async {
    final artistQuery = seed.artist.split(RegExp(r'[,&]')).first.trim();
    final remote = await searchTracksRemote(
      '$artistQuery ${seed.genre ?? ''}'.trim(),
      limit: 20,
    );
    final combined = <WavelengthTrack>[
      ...remote,
      ...localPool.where((t) =>
          t.id != seed.id &&
          (FuzzySearchEngine.similarityScore(artistQuery, t.artist) >= 0.4 ||
              (seed.genre != null && t.genre == seed.genre))),
    ];
    final seen = <String>{seed.id};
    final out = <WavelengthTrack>[];
    for (final t in combined) {
      if (seen.add(t.id)) {
        out.add(t);
      }
      if (out.length >= 20) break;
    }
    return out;
  }

  static String _decodeHtmlEntities(String input) {
    return input
        .replaceAll('&quot;', '"')
        .replaceAll('&#039;', "'")
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');
  }
}
