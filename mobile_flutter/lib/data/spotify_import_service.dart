import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/fuzzy_search.dart';
import '../core/models.dart';
import 'catalog_service.dart';

class ParsedSpotifyLink {
  const ParsedSpotifyLink({required this.kind, required this.id});
  final String kind; // playlist, album, track
  final String id;
}

class SpotifyImportService {
  SpotifyImportService({http.Client? httpClient, CatalogService? catalog})
      : _http = httpClient ?? http.Client(),
        _catalog = catalog ?? CatalogService(httpClient: httpClient);

  final http.Client _http;
  final CatalogService _catalog;

  static ParsedSpotifyLink? parseSpotifyLink(String raw) {
    final trimmed = raw.trim();
    final uriMatch =
        RegExp(r'spotify:(playlist|album|track):([a-zA-Z0-9]+)').firstMatch(trimmed);
    if (uriMatch != null) {
      return ParsedSpotifyLink(
        kind: uriMatch.group(1)!,
        id: uriMatch.group(2)!,
      );
    }

    final urlMatch = RegExp(
      r'open\.spotify\.com/(?:intl-[a-z-]+/)?(playlist|album|track)/([a-zA-Z0-9]+)',
    ).firstMatch(trimmed);
    if (urlMatch != null) {
      return ParsedSpotifyLink(
        kind: urlMatch.group(1)!,
        id: urlMatch.group(2)!,
      );
    }
    return null;
  }

  Future<SpotifyImportResult> importFromSpotifyLink(
    String rawInput, {
    List<WavelengthTrack> localCatalog = const [],
  }) async {
    final parsed = parseSpotifyLink(rawInput);
    if (parsed == null) {
      throw const FormatException(
        'Paste a valid Spotify playlist, album, or track link (or URI).',
      );
    }

    var playlistTitle = 'Imported Spotify ${parsed.kind}';
    String? artworkUrl;
    final extracted = <({String title, String artist, String album})>[];

    // 1. Fetch oEmbed title & cover thumbnail
    try {
      final cleanUrl = 'https://open.spotify.com/${parsed.kind}/${parsed.id}';
      final oembedUri = Uri.parse(
        'https://open.spotify.com/oembed?url=${Uri.encodeQueryComponent(cleanUrl)}',
      );
      final resp =
          await _http.get(oembedUri).timeout(const Duration(seconds: 6));
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        playlistTitle = data['title']?.toString() ?? playlistTitle;
        artworkUrl = data['thumbnail_url']?.toString();
      }
    } catch (_) {}

    // 2. Fetch Spotify embed page directly (native Android has no browser CORS restriction)
    try {
      final embedUri =
          Uri.parse('https://open.spotify.com/embed/${parsed.kind}/${parsed.id}');
      final resp = await _http.get(embedUri, headers: {
        'User-Agent':
            'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
      }).timeout(const Duration(seconds: 9));
      if (resp.statusCode == 200) {
        final nextDataMatch = RegExp(
          r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
          dotAll: true,
        ).firstMatch(resp.body);
        if (nextDataMatch != null) {
          final json =
              jsonDecode(nextDataMatch.group(1)!) as Map<String, dynamic>;
          final entity =
              json['props']?['pageProps']?['state']?['data']?['entity'];
          if (entity is Map<String, dynamic>) {
            playlistTitle = entity['name']?.toString() ?? playlistTitle;
            final trackList = (entity['trackList'] as List<dynamic>?) ?? const [];
            for (final raw in trackList.whereType<Map<String, dynamic>>()) {
              final tTitle = raw['title']?.toString() ?? '';
              final tArtist = raw['subtitle']?.toString() ?? '';
              if (tTitle.isNotEmpty) {
                extracted.add((
                  title: tTitle,
                  artist: tArtist,
                  album: parsed.kind == 'album' ? playlistTitle : '',
                ));
              }
            }
            // Single track embed case
            if (extracted.isEmpty && parsed.kind == 'track') {
              final tTitle = entity['name']?.toString() ?? '';
              final artists = (entity['artists'] as List<dynamic>?)
                      ?.whereType<Map<String, dynamic>>()
                      .map((a) => a['name']?.toString() ?? '')
                      .where((n) => n.isNotEmpty)
                      .join(', ') ??
                  '';
              if (tTitle.isNotEmpty) {
                extracted.add((title: tTitle, artist: artists, album: ''));
              }
            }
          }
        }
      }
    } catch (_) {}

    final notes = extracted.isEmpty
        ? 'Spotify embed did not expose tracks (private playlists require login, or Spotify blocked unauthenticated scraping). Try Exportify CSV or paste "Track - Artist" lines below.'
        : 'Imported ${extracted.length} tracks via Spotify public embed (Spotify caps unauthenticated embed lists cleanly around 100 tracks; full 100+ sync works via Exportify CSV).';

    final candidates = await _matchCandidates(
      extracted,
      localCatalog: localCatalog,
    );

    return SpotifyImportResult(
      playlistTitle: playlistTitle,
      sourceKind: parsed.kind,
      candidates: candidates,
      artworkUrl: artworkUrl,
      limitationsNote: notes,
    );
  }

  /// Parses CSV (Exportify / Soundiiz), JSON track exports, or "Title - Artist" plain text.
  Future<SpotifyImportResult> importFromExportText(
    String rawText, {
    String fileName = 'Imported Playlist',
    List<WavelengthTrack> localCatalog = const [],
  }) async {
    final trimmed = rawText.trim();
    if (trimmed.isEmpty) {
      throw const FormatException('Empty import input.');
    }

    final parsedItems = <({String title, String artist, String album})>[];
    var kind = 'text';

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      kind = 'json';
      parsedItems.addAll(parseJsonTrackList(trimmed));
    } else if (_looksLikeCsv(trimmed)) {
      kind = 'csv';
      parsedItems.addAll(parseCsvTrackList(trimmed));
    } else {
      kind = 'text';
      for (final line in trimmed.split(RegExp(r'\r?\n'))) {
        final clean = line.trim();
        if (clean.isEmpty) continue;
        final parts = clean.split(RegExp(r'\s+[-–—]\s+'));
        if (parts.length >= 2) {
          parsedItems.add((
            title: parts[0].trim(),
            artist: parts.sublist(1).join(' - ').trim(),
            album: '',
          ));
        } else {
          parsedItems.add((title: clean, artist: '', album: ''));
        }
      }
    }

    final title = fileName.replaceAll(RegExp(r'\.(csv|json|txt)$', caseSensitive: false), '');
    final candidates = await _matchCandidates(
      parsedItems,
      localCatalog: localCatalog,
    );

    return SpotifyImportResult(
      playlistTitle: title.isNotEmpty ? title : 'Imported Playlist',
      sourceKind: kind,
      candidates: candidates,
    );
  }

  static bool _looksLikeCsv(String raw) {
    final firstLine = raw.split(RegExp(r'\r?\n')).first.toLowerCase();
    return firstLine.contains('track name') ||
        firstLine.contains('artist name') ||
        (firstLine.contains(',') && raw.split('\n').length > 1);
  }

  static List<({String title, String artist, String album})> parseJsonTrackList(
    String rawJson,
  ) {
    final decoded = jsonDecode(rawJson);
    final items = decoded is List
        ? decoded
        : (decoded is Map<String, dynamic>
            ? (decoded['tracks'] as List<dynamic>? ??
                decoded['items'] as List<dynamic>? ??
                const [])
            : const []);
    final out = <({String title, String artist, String album})>[];
    for (final item in items.whereType<Map<String, dynamic>>()) {
      final trackObj = item['track'] is Map<String, dynamic>
          ? item['track'] as Map<String, dynamic>
          : item;
      final title = (trackObj['trackName'] ??
              trackObj['title'] ??
              trackObj['name'] ??
              '')
          .toString()
          .trim();
      final artist = (trackObj['artistName'] ??
              trackObj['artist'] ??
              trackObj['artists'] ??
              '')
          .toString()
          .trim();
      final album = (trackObj['albumName'] ?? trackObj['album'] ?? '')
          .toString()
          .trim();
      if (title.isNotEmpty) {
        out.add((title: title, artist: artist, album: album));
      }
    }
    return out;
  }

  static List<({String title, String artist, String album})> parseCsvTrackList(
    String csvText,
  ) {
    final lines = csvText
        .split(RegExp(r'\r?\n'))
        .where((l) => l.trim().isNotEmpty)
        .toList();
    if (lines.length < 2) return const [];

    final headers = _parseCsvRow(lines.first).map((h) => h.toLowerCase().trim()).toList();
    var titleIdx = headers.indexWhere((h) => h.contains('track name') || h == 'title' || h == 'name');
    var artistIdx = headers.indexWhere((h) => h.contains('artist'));
    var albumIdx = headers.indexWhere((h) => h.contains('album'));
    if (titleIdx == -1) titleIdx = 0;
    if (artistIdx == -1 && headers.length > 1) artistIdx = 1;

    final out = <({String title, String artist, String album})>[];
    for (var i = 1; i < lines.length; i++) {
      final cols = _parseCsvRow(lines[i]);
      if (cols.isEmpty) continue;
      final title = titleIdx < cols.length ? cols[titleIdx].trim() : '';
      final artist = (artistIdx >= 0 && artistIdx < cols.length)
          ? cols[artistIdx].trim()
          : '';
      final album = (albumIdx >= 0 && albumIdx < cols.length)
          ? cols[albumIdx].trim()
          : '';
      if (title.isNotEmpty) {
        out.add((title: title, artist: artist, album: album));
      }
    }
    return out;
  }

  static List<String> _parseCsvRow(String row) {
    final cols = <String>[];
    final buf = StringBuffer();
    var inQuotes = false;
    for (var i = 0; i < row.length; i++) {
      final ch = row[i];
      if (ch == '"') {
        if (inQuotes && i + 1 < row.length && row[i + 1] == '"') {
          buf.write('"');
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch == ',' && !inQuotes) {
        cols.add(buf.toString());
        buf.clear();
      } else {
        buf.write(ch);
      }
    }
    cols.add(buf.toString());
    return cols;
  }

  Future<List<ImportTrackCandidate>> _matchCandidates(
    List<({String title, String artist, String album})> entries, {
    required List<WavelengthTrack> localCatalog,
  }) async {
    final out = <ImportTrackCandidate>[];
    for (final e in entries) {
      final q = '${e.title} ${e.artist}'.trim();
      WavelengthTrack? best;
      var bestScore = 0.0;

      for (final local in localCatalog) {
        final s = FuzzySearchEngine.scoreTrack(q, local);
        if (s > bestScore) {
          bestScore = s;
          best = local;
        }
      }

      if (bestScore < 0.72) {
        final remote = await _catalog.searchTracksRemote(q, limit: 5);
        for (final r in remote) {
          final s = FuzzySearchEngine.scoreTrack(q, r);
          if (s > bestScore) {
            bestScore = s;
            best = r;
          }
        }
      }

      final status = best != null && bestScore >= 0.7
          ? ImportMatchStatus.matched
          : (best != null && bestScore >= 0.45
              ? ImportMatchStatus.lowConfidence
              : ImportMatchStatus.unmatched);

      out.add(ImportTrackCandidate(
        sourceTitle: e.title,
        sourceArtist: e.artist,
        sourceAlbum: e.album,
        matchedTrack: best,
        confidence: bestScore.clamp(0.0, 1.0),
        status: status,
      ));
    }
    return out;
  }
}
