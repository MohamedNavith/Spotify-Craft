import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wavelength_app/core/models.dart';
import 'package:wavelength_app/core/theme.dart';
import 'package:wavelength_app/ui/widgets/artwork_image.dart';

void main() {
  testWidgets('TrackRowTile renders title, artist, lossless badge and action buttons cleanly',
      (WidgetTester tester) async {
    var tapped = false;
    var likedTapped = false;
    var addTapped = false;
    var moreTapped = false;

    const track = WavelengthTrack(
      id: 't1',
      title: 'Tum Hi Ho',
      artist: 'Arijit Singh',
      album: 'Aashiqui 2',
      qualityDetails: AudioStreamDetails(
        codec: 'FLAC',
        container: 'flac',
        sampleRateHz: 96000,
        bitDepth: 24,
        isLossless: true,
        isHiRes: true,
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: WavelengthTheme.dark(),
        home: Scaffold(
          body: TrackRowTile(
            track: track,
            isActive: true,
            isPlaying: true,
            isLiked: true,
            onTap: () => tapped = true,
            onToggleLike: () => likedTapped = true,
            onAddToPlaylist: () => addTapped = true,
            onMorePressed: () => moreTapped = true,
          ),
        ),
      ),
    );

    expect(find.text('Tum Hi Ho'), findsOneWidget);
    expect(find.text('Arijit Singh'), findsOneWidget);
    expect(find.text('HI-RES'), findsOneWidget);

    await tester.tap(find.text('Tum Hi Ho'));
    expect(tapped, isTrue);

    await tester.tap(find.byIcon(Icons.favorite_rounded));
    expect(likedTapped, isTrue);

    await tester.tap(find.byIcon(Icons.playlist_add_rounded));
    expect(addTapped, isTrue);

    await tester.tap(find.byIcon(Icons.more_vert_rounded));
    expect(moreTapped, isTrue);
  });
}
