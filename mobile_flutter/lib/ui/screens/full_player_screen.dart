import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models.dart';
import '../../core/palette_extractor.dart';
import '../../core/theme.dart';
import '../../data/curated_catalog.dart';
import '../../state/app_providers.dart';
import '../modals/add_to_playlist_sheet.dart';
import '../modals/equalizer_and_timer_sheets.dart';
import '../modals/share_sheet.dart';
import '../widgets/artwork_image.dart';
import 'detail_screens.dart';

class FullPlayerScreen extends ConsumerStatefulWidget {
  const FullPlayerScreen({super.key});

  @override
  ConsumerState<FullPlayerScreen> createState() => _FullPlayerScreenState();
}

class _FullPlayerScreenState extends ConsumerState<FullPlayerScreen>
    with SingleTickerProviderStateMixin {
  double? _scrubValueMs;
  double _dragX = 0.0;
  double _dragY = 0.0;
  late final AnimationController _ambientCtrl;

  @override
  void initState() {
    super.initState();
    _ambientCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat();
  }

  @override
  void dispose() {
    _ambientCtrl.dispose();
    super.dispose();
  }

  String _fmt(Duration d) {
    final totalSec = d.inSeconds.clamp(0, 359999);
    return '${totalSec ~/ 60}:${(totalSec % 60).toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    ref.watch(libraryTickProvider);
    final effects = ref.watch(displayEffectsProvider);
    final handler = ref.watch(audioHandlerProvider);
    final nav = ref.watch(navigationProvider);
    final palette = ref.watch(currentPaletteProvider).value ??
        ArtworkPaletteExtractor.fallbackFor(handler.currentTrack?.title ?? 'wl');

    final track = handler.currentTrack;
    if (track == null) return const SizedBox.shrink();

    final queue = handler.orderedQueueTracks;
    final cursor = handler.orderCursor;
    final nextPreview =
        queue.isNotEmpty && cursor + 1 < queue.length ? queue[cursor + 1] : null;
    final prevPreview =
        queue.isNotEmpty && cursor > 0 ? queue[cursor - 1] : null;

    final isLiked = handler.isTrackLiked(track.id);
    final details = track.qualityDetails ?? handler.currentStreamDetails;
    final climaxHighlight = CuratedCatalog.resolveHighlightForTrack(track);

    return GestureDetector(
      onVerticalDragUpdate: (d) {
        if (d.delta.dy > 0 || _dragY > 0) {
          setState(() => _dragY = (_dragY + d.delta.dy).clamp(0.0, 260.0));
        }
      },
      onVerticalDragEnd: (d) {
        if ((d.primaryVelocity ?? 0) > 420 || _dragY > 100) {
          nav.collapseFullPlayer();
        }
        setState(() => _dragY = 0);
      },
      child: Transform.translate(
        offset: Offset(0, _dragY),
        child: Scaffold(
          backgroundColor: WavelengthColors.bgDark,
          body: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  palette.accent.withValues(alpha: 0.42),
                  palette.backgroundTop,
                  const Color(0xFF090A0D),
                ],
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  // Top Drag Pill matching SpotifyMobilePlayer.tsx
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(top: 6, bottom: 2),
                    decoration: BoxDecoration(
                      color: Colors.white30,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  // Top Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Row(
                      children: [
                        IconButton(
                          constraints:
                              const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: const Icon(Icons.keyboard_arrow_down_rounded,
                              size: 32),
                          onPressed: nav.collapseFullPlayer,
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              const Text(
                                'PLAYING FROM ALBUM',
                                style: TextStyle(
                                  fontSize: 10,
                                  letterSpacing: 1.3,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white60,
                                ),
                              ),
                              Text(
                                track.album,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          constraints:
                              const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: const Icon(Icons.directions_car_outlined),
                          tooltip: 'Car Mode',
                          onPressed: () =>
                              Navigator.of(context, rootNavigator: true).push(
                            MaterialPageRoute<void>(
                                builder: (_) => const CarModeScreen()),
                          ),
                        ),
                        IconButton(
                          constraints:
                              const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: const Icon(Icons.more_vert_rounded),
                          onPressed: () =>
                              showTrackOptionsSheet(context, ref, track),
                        ),
                      ],
                    ),
                  ),

                  // Center Swipeable Artwork Deck with 25s Climax badge & Peek Cards (pw_full_player.png)
                  Expanded(
                    child: GestureDetector(
                      onHorizontalDragUpdate: (d) {
                        setState(() => _dragX = (_dragX + d.delta.dx).clamp(-160, 160));
                      },
                      onHorizontalDragEnd: (d) {
                        final vx = d.primaryVelocity ?? 0;
                        if (_dragX < -55 || vx < -320) {
                          handler.skipToNext();
                        } else if (_dragX > 55 || vx > 320) {
                          handler.skipToPrevious();
                        }
                        setState(() => _dragX = 0);
                      },
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: Text(
                              climaxHighlight?.label ??
                                  'Now playing: ${track.title}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            height: 290,
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                if (_dragX > 25 && prevPreview != null)
                                  Transform.translate(
                                    offset: Offset(_dragX - 270, 0),
                                    child: Opacity(
                                      opacity: 0.45,
                                      child: WavelengthArtwork(
                                        imageUrl: prevPreview.artworkUrl,
                                        size: 230,
                                        borderRadius: 18,
                                      ),
                                    ),
                                  ),
                                Transform.translate(
                                  offset: Offset(_dragX, 0),
                                  child: Transform.rotate(
                                    angle: _dragX * 0.0007,
                                    child: AnimatedBuilder(
                                      animation: _ambientCtrl,
                                      builder: (_, child) {
                                        final pulse = handler.isPlaying
                                            ? 1.0 +
                                                0.03 *
                                                    math.sin(_ambientCtrl.value *
                                                        math.pi *
                                                        2)
                                            : 1.0;
                                        return Container(
                                          width: 280,
                                          height: 280,
                                          decoration: BoxDecoration(
                                            borderRadius:
                                                BorderRadius.circular(20),
                                            border: Border.all(
                                                color: Colors.white12),
                                            boxShadow: [
                                              BoxShadow(
                                                color: palette.accent
                                                    .withValues(alpha: 0.35),
                                                blurRadius: 34 * pulse,
                                              ),
                                            ],
                                          ),
                                          child: child,
                                        );
                                      },
                                      child: Stack(
                                        children: [
                                          WavelengthArtwork(
                                            imageUrl: track.artworkUrl,
                                            size: 280,
                                            borderRadius: 18,
                                          ),
                                          if (effects.canvasModeEnabled)
                                            Positioned(
                                              top: 10,
                                              left: 10,
                                              right: 10,
                                              child: Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment
                                                        .spaceBetween,
                                                children: [
                                                  Container(
                                                    padding: const EdgeInsets
                                                        .symmetric(
                                                        horizontal: 10,
                                                        vertical: 4),
                                                    decoration: BoxDecoration(
                                                      color: Colors.black87,
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              999),
                                                      border: Border.all(
                                                          color: Colors.white24),
                                                    ),
                                                    child: Row(
                                                      mainAxisSize:
                                                          MainAxisSize.min,
                                                      children: [
                                                        Container(
                                                          width: 6,
                                                          height: 6,
                                                          decoration:
                                                              const BoxDecoration(
                                                            color:
                                                                WavelengthColors
                                                                    .emerald,
                                                            shape:
                                                                BoxShape.circle,
                                                          ),
                                                        ),
                                                        const SizedBox(width: 5),
                                                        const Text(
                                                          '25S CLIMAX',
                                                          style: TextStyle(
                                                            fontSize: 9.5,
                                                            fontWeight:
                                                                FontWeight.w800,
                                                            color: Colors.white,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                  GestureDetector(
                                                    onTap: () => ref
                                                        .read(
                                                            displayEffectsProvider
                                                                .notifier)
                                                        .toggleCanvasMode(false),
                                                    child: Container(
                                                      padding: const EdgeInsets
                                                          .symmetric(
                                                          horizontal: 10,
                                                          vertical: 4),
                                                      decoration: BoxDecoration(
                                                        color: Colors.black87,
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(999),
                                                        border: Border.all(
                                                            color:
                                                                Colors.white24),
                                                      ),
                                                      child: const Row(
                                                        mainAxisSize:
                                                            MainAxisSize.min,
                                                        children: [
                                                          Icon(
                                                              Icons
                                                                  .image_outlined,
                                                              size: 12,
                                                              color: Colors
                                                                  .white70),
                                                          SizedBox(width: 4),
                                                          Text('ART',
                                                              style: TextStyle(
                                                                fontSize: 9.5,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w800,
                                                              )),
                                                        ],
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                if (_dragX < -25 && nextPreview != null)
                                  Transform.translate(
                                    offset: Offset(_dragX + 270, 0),
                                    child: Opacity(
                                      opacity: 0.45,
                                      child: WavelengthArtwork(
                                        imageUrl: nextPreview.artworkUrl,
                                        size: 230,
                                        borderRadius: 18,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          if (_dragX < -40)
                            const Padding(
                              padding: EdgeInsets.only(top: 6),
                              child: Text('Release to play next track →',
                                  style: TextStyle(
                                      color: WavelengthColors.emerald,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700)),
                            )
                          else if (_dragX > 40)
                            const Padding(
                              padding: EdgeInsets.only(top: 6),
                              child: Text('← Release to play previous track',
                                  style: TextStyle(
                                      color: WavelengthColors.emerald,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700)),
                            ),
                        ],
                      ),
                    ),
                  ),

                  // Track Title, Codec Badge -> StreamingQualitySheet, Circular +/Check
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      track.title,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 21,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  GestureDetector(
                                    onTap: () => showStreamingQualitySheet(
                                        context, ref),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 7, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: details?.isLossless == true
                                            ? WavelengthColors.amberHiRes
                                                .withValues(alpha: 0.16)
                                            : Colors.white10,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                          color: details?.isLossless == true
                                              ? WavelengthColors.amberHiRes
                                                  .withValues(alpha: 0.45)
                                              : Colors.white24,
                                        ),
                                      ),
                                      child: Text(
                                        details?.codec ?? 'AAC',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w900,
                                          color: details?.isLossless == true
                                              ? WavelengthColors.amberHiRes
                                              : Colors.white70,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              GestureDetector(
                                onTap: () {
                                  nav.collapseFullPlayer();
                                  nav.pushInActiveTab(
                                    ArtistDetailScreen(artistName: track.artist),
                                  );
                                },
                                child: Text(
                                  track.artist,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontSize: 13.5, color: Colors.white70),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () async {
                            await handler.toggleLikeTrack(track);
                            ref.read(libraryTickProvider.notifier).bump();
                          },
                          onLongPress: () =>
                              showAddToPlaylistSheet(context, ref, track),
                          child: Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isLiked
                                  ? WavelengthColors.emerald
                                      .withValues(alpha: 0.15)
                                  : Colors.transparent,
                              border: Border.all(
                                color: isLiked
                                    ? WavelengthColors.emerald
                                    : Colors.white24,
                              ),
                            ),
                            child: Icon(
                              isLiked
                                  ? Icons.check_rounded
                                  : Icons.add_rounded,
                              color: isLiked
                                  ? WavelengthColors.emerald
                                  : Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 6),

                  // White Seekbar
                  StreamBuilder<Duration>(
                    stream: handler.positionStream,
                    builder: (_, posSnap) {
                      final totalDur = handler.duration;
                      final maxMs =
                          math.max(1000, totalDur.inMilliseconds).toDouble();
                      final currentMs = (_scrubValueMs ??
                              (posSnap.data ?? handler.position)
                                  .inMilliseconds
                                  .toDouble())
                          .clamp(0.0, maxMs);

                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        child: Column(
                          children: [
                            SliderTheme(
                              data: SliderTheme.of(context).copyWith(
                                trackHeight: 4,
                                thumbShape: const RoundSliderThumbShape(
                                    enabledThumbRadius: 6),
                              ),
                              child: Slider(
                                value: currentMs,
                                min: 0,
                                max: maxMs,
                                activeColor: Colors.white,
                                inactiveColor: Colors.white24,
                                onChanged: (v) =>
                                    setState(() => _scrubValueMs = v),
                                onChangeEnd: (v) async {
                                  await handler.seek(
                                      Duration(milliseconds: v.round()));
                                  if (mounted) {
                                    setState(() => _scrubValueMs = null);
                                  }
                                },
                              ),
                            ),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _fmt(Duration(
                                        milliseconds: currentMs.round())),
                                    style: const TextStyle(
                                        fontSize: 11.5,
                                        fontFamily: 'monospace',
                                        color: Colors.white60),
                                  ),
                                  Text(
                                    _fmt(totalDur),
                                    style: const TextStyle(
                                        fontSize: 11.5,
                                        fontFamily: 'monospace',
                                        color: Colors.white60),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  // Shuffle, Prev, 64dp White Circle, Next, Sleep Timer (pw_full_player.png)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 18, vertical: 6),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: Icon(
                            Icons.shuffle_rounded,
                            color: handler.shuffleEnabled
                                ? WavelengthColors.emerald
                                : Colors.white60,
                          ),
                          onPressed: handler.toggleShuffle,
                        ),
                        IconButton(
                          icon:
                              const Icon(Icons.skip_previous_rounded, size: 36),
                          onPressed: handler.skipToPrevious,
                        ),
                        Container(
                          width: 66,
                          height: 66,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: handler.isResolving
                              ? const Padding(
                                  padding: EdgeInsets.all(20),
                                  child: CircularProgressIndicator(
                                    strokeWidth: 3,
                                    color: Colors.black,
                                  ),
                                )
                              : IconButton(
                                  icon: Icon(
                                    handler.isPlaying
                                        ? Icons.pause_rounded
                                        : Icons.play_arrow_rounded,
                                    color: Colors.black,
                                    size: 36,
                                  ),
                                  onPressed: () => handler.isPlaying
                                      ? handler.pause()
                                      : handler.play(),
                                ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.skip_next_rounded, size: 36),
                          onPressed: handler.skipToNext,
                        ),
                        IconButton(
                          icon: Icon(
                            Icons.timer_outlined,
                            color: handler.sleepTimerEndsAt != null ||
                                    handler.sleepEndOfTrack
                                ? WavelengthColors.emerald
                                : Colors.white60,
                          ),
                          onPressed: () => showSleepTimerSheet(context, ref),
                        ),
                      ],
                    ),
                  ),

                  // Bottom Utility Row: Verci | Equalizer | Share | Queue (matches pw_full_player.png)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton.icon(
                          onPressed: nav.openVerci,
                          icon: const Icon(Icons.track_changes_rounded,
                              color: WavelengthColors.amberHiRes, size: 18),
                          label: const Text(
                            'VERCI',
                            style: TextStyle(
                              color: WavelengthColors.amberHiRes,
                              fontWeight: FontWeight.w900,
                              fontSize: 11,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.equalizer_rounded,
                              color: Colors.white70, size: 22),
                          tooltip: 'Equalizer',
                          onPressed: () =>
                              showEqualizerAndAudioSheet(context, ref),
                        ),
                        IconButton(
                          icon: const Icon(Icons.share_outlined,
                              color: Colors.white70, size: 22),
                          tooltip: 'Share Photo Card',
                          onPressed: () =>
                              showShareSheet(context, ref, track: track),
                        ),
                        IconButton(
                          icon: const Icon(Icons.queue_music_rounded,
                              color: Colors.white70, size: 22),
                          tooltip: 'Play Queue',
                          onPressed: () => showQueueSheet(context, ref),
                        ),
                      ],
                    ),
                  ),

                  // Teal Pull-Up Lyrics Pill (Exact match to pw_full_player.png!)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 14),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(18),
                      onTap: () => showSyncedLyricsSheet(context, ref, track),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 13),
                        decoration: BoxDecoration(
                          color: const Color(0xFF134E4A).withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: Colors.tealAccent.withValues(alpha: 0.28),
                          ),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.auto_awesome_rounded,
                                size: 17, color: WavelengthColors.emerald),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Lyrics preview',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13),
                              ),
                            ),
                            Text(
                              'Tap for karaoke ↑',
                              style: TextStyle(
                                color: WavelengthColors.emerald,
                                fontWeight: FontWeight.w800,
                                fontSize: 12.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

Future<void> showSyncedLyricsSheet(
  BuildContext context,
  WidgetRef ref,
  WavelengthTrack track,
) async {
  await showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    builder: (_) => _SyncedLyricsSheet(track: track),
  );
}

class _SyncedLyricsSheet extends ConsumerStatefulWidget {
  const _SyncedLyricsSheet({required this.track});
  final WavelengthTrack track;

  @override
  ConsumerState<_SyncedLyricsSheet> createState() => _SyncedLyricsSheetState();
}

class _SyncedLyricsSheetState extends ConsumerState<_SyncedLyricsSheet> {
  LyricsResult? _lyrics;
  bool _loading = true;
  int _manualOffsetMs = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res =
        await ref.read(catalogServiceProvider).getLyricsForTrack(widget.track);
    if (mounted) {
      setState(() {
        _lyrics = res;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final handler = ref.watch(audioHandlerProvider);

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.96,
      expand: false,
      builder: (_, sheetScroll) {
        if (_loading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (_lyrics == null || !_lyrics!.hasAnyLyrics) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'Lyrics aren\'t available for this song yet.',
                textAlign: TextAlign.center,
              ),
            ),
          );
        }
        if (!_lyrics!.isSynced) {
          return ListView(
            controller: sheetScroll,
            padding: const EdgeInsets.all(24),
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text('Lyrics',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w800)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.ios_share_rounded),
                    onPressed: () {
                      Navigator.pop(context);
                      showShareSheet(
                        context,
                        ref,
                        track: widget.track,
                        highlightedLyric:
                            _lyrics!.plainLyrics?.split('\n').firstOrNull,
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                _lyrics!.plainLyrics ?? '',
                style: const TextStyle(fontSize: 17, height: 1.7),
              ),
            ],
          );
        }

        final lines = _lyrics!.syncedLines;
        return StreamBuilder<Duration>(
          stream: handler.positionStream,
          builder: (_, posSnap) {
            final posMs = (posSnap.data ?? handler.position).inMilliseconds +
                _manualOffsetMs;
            var activeIdx = 0;
            for (var i = 0; i < lines.length; i++) {
              if (lines[i].timeMs <= posMs) {
                activeIdx = i;
              } else {
                break;
              }
            }

            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 14, 10, 6),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Live Karaoke Lyrics',
                          style: TextStyle(
                              fontSize: 17, fontWeight: FontWeight.w800),
                        ),
                      ),
                      ActionChip(
                        label: Text(
                            'Sync: ${(_manualOffsetMs / 1000).toStringAsFixed(1)}s'),
                        onPressed: () {
                          setState(() => _manualOffsetMs += 500);
                          if (_manualOffsetMs > 2000) _manualOffsetMs = -2000;
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.ios_share_rounded),
                        onPressed: () {
                          final activeLine = lines[activeIdx].text;
                          Navigator.pop(context);
                          showShareSheet(
                            context,
                            ref,
                            track: widget.track,
                            highlightedLyric: activeLine,
                          );
                        },
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    controller: sheetScroll,
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 60),
                    itemCount: lines.length,
                    itemBuilder: (_, idx) {
                      final line = lines[idx];
                      final isActive = idx == activeIdx;
                      return InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: () =>
                            handler.seek(Duration(milliseconds: line.timeMs)),
                        onLongPress: () {
                          Navigator.pop(context);
                          showShareSheet(
                            context,
                            ref,
                            track: widget.track,
                            highlightedLyric: line.text,
                          );
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              vertical: 10, horizontal: 8),
                          child: Text(
                            line.text,
                            style: TextStyle(
                              fontSize: isActive ? 22 : 18,
                              fontWeight:
                                  isActive ? FontWeight.w900 : FontWeight.w600,
                              color: isActive
                                  ? WavelengthColors.emerald
                                  : Colors.white54,
                              height: 1.35,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

class CarModeScreen extends ConsumerWidget {
  const CarModeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(audioEngineTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final track = handler.currentTrack;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Car Mode',
            style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                children: [
                  const SizedBox(height: 20),
                  WavelengthArtwork(
                    imageUrl: track?.artworkUrl ?? '',
                    size: 160,
                    borderRadius: 20,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    track?.title ?? 'Nothing Playing',
                    maxLines: 2,
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    track?.artist ?? '',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 19, color: Colors.white70),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  SizedBox(
                    width: 82,
                    height: 82,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF222226),
                        foregroundColor: Colors.white,
                        shape: const CircleBorder(),
                      ),
                      onPressed: handler.skipToPrevious,
                      child: const Icon(Icons.skip_previous_rounded, size: 44),
                    ),
                  ),
                  SizedBox(
                    width: 108,
                    height: 108,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: WavelengthColors.emerald,
                        foregroundColor: Colors.black,
                        shape: const CircleBorder(),
                      ),
                      onPressed: () =>
                          handler.isPlaying ? handler.pause() : handler.play(),
                      child: Icon(
                        handler.isPlaying
                            ? Icons.pause_rounded
                            : Icons.play_arrow_rounded,
                        size: 56,
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 82,
                    height: 82,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF222226),
                        foregroundColor: Colors.white,
                        shape: const CircleBorder(),
                      ),
                      onPressed: handler.skipToNext,
                      child: const Icon(Icons.skip_next_rounded, size: 44),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
