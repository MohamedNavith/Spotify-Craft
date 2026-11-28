import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models.dart';
import '../../core/palette_extractor.dart';
import '../../core/theme.dart';
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
  bool _showRemaining = false;
  double _dragOffsetY = 0.0;
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
    final m = totalSec ~/ 60;
    final s = totalSec % 60;
    return '$m:${s < 10 ? '0' : ''}$s';
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    ref.watch(libraryTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final nav = ref.watch(navigationProvider);
    final paletteAsync = ref.watch(currentPaletteProvider);
    final palette = paletteAsync.value ??
        ArtworkPaletteExtractor.fallbackFor(handler.currentTrack?.title ?? 'wl');

    final track = handler.currentTrack;
    if (track == null) return const SizedBox.shrink();

    final isLiked = handler.isTrackLiked(track.id);
    final details = track.qualityDetails ?? handler.currentStreamDetails;

    return GestureDetector(
      onVerticalDragUpdate: (d) {
        if (d.delta.dy > 0 || _dragOffsetY > 0) {
          setState(() {
            _dragOffsetY = (_dragOffsetY + d.delta.dy).clamp(0.0, 260.0);
          });
        }
      },
      onVerticalDragEnd: (d) {
        if ((d.primaryVelocity ?? 0) > 420 || _dragOffsetY > 110) {
          nav.collapseFullPlayer();
        }
        setState(() => _dragOffsetY = 0);
      },
      child: Transform.translate(
        offset: Offset(0, _dragOffsetY),
        child: Scaffold(
          backgroundColor: WavelengthColors.bgDark,
          body: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  palette.accent.withValues(alpha: 0.45),
                  palette.backgroundTop,
                  WavelengthColors.abyss,
                ],
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  // Top Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    child: Row(
                      children: [
                        IconButton(
                          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 32),
                          tooltip: 'Collapse player',
                          onPressed: nav.collapseFullPlayer,
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              const Text(
                                'PLAYING FROM WAVELENGTH',
                                style: TextStyle(
                                  fontSize: 10,
                                  letterSpacing: 1.2,
                                  fontWeight: FontWeight.w700,
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
                          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: const Icon(Icons.directions_car_outlined),
                          tooltip: 'Car Mode',
                          onPressed: () => Navigator.of(context, rootNavigator: true).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const CarModeScreen(),
                            ),
                          ),
                        ),
                        IconButton(
                          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: const Icon(Icons.more_vert_rounded),
                          onPressed: () => showTrackOptionsSheet(context, ref, track),
                        ),
                      ],
                    ),
                  ),

                  // Artwork + Swipe Next/Prev + Subtle Ambient Visualizer
                  Expanded(
                    child: GestureDetector(
                      onHorizontalDragEnd: (d) {
                        final vx = d.primaryVelocity ?? 0;
                        if (vx < -300) {
                          handler.skipToNext();
                        } else if (vx > 300) {
                          handler.skipToPrevious();
                        }
                      },
                      child: Center(
                        child: AnimatedBuilder(
                          animation: _ambientCtrl,
                          builder: (_, child) {
                            final pulse = handler.isPlaying
                                ? 1.0 + 0.03 * math.sin(_ambientCtrl.value * math.pi * 2)
                                : 1.0;
                            return Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: palette.accent.withValues(
                                      alpha: handler.isPlaying ? 0.38 : 0.16,
                                    ),
                                    blurRadius: 34 * pulse,
                                    spreadRadius: 2 * pulse,
                                  ),
                                ],
                              ),
                              child: child,
                            );
                          },
                          child: WavelengthArtwork(
                            imageUrl: track.artworkUrl,
                            size: MediaQuery.of(context).size.width * 0.78,
                            borderRadius: 18,
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Title, Artist, Like & + Add to playlist + DAC Quality pill
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    track.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                    ),
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
                                        fontSize: 15,
                                        color: Colors.white70,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                              icon: const Icon(Icons.playlist_add_rounded, size: 26),
                              tooltip: 'Add to playlist',
                              onPressed: () =>
                                  showAddToPlaylistSheet(context, ref, track),
                            ),
                            IconButton(
                              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                              icon: Icon(
                                isLiked
                                    ? Icons.favorite_rounded
                                    : Icons.favorite_border_rounded,
                                color: isLiked ? WavelengthColors.emerald : Colors.white,
                                size: 27,
                              ),
                              tooltip: isLiked ? 'Unlike' : 'Like',
                              onPressed: () async {
                                await handler.toggleLikeTrack(track);
                                ref.read(libraryTickProvider.notifier).bump();
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        // Quality & DAC output pill
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            InkWell(
                              borderRadius: BorderRadius.circular(20),
                              onTap: () => showEqualizerAndAudioSheet(context, ref),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      details?.isLossless == true
                                          ? Icons.high_quality_rounded
                                          : Icons.surround_sound_rounded,
                                      size: 14,
                                      color: details?.isLossless == true
                                          ? WavelengthColors.amberHiRes
                                          : WavelengthColors.emerald,
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      '${details?.badgeLabel ?? handler.quality.shortBadge} • ${handler.outputDevice.routeLabel}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            if (handler.statusMessage != null)
                              Text(
                                handler.statusMessage!,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: WavelengthColors.amberHiRes,
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Interactive Seekbar
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
                                  if (mounted) setState(() => _scrubValueMs = null);
                                },
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _fmt(Duration(milliseconds: currentMs.round())),
                                    style: const TextStyle(
                                        fontSize: 12, color: Colors.white70),
                                  ),
                                  GestureDetector(
                                    onTap: () => setState(
                                        () => _showRemaining = !_showRemaining),
                                    child: Text(
                                      _showRemaining
                                          ? '-${_fmt(Duration(milliseconds: (maxMs - currentMs).round()))}'
                                          : _fmt(totalDur),
                                      style: const TextStyle(
                                          fontSize: 12, color: Colors.white70),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  // Primary Transport Controls
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        IconButton(
                          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: Icon(
                            Icons.shuffle_rounded,
                            color: handler.shuffleEnabled
                                ? WavelengthColors.emerald
                                : Colors.white70,
                          ),
                          onPressed: handler.toggleShuffle,
                        ),
                        IconButton(
                          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: const Icon(Icons.skip_previous_rounded, size: 38),
                          onPressed: handler.skipToPrevious,
                        ),
                        Container(
                          width: 68,
                          height: 68,
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
                                    size: 38,
                                  ),
                                  onPressed: () => handler.isPlaying
                                      ? handler.pause()
                                      : handler.play(),
                                ),
                        ),
                        IconButton(
                          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: const Icon(Icons.skip_next_rounded, size: 38),
                          onPressed: handler.skipToNext,
                        ),
                        IconButton(
                          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: Icon(
                            handler.repeatMode == RepeatModeSetting.one
                                ? Icons.repeat_one_rounded
                                : Icons.repeat_rounded,
                            color: handler.repeatMode != RepeatModeSetting.off
                                ? WavelengthColors.emerald
                                : Colors.white70,
                          ),
                          onPressed: handler.cycleRepeatMode,
                        ),
                      ],
                    ),
                  ),

                  // Utility Bottom Bar: Lyrics, EQ, Sleep, Queue, Share Story
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        IconButton(
                          tooltip: 'Lyrics',
                          icon: const Icon(Icons.lyrics_outlined),
                          onPressed: () => showSyncedLyricsSheet(context, ref, track),
                        ),
                        IconButton(
                          tooltip: 'Equalizer & Audio',
                          icon: const Icon(Icons.equalizer_rounded),
                          onPressed: () => showEqualizerAndAudioSheet(context, ref),
                        ),
                        IconButton(
                          tooltip: 'Sleep Timer',
                          icon: Icon(
                            handler.sleepTimerEndsAt != null ||
                                    handler.sleepEndOfTrack
                                ? Icons.bedtime_rounded
                                : Icons.bedtime_outlined,
                            color: handler.sleepTimerEndsAt != null ||
                                    handler.sleepEndOfTrack
                                ? WavelengthColors.emerald
                                : null,
                          ),
                          onPressed: () => showSleepTimerSheet(context, ref),
                        ),
                        IconButton(
                          tooltip: 'Play Queue',
                          icon: const Icon(Icons.queue_music_rounded),
                          onPressed: () => showQueueSheet(context, ref),
                        ),
                        IconButton(
                          tooltip: 'Share Story',
                          icon: const Icon(Icons.ios_share_rounded),
                          onPressed: () =>
                              showShareSheet(context, ref, track: track),
                        ),
                      ],
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
  final ScrollController _scrollCtrl = ScrollController();

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
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
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
                'No lyrics available in LRCLIB for this track yet.',
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
                    child: Text('Lyrics (Unsynced)',
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
            final posMs = (posSnap.data ?? handler.position).inMilliseconds;
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
                  padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Synced Lyrics (Tap line to seek)',
                          style: TextStyle(
                              fontSize: 17, fontWeight: FontWeight.w800),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.ios_share_rounded),
                        tooltip: 'Share active lyric card',
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
                        onTap: () => handler.seek(Duration(milliseconds: line.timeMs)),
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
                                  isActive ? FontWeight.w800 : FontWeight.w600,
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
                      onPressed: () => handler.isPlaying
                          ? handler.pause()
                          : handler.play(),
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
