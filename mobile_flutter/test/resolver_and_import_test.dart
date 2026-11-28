import 'dart:convert';
import 'package:dart_des/dart_des.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wavelength_app/data/catalog_service.dart';
import 'package:wavelength_app/data/master_audio_resolver.dart';
import 'package:wavelength_app/data/spotify_import_service.dart';

void main() {
  group('MasterAudioResolver helpers', () {
    test('cleans parenthetical tags and featured artists cleanly', () {
      expect(
        MasterAudioResolver.cleanQuery(
          'Blinding Lights (feat. Rosalía) [Remix]',
          'The Weeknd, Max Martin',
        ),
        'Blinding Lights The Weeknd',
      );
    });

    test('identifies Apple / iTunes preview URLs honestly', () {
      expect(
        MasterAudioResolver.isPreviewAudioUrl(
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/mzaf.plus.aac.p.m4a',
        ),
        isTrue,
      );
      expect(
        MasterAudioResolver.isPreviewAudioUrl(
          'https://tracks.monochrome.st/track/123456',
        ),
        isFalse,
      );
    });

    test('decrypts JioSaavn DES encrypted URL and rewrites bitrate cleanly', () {
      final des = DES(
        key: utf8.encode('38346591'),
        mode: DESMode.ECB,
        paddingType: DESPaddingType.PKCS7,
      );
      const plain = 'http://aac.saavncdn.com/123/abc_96.mp4';
      final enc = base64Encode(des.encrypt(utf8.encode(plain)));

      expect(
        MasterAudioResolver.decryptJioSaavnUrl(enc, targetBitrate: 320),
        'https://aac.saavncdn.com/123/abc_320.mp4',
      );
      expect(
        MasterAudioResolver.decryptJioSaavnUrl(enc, targetBitrate: 96),
        'https://aac.saavncdn.com/123/abc_96.mp4',
      );
    });
  });

  group('SpotifyImportService parsers', () {
    test('parses Spotify share URLs, intl paths, and URIs', () {
      final p1 = SpotifyImportService.parseSpotifyLink(
        'https://open.spotify.com/intl-en/playlist/37i9dQZF1DXcBWIGoYBM5M?si=xyz123',
      );
      expect(p1?.kind, 'playlist');
      expect(p1?.id, '37i9dQZF1DXcBWIGoYBM5M');

      final p2 = SpotifyImportService.parseSpotifyLink(
        'spotify:album:4yP0hdKOZPNshxUOjY0cZj',
      );
      expect(p2?.kind, 'album');
      expect(p2?.id, '4yP0hdKOZPNshxUOjY0cZj');
    });

    test('parses Exportify CSV with quoted fields cleanly', () {
      const csv = '''
Track Name,Artist Name(s),Album Name
"Kesariya (From ""Brahmastra"")","Pritam, Arijit Singh","Brahmastra"
Taste,Sabrina Carpenter,Short n' Sweet
''';
      final items = SpotifyImportService.parseCsvTrackList(csv);
      expect(items.length, 2);
      expect(items[0].title, 'Kesariya (From "Brahmastra")');
      expect(items[0].artist, 'Pritam, Arijit Singh');
      expect(items[1].title, 'Taste');
      expect(items[1].artist, 'Sabrina Carpenter');
    });
  });

  group('CatalogService LRCLIB LRC parser', () {
    test('parses timestamps and applies [offset:] calibration cleanly', () {
      final result = CatalogService.parseLyricsPayload({
        'syncedLyrics': '''
[offset:500]
[00:10.50]First line here
[00:15.250]Second line here
''',
      });
      expect(result.isSynced, isTrue);
      expect(result.offsetMs, 500);
      expect(result.syncedLines.length, 2);
      expect(result.syncedLines[0].timeMs, 10000); // 10500 - 500
      expect(result.syncedLines[1].timeMs, 14750); // 15250 - 500
    });
  });
}
