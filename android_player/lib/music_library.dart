import 'dart:convert';
import 'dart:io';

import 'package:audio_service/audio_service.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class MusicLibrary {
  static Future<void> remember(SharedPreferences prefs, MediaItem item) async {
    await prefs.setString(
      'track:${item.id}',
      jsonEncode({
        'title': item.title,
        'artist': item.artist,
        'album': item.album,
        'art': item.artUri?.toString(),
        'url': item.extras?['url'],
      }),
    );
  }

  static Iterable<MediaItem> restore(SharedPreferences prefs) sync* {
    for (final key in prefs.getKeys().where((k) => k.startsWith('track:'))) {
      final m = jsonDecode(prefs.getString(key)!) as Map;
      yield MediaItem(
        id: key.substring(6),
        title: m['title'],
        artist: m['artist'],
        album: m['album'],
        artUri: m['art'] == null ? null : Uri.tryParse(m['art']),
        extras: {'url': m['url']},
      );
    }
  }

  static Future<List<MediaItem>> pick() async {
    final picked = await FilePicker.pickFiles(
      type: FileType.audio,
    );
    final directory = await getApplicationDocumentsDirectory();
    final list = <MediaItem>[];
    for (final entry in picked) {
      if (entry.path == null) continue;
      final id = DateTime.now().microsecondsSinceEpoch.toString();
      final file = await File(entry.path!).copy(
        '${directory.path}/$id-${entry.name.replaceAll(RegExp(r"[/\\]"), "_")}',
      );
      list.add(
        MediaItem(
          id: 'local:$id',
          title: entry.name,
          artist: 'Local audio',
          extras: {'url': file.uri.toString()},
        ),
      );
    }
    return list;
  }

  static Future<List<MediaItem>> search(String q) async {
    final response = await http
        .get(
          Uri.https('api.jamendo.com', '/v3.0/tracks/', {
            'client_id': '17ed92bf',
            'format': 'json',
            'namesearch': q,
            'limit': '20',
          }),
        )
        .timeout(const Duration(seconds: 8));
    if (response.statusCode != 200)
      throw const HttpException('Catalog unavailable');
    final data = jsonDecode(response.body);
    if (data['headers']['status'] != 'success')
      throw const HttpException('Catalog unavailable');
    return [
      for (final t in data['results'])
        if (t['audio'] is String && (t['audio'] as String).isNotEmpty)
          MediaItem(
            id: 'jamendo:${t['id']}',
            title: t['name'],
            artist: t['artist_name'],
            album: t['album_name'],
            artUri: Uri.tryParse(t['image'] ?? ''),
            extras: {'url': t['audio']},
          ),
    ];
  }
}
