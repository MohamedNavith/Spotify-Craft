import 'dart:convert';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';
import 'models.dart';

class LibraryStatsSummary {
  const LibraryStatsSummary({
    required this.totalPlays,
    required this.totalMinutes,
    required this.uniqueTracks,
    required this.topArtists,
    required this.topTracks,
  });

  final int totalPlays;
  final int totalMinutes;
  final int uniqueTracks;
  final List<({String artist, int plays, int minutes})> topArtists;
  final List<({WavelengthTrack track, int plays})> topTracks;
}

class WavelengthDatabase {
  WavelengthDatabase._(this._db);

  final Database _db;
  static const _uuid = Uuid();

  static Future<WavelengthDatabase> open({bool inMemory = false}) async {
    final dbPath = inMemory
        ? inMemoryDatabasePath
        : p.join(await getDatabasesPath(), 'wavelength_local.db');
    final db = await openDatabase(
      dbPath,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE tracks (
            id TEXT PRIMARY KEY,
            payload TEXT NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE playlists (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            artwork_url TEXT NOT NULL,
            is_system INTEGER NOT NULL,
            is_public INTEGER NOT NULL,
            created_at_ms INTEGER NOT NULL,
            updated_at_ms INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE playlist_items (
            playlist_id TEXT NOT NULL,
            track_id TEXT NOT NULL,
            position INTEGER NOT NULL,
            added_at_ms INTEGER NOT NULL,
            PRIMARY KEY (playlist_id, track_id)
          )
        ''');
        await db.execute('''
          CREATE TABLE likes (
            track_id TEXT PRIMARY KEY,
            liked_at_ms INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id TEXT NOT NULL,
            played_at_ms INTEGER NOT NULL,
            ms_listened INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE recent_searches (
            query TEXT PRIMARY KEY,
            searched_at_ms INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE offline_tracks (
            track_id TEXT PRIMARY KEY,
            local_path TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            quality_label TEXT NOT NULL,
            codec TEXT NOT NULL,
            downloaded_at_ms INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE lyrics_cache (
            cache_key TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            cached_at_ms INTEGER NOT NULL
          )
        ''');
      },
    );
    return WavelengthDatabase._(db);
  }

  Future<void> close() => _db.close();

  Future<void> upsertTrack(WavelengthTrack track) async {
    await _db.insert(
      'tracks',
      {'id': track.id, 'payload': track.toDbPayload()},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<WavelengthTrack?> getTrack(String trackId) async {
    final rows = await _db.query(
      'tracks',
      where: 'id = ?',
      whereArgs: [trackId],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    final raw = rows.first['payload'] as String?;
    if (raw == null) return null;
    return WavelengthTrack.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<Set<String>> getLikedIds() async {
    final rows = await _db.query('likes', columns: ['track_id']);
    return rows.map((r) => r['track_id'] as String).toSet();
  }

  Future<bool> toggleLike(WavelengthTrack track) async {
    await upsertTrack(track);
    final existing = await _db.query(
      'likes',
      where: 'track_id = ?',
      whereArgs: [track.id],
      limit: 1,
    );
    if (existing.isNotEmpty) {
      await _db.delete('likes', where: 'track_id = ?', whereArgs: [track.id]);
      return false;
    } else {
      await _db.insert(
        'likes',
        {
          'track_id': track.id,
          'liked_at_ms': DateTime.now().millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
      return true;
    }
  }

  Future<List<WavelengthTrack>> getLikedTracks() async {
    final rows = await _db.rawQuery('''
      SELECT t.payload
      FROM likes l
      JOIN tracks t ON t.id = l.track_id
      ORDER BY l.liked_at_ms DESC
    ''');
    return rows
        .map((r) => WavelengthTrack.fromJson(
            jsonDecode(r['payload'] as String) as Map<String, dynamic>))
        .toList();
  }

  Future<WavelengthPlaylist> createPlaylist({
    required String name,
    String description = '',
    String artworkUrl = '',
    bool isSystem = false,
    bool isPublic = true,
    List<WavelengthTrack> initialTracks = const [],
  }) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final id = 'pl_${_uuid.v4().substring(0, 12)}';
    final effectiveArt = artworkUrl.isNotEmpty
        ? artworkUrl
        : (initialTracks.isNotEmpty ? initialTracks.first.artworkUrl : '');
    await _db.insert('playlists', {
      'id': id,
      'name': name.trim().isEmpty ? 'Untitled Playlist' : name.trim(),
      'description': description,
      'artwork_url': effectiveArt,
      'is_system': isSystem ? 1 : 0,
      'is_public': isPublic ? 1 : 0,
      'created_at_ms': now,
      'updated_at_ms': now,
    });
    if (initialTracks.isNotEmpty) {
      await addTracksToPlaylist(id, initialTracks);
    }
    return (await getPlaylistById(id))!;
  }

  Future<WavelengthPlaylist?> getPlaylistById(String playlistId) async {
    final rows = await _db.query(
      'playlists',
      where: 'id = ?',
      whereArgs: [playlistId],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    final tracks = await getPlaylistTracks(playlistId);
    final row = rows.first;
    final art = (row['artwork_url'] as String?) ?? '';
    return WavelengthPlaylist(
      id: row['id'] as String,
      name: row['name'] as String,
      description: (row['description'] as String?) ?? '',
      artworkUrl: art.isNotEmpty
          ? art
          : (tracks.isNotEmpty ? tracks.first.artworkUrl : ''),
      isSystem: (row['is_system'] as int? ?? 0) == 1,
      isPublic: (row['is_public'] as int? ?? 1) == 1,
      trackCount: tracks.length,
      createdAtMs: row['created_at_ms'] as int? ?? 0,
      updatedAtMs: row['updated_at_ms'] as int? ?? 0,
      tracks: tracks,
    );
  }

  Future<List<WavelengthPlaylist>> getPlaylists() async {
    final rows = await _db.query(
      'playlists',
      orderBy: 'updated_at_ms DESC',
    );
    final result = <WavelengthPlaylist>[];
    for (final row in rows) {
      final id = row['id'] as String;
      final tracks = await getPlaylistTracks(id);
      final art = (row['artwork_url'] as String?) ?? '';
      result.add(WavelengthPlaylist(
        id: id,
        name: row['name'] as String,
        description: (row['description'] as String?) ?? '',
        artworkUrl: art.isNotEmpty
            ? art
            : (tracks.isNotEmpty ? tracks.first.artworkUrl : ''),
        isSystem: (row['is_system'] as int? ?? 0) == 1,
        isPublic: (row['is_public'] as int? ?? 1) == 1,
        trackCount: tracks.length,
        createdAtMs: row['created_at_ms'] as int? ?? 0,
        updatedAtMs: row['updated_at_ms'] as int? ?? 0,
        tracks: tracks,
      ));
    }
    return result;
  }

  Future<List<WavelengthTrack>> getPlaylistTracks(String playlistId) async {
    final rows = await _db.rawQuery('''
      SELECT t.payload
      FROM playlist_items pi
      JOIN tracks t ON t.id = pi.track_id
      WHERE pi.playlist_id = ?
      ORDER BY pi.position ASC, pi.added_at_ms ASC
    ''', [playlistId]);
    return rows
        .map((r) => WavelengthTrack.fromJson(
            jsonDecode(r['payload'] as String) as Map<String, dynamic>))
        .toList();
  }

  Future<int> addTracksToPlaylist(
    String playlistId,
    List<WavelengthTrack> tracks,
  ) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final maxPosRow = await _db.rawQuery(
      'SELECT COALESCE(MAX(position), -1) AS max_pos FROM playlist_items WHERE playlist_id = ?',
      [playlistId],
    );
    var nextPos = ((maxPosRow.first['max_pos'] as int?) ?? -1) + 1;
    var added = 0;

    for (final t in tracks) {
      await upsertTrack(t);
      final res = await _db.insert(
        'playlist_items',
        {
          'playlist_id': playlistId,
          'track_id': t.id,
          'position': nextPos,
          'added_at_ms': now,
        },
        conflictAlgorithm: ConflictAlgorithm.ignore,
      );
      if (res > 0) {
        nextPos++;
        added++;
      }
    }

    await _db.update(
      'playlists',
      {'updated_at_ms': now},
      where: 'id = ?',
      whereArgs: [playlistId],
    );
    return added;
  }

  Future<void> removeTrackFromPlaylist(String playlistId, String trackId) async {
    await _db.delete(
      'playlist_items',
      where: 'playlist_id = ? AND track_id = ?',
      whereArgs: [playlistId, trackId],
    );
    await _db.update(
      'playlists',
      {'updated_at_ms': DateTime.now().millisecondsSinceEpoch},
      where: 'id = ?',
      whereArgs: [playlistId],
    );
  }

  Future<void> reorderPlaylistTrack(
    String playlistId,
    int oldIndex,
    int newIndex,
  ) async {
    final tracks = await getPlaylistTracks(playlistId);
    if (oldIndex < 0 || oldIndex >= tracks.length) return;
    if (newIndex > oldIndex) newIndex--;
    if (newIndex < 0 || newIndex >= tracks.length) return;
    final moved = tracks.removeAt(oldIndex);
    tracks.insert(newIndex, moved);
    await _db.transaction((txn) async {
      for (var i = 0; i < tracks.length; i++) {
        await txn.update(
          'playlist_items',
          {'position': i},
          where: 'playlist_id = ? AND track_id = ?',
          whereArgs: [playlistId, tracks[i].id],
        );
      }
      await txn.update(
        'playlists',
        {'updated_at_ms': DateTime.now().millisecondsSinceEpoch},
        where: 'id = ?',
        whereArgs: [playlistId],
      );
    });
  }

  Future<void> updatePlaylistMeta(
    String playlistId, {
    String? name,
    String? description,
    String? artworkUrl,
    bool? isPublic,
  }) async {
    final updates = <String, Object?>{
      'updated_at_ms': DateTime.now().millisecondsSinceEpoch,
    };
    if (name != null) updates['name'] = name.trim();
    if (description != null) updates['description'] = description.trim();
    if (artworkUrl != null) updates['artwork_url'] = artworkUrl;
    if (isPublic != null) updates['is_public'] = isPublic ? 1 : 0;
    await _db.update(
      'playlists',
      updates,
      where: 'id = ?',
      whereArgs: [playlistId],
    );
  }

  Future<void> deletePlaylist(String playlistId) async {
    await _db.transaction((txn) async {
      await txn.delete(
        'playlist_items',
        where: 'playlist_id = ?',
        whereArgs: [playlistId],
      );
      await txn.delete('playlists', where: 'id = ?', whereArgs: [playlistId]);
    });
  }

  Future<Set<String>> getPlaylistIdsContainingTrack(String trackId) async {
    final rows = await _db.query(
      'playlist_items',
      columns: ['playlist_id'],
      where: 'track_id = ?',
      whereArgs: [trackId],
    );
    return rows.map((r) => r['playlist_id'] as String).toSet();
  }

  Future<void> recordHistory(
    WavelengthTrack track, {
    int msListened = 30000,
  }) async {
    await upsertTrack(track);
    await _db.insert('history', {
      'track_id': track.id,
      'played_at_ms': DateTime.now().millisecondsSinceEpoch,
      'ms_listened': msListened,
    });
  }

  Future<List<ListeningHistoryEntry>> getHistory({int limit = 60}) async {
    final rows = await _db.rawQuery('''
      SELECT h.played_at_ms, h.ms_listened, t.payload
      FROM history h
      JOIN tracks t ON t.id = h.track_id
      ORDER BY h.played_at_ms DESC
      LIMIT ?
    ''', [limit]);
    return rows.map((r) {
      return ListeningHistoryEntry(
        track: WavelengthTrack.fromJson(
            jsonDecode(r['payload'] as String) as Map<String, dynamic>),
        playedAtMs: r['played_at_ms'] as int,
        msListened: r['ms_listened'] as int,
      );
    }).toList();
  }

  Future<LibraryStatsSummary> getStatsSummary() async {
    final history = await getHistory(limit: 500);
    var totalMs = 0;
    final artistCounts = <String, ({int plays, int ms})>{};
    final trackCounts = <String, ({WavelengthTrack track, int plays})>{};
    for (final h in history) {
      totalMs += h.msListened;
      final aKey = h.track.artist;
      final prevA = artistCounts[aKey];
      artistCounts[aKey] = (
        plays: (prevA?.plays ?? 0) + 1,
        ms: (prevA?.ms ?? 0) + h.msListened,
      );
      final tKey = h.track.id;
      final prevT = trackCounts[tKey];
      trackCounts[tKey] = (
        track: h.track,
        plays: (prevT?.plays ?? 0) + 1,
      );
    }

    final sortedArtists = artistCounts.entries.toList()
      ..sort((a, b) => b.value.plays.compareTo(a.value.plays));
    final sortedTracks = trackCounts.values.toList()
      ..sort((a, b) => b.plays.compareTo(a.plays));

    return LibraryStatsSummary(
      totalPlays: history.length,
      totalMinutes: (totalMs / 60000).round(),
      uniqueTracks: trackCounts.length,
      topArtists: sortedArtists
          .take(8)
          .map((e) => (
                artist: e.key,
                plays: e.value.plays,
                minutes: (e.value.ms / 60000).round(),
              ))
          .toList(),
      topTracks: sortedTracks.take(10).toList(),
    );
  }

  Future<void> saveSearchQuery(String query) async {
    final q = query.trim();
    if (q.isEmpty) return;
    await _db.insert(
      'recent_searches',
      {'query': q, 'searched_at_ms': DateTime.now().millisecondsSinceEpoch},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<String>> getRecentSearches({int limit = 12}) async {
    final rows = await _db.query(
      'recent_searches',
      orderBy: 'searched_at_ms DESC',
      limit: limit,
    );
    return rows.map((r) => r['query'] as String).toList();
  }

  Future<void> removeSearchQuery(String query) async {
    await _db.delete(
      'recent_searches',
      where: 'query = ?',
      whereArgs: [query],
    );
  }

  Future<void> clearRecentSearches() async {
    await _db.delete('recent_searches');
  }

  Future<void> saveOfflineTrack(OfflineTrackEntry entry) async {
    await upsertTrack(entry.track.copyWith(localFilePath: entry.localPath));
    await _db.insert(
      'offline_tracks',
      {
        'track_id': entry.track.id,
        'local_path': entry.localPath,
        'size_bytes': entry.sizeBytes,
        'quality_label': entry.qualityLabel,
        'codec': entry.codec,
        'downloaded_at_ms': entry.downloadedAtMs,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<OfflineTrackEntry>> getOfflineTracks() async {
    final rows = await _db.rawQuery('''
      SELECT o.local_path, o.size_bytes, o.quality_label, o.codec, o.downloaded_at_ms, t.payload
      FROM offline_tracks o
      JOIN tracks t ON t.id = o.track_id
      ORDER BY o.downloaded_at_ms DESC
    ''');
    return rows.map((r) {
      final track = WavelengthTrack.fromJson(
          jsonDecode(r['payload'] as String) as Map<String, dynamic>);
      return OfflineTrackEntry(
        track: track.copyWith(localFilePath: r['local_path'] as String),
        localPath: r['local_path'] as String,
        sizeBytes: r['size_bytes'] as int,
        qualityLabel: r['quality_label'] as String,
        codec: r['codec'] as String,
        downloadedAtMs: r['downloaded_at_ms'] as int,
      );
    }).toList();
  }

  Future<String?> getOfflineFilePath(String trackId) async {
    final rows = await _db.query(
      'offline_tracks',
      columns: ['local_path'],
      where: 'track_id = ?',
      whereArgs: [trackId],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return rows.first['local_path'] as String?;
  }

  Future<void> removeOfflineTrack(String trackId) async {
    await _db.delete(
      'offline_tracks',
      where: 'track_id = ?',
      whereArgs: [trackId],
    );
  }

  Future<void> saveLyricsCache(String cacheKey, String jsonPayload) async {
    await _db.insert(
      'lyrics_cache',
      {
        'cache_key': cacheKey,
        'payload': jsonPayload,
        'cached_at_ms': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<String?> getLyricsCache(String cacheKey) async {
    final rows = await _db.query(
      'lyrics_cache',
      columns: ['payload'],
      where: 'cache_key = ?',
      whereArgs: [cacheKey],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return rows.first['payload'] as String?;
  }

  Future<String> exportLibraryBackupJson() async {
    final likes = await getLikedTracks();
    final playlists = await getPlaylists();
    return const JsonEncoder.withIndent('  ').convert({
      'app': 'Wavelength',
      'schemaVersion': 1,
      'exportedAt': DateTime.now().toIso8601String(),
      'likes': likes.map((t) => t.toJson()).toList(),
      'playlists': playlists.map((p) => p.toJson()).toList(),
    });
  }

  Future<({int likesAdded, int playlistsImported})> importLibraryBackupJson(
    String rawJson,
  ) async {
    final map = jsonDecode(rawJson) as Map<String, dynamic>;
    var likesAdded = 0;
    var playlistsImported = 0;

    final likedIds = await getLikedIds();
    final likesRaw = (map['likes'] as List<dynamic>?) ?? const [];
    for (final item in likesRaw.whereType<Map<String, dynamic>>()) {
      final track = WavelengthTrack.fromJson(item);
      if (track.id.isNotEmpty && !likedIds.contains(track.id)) {
        await toggleLike(track);
        likesAdded++;
      }
    }

    final playlistsRaw = (map['playlists'] as List<dynamic>?) ?? const [];
    for (final plMap in playlistsRaw.whereType<Map<String, dynamic>>()) {
      final pl = WavelengthPlaylist.fromJson(plMap);
      await createPlaylist(
        name: pl.name,
        description: pl.description,
        artworkUrl: pl.artworkUrl,
        isPublic: pl.isPublic,
        initialTracks: pl.tracks,
      );
      playlistsImported++;
    }

    return (likesAdded: likesAdded, playlistsImported: playlistsImported);
  }
}
