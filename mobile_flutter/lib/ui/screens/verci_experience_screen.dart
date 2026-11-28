import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models.dart';
import '../../core/palette_extractor.dart';
import '../../core/theme.dart';
import '../../data/curated_catalog.dart';
import '../../state/app_providers.dart';
import '../widgets/artwork_image.dart';

class _WordNode {
  const _WordNode({
    required this.word,
    required this.startMs,
    required this.endMs,
    required this.xFrac,
    required this.yFrac,
  });

  final String word;
  final double startMs;
  final double endMs;
  final double xFrac; // 0..1
  final double yFrac; // 0..1
}

class VerciExperienceScreen extends ConsumerStatefulWidget {
  const VerciExperienceScreen({super.key});

  @override
  ConsumerState<VerciExperienceScreen> createState() =>
      _VerciExperienceScreenState();
}

class _VerciExperienceScreenState extends ConsumerState<VerciExperienceScreen>
    with SingleTickerProviderStateMixin {
  LyricsResult? _lyrics;
  String? _loadedTrackId;
  bool _loadingLyrics = false;
  bool _fullscreen = false;
  String _timeStr = '';
  String _dateStr = '';
  Timer? _clockTimer;
  late final AnimationController _pulseCtrl;
  final ScrollController _scrollCtrl = ScrollController();
  int _lastScrolledIdx = -1;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
    _updateClock();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) => _updateClock());
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _pulseCtrl.dispose();
    _scrollCtrl.dispose();
    if (_fullscreen) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    }
    super.dispose();
  }

  void _updateClock() {
    final now = DateTime.now();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    if (!mounted) return;
    setState(() {
      _timeStr =
          '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
      _dateStr =
          '${days[now.weekday - 1]}, ${months[now.month - 1]} ${now.day}';
    });
  }

  Future<void> _ensureLyricsLoaded(WavelengthTrack track) async {
    if (_loadedTrackId == track.id) return;
    _loadedTrackId = track.id;
    setState(() {
      _loadingLyrics = true;
      _lyrics = null;
      _lastScrolledIdx = -1;
    });
    final res = await ref.read(catalogServiceProvider).getLyricsForTrack(track);
    if (mounted && _loadedTrackId == track.id) {
      setState(() {
        _lyrics = res;
        _loadingLyrics = false;
      });
    }
  }

  Future<void> _toggleFullscreen() async {
    final next = !_fullscreen;
    setState(() => _fullscreen = next);
    await SystemChrome.setEnabledSystemUIMode(
      next ? SystemUiMode.immersiveSticky : SystemUiMode.edgeToEdge,
    );
  }

  void _openStudioControlsSheet() {
    showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      backgroundColor: const Color(0xFF14151A),
      builder: (ctx) => Consumer(
        builder: (ctx, ref, _) {
          final effects = ref.watch(displayEffectsProvider);
          final notifier = ref.read(displayEffectsProvider.notifier);
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.auto_awesome_rounded,
                          color: WavelengthColors.emerald),
                      SizedBox(width: 8),
                      Text(
                        'Verci & Lumn Pro Studio',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'VISUAL STYLE',
                    style: TextStyle(
                        fontSize: 11,
                        letterSpacing: 1.1,
                        color: Colors.white54,
                        fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  ...VerciStyle.values.map((style) {
                    final active = effects.verciStyle == style;
                    return ListTile(
                      dense: true,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      tileColor: active
                          ? WavelengthColors.emerald
                          : Colors.white.withValues(alpha: 0.04),
                      title: Text(
                        style.label,
                        style: TextStyle(
                          color: active ? Colors.black : Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      subtitle: Text(
                        style.description,
                        style: TextStyle(
                          color: active ? Colors.black87 : Colors.white60,
                          fontSize: 12,
                        ),
                      ),
                      trailing: active
                          ? const Icon(Icons.check_rounded, color: Colors.black)
                          : null,
                      onTap: () {
                        notifier.setVerciStyle(style);
                        Navigator.pop(ctx);
                      },
                    );
                  }),
                  const SizedBox(height: 16),
                  const Text(
                    'TYPOGRAPHY',
                    style: TextStyle(
                        fontSize: 11,
                        letterSpacing: 1.1,
                        color: Colors.white54,
                        fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: VerciFontStyle.values.map((f) {
                      final active = effects.verciFont == f;
                      return ChoiceChip(
                        label: Text(f.name.toUpperCase()),
                        selected: active,
                        selectedColor: Colors.white,
                        labelStyle: TextStyle(
                          color: active ? Colors.black : Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                        onSelected: (_) => notifier.setVerciFont(f),
                      );
                    }).toList(),
                  ),
                  const Divider(height: 24),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Lumn Ambient Rim Glow',
                        style: TextStyle(fontWeight: FontWeight.w700)),
                    value: effects.lumnGlowEnabled,
                    activeTrackColor: WavelengthColors.emerald,
                    onChanged: (v) => notifier.toggleLumnGlow(v),
                  ),
                  if (effects.lumnGlowEnabled)
                    Row(
                      children: [
                        const Text('Glow', style: TextStyle(fontSize: 12)),
                        Expanded(
                          child: Slider(
                            min: 20,
                            max: 140,
                            value: effects.lumnGlowIntensity,
                            activeColor: WavelengthColors.emerald,
                            onChanged: notifier.setLumnGlowIntensity,
                          ),
                        ),
                      ],
                    ),
                  Row(
                    children: [
                      const Text('Text Size', style: TextStyle(fontSize: 12)),
                      Expanded(
                        child: Slider(
                          min: 0.7,
                          max: 1.5,
                          value: effects.verciTextScale,
                          activeColor: WavelengthColors.emerald,
                          onChanged: notifier.setVerciTextScale,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// Faithful port of Astra's FNV-1a seeded zigzag star-map constellation placer.
  List<_WordNode> _buildConstellationNodes(
    LyricLine line,
    LyricLine? nextLine,
  ) {
    final words = line.text.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    if (words.isEmpty) return const [];

    final startMs = line.timeMs.toDouble();
    final endMs = nextLine != null ? nextLine.timeMs.toDouble() : startMs + 4500.0;
    final wordDur = math.max(1500.0, endMs - startMs) / words.length;

    // Deterministic FNV-1a seed from text + timestamp
    var hash = 2166136261;
    final combined = '${line.text}_${(line.timeMs / 100).floor()}';
    for (final c in combined.codeUnits) {
      hash ^= c;
      hash = (hash * 16777619) & 0xFFFFFFFF;
    }
    var state = hash == 0 ? 1 : hash;
    double nextRand() {
      state ^= (state << 13) & 0xFFFFFFFF;
      state ^= (state >> 17) & 0xFFFFFFFF;
      state ^= (state << 5) & 0xFFFFFFFF;
      return (state % 100000) / 100000.0;
    }

    const anchors = [
      (0.74, 0.28), (0.24, 0.32), (0.76, 0.64),
      (0.26, 0.68), (0.50, 0.28), (0.50, 0.70),
      (0.50, 0.50), (0.80, 0.46), (0.20, 0.46),
    ];
    final start = anchors[(nextRand() * anchors.length).floor()];
    var curX = (start.$1 * 100 + (nextRand() * 16 - 8)).clamp(16.0, 84.0);
    var curY = (start.$2 * 100 + (nextRand() * 14 - 7)).clamp(22.0, 76.0);
    var heading = nextRand() * math.pi * 2;

    final out = <_WordNode>[];
    for (var i = 0; i < words.length; i++) {
      if (i > 0) {
        final stepDist = 18.0 + nextRand() * 10.0;
        final zigzagSign = i.isOdd ? 1.0 : -1.0;
        heading += zigzagSign * ((math.pi * 0.45) + nextRand() * 0.45);
        var nx = curX + math.cos(heading) * stepDist;
        var ny = curY + math.sin(heading) * stepDist;
        if (nx < 16 || nx > 84) {
          heading = math.pi - heading;
          nx = nx.clamp(16.0, 84.0);
        }
        if (ny < 20 || ny > 78) {
          heading = -heading;
          ny = ny.clamp(20.0, 78.0);
        }
        curX = nx;
        curY = ny;
      }
      out.add(_WordNode(
        word: words[i],
        startMs: startMs + i * wordDur,
        endMs: startMs + (i + 1) * wordDur,
        xFrac: curX / 100.0,
        yFrac: curY / 100.0,
      ));
    }
    return out;
  }

  TextStyle _fontBase(VerciFontStyle style) {
    return switch (style) {
      VerciFontStyle.figtree => const TextStyle(fontWeight: FontWeight.w900),
      VerciFontStyle.sfPro => const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.4),
      VerciFontStyle.serif => const TextStyle(fontFamily: 'serif', fontWeight: FontWeight.w700),
      VerciFontStyle.monospace => const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700),
    };
  }

  String _fmt(Duration d) {
    final s = d.inSeconds.clamp(0, 35999);
    return '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    final effects = ref.watch(displayEffectsProvider);
    final handler = ref.watch(audioHandlerProvider);
    final nav = ref.watch(navigationProvider);
    final palette = ref.watch(currentPaletteProvider).value ??
        ArtworkPaletteExtractor.fallbackFor('verci');

    final track = handler.currentTrack ?? CuratedCatalog.todayTopHits.first;
    unawaited(_ensureLyricsLoaded(track));

    final lines = _lyrics?.syncedLines ?? const <LyricLine>[];

    return GestureDetector(
      onVerticalDragEnd: (d) {
        if ((d.primaryVelocity ?? 0) > 420) nav.closeVerci();
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: AnimatedBuilder(
          animation: _pulseCtrl,
          builder: (context, child) {
            final glowAlpha = effects.lumnGlowEnabled
                ? (0.35 + 0.25 * _pulseCtrl.value)
                : 0.0;
            return Container(
              decoration: BoxDecoration(
                color: Colors.black,
                border: effects.lumnGlowEnabled
                    ? Border.all(
                        color: palette.accent.withValues(alpha: glowAlpha + 0.15),
                        width: (effects.lumnGlowIntensity / 18).clamp(3.0, 7.0),
                      )
                    : null,
                boxShadow: effects.lumnGlowEnabled
                    ? [
                        BoxShadow(
                          color: palette.accent.withValues(alpha: glowAlpha),
                          blurRadius: effects.lumnGlowIntensity * 0.9,
                          spreadRadius: 4,
                        ),
                      ]
                    : null,
              ),
              child: child,
            );
          },
          child: SafeArea(
            child: Stack(
              children: [
                // Ambient corner nebulas matching Lumn colors
                Positioned(
                  top: -90,
                  left: -80,
                  child: Container(
                    width: 260,
                    height: 260,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          palette.accent.withValues(alpha: 0.22),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: -90,
                  right: -80,
                  child: Container(
                    width: 280,
                    height: 280,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          palette.backgroundTop.withValues(alpha: 0.35),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
                Column(
                  children: [
                    // Glassmorphic Header
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.45),
                        border: const Border(
                          bottom: BorderSide(color: Colors.white12),
                        ),
                      ),
                      child: Row(
                        children: [
                          WavelengthArtwork(
                            imageUrl: track.artworkUrl,
                            size: 40,
                            borderRadius: 8,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  track.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13.5,
                                  ),
                                ),
                                Text(
                                  track.artist,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white60,
                                    fontSize: 11.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          InkWell(
                            borderRadius: BorderRadius.circular(999),
                            onTap: _openStudioControlsSheet,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: Colors.white12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.track_changes_rounded,
                                      size: 14, color: WavelengthColors.emerald),
                                  const SizedBox(width: 5),
                                  Text(
                                    effects.verciStyle.label,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const Icon(Icons.keyboard_arrow_down_rounded,
                                      size: 15, color: Colors.white70),
                                ],
                              ),
                            ),
                          ),
                          IconButton(
                            constraints:
                                const BoxConstraints(minWidth: 36, minHeight: 36),
                            icon: Icon(
                              _fullscreen
                                  ? Icons.fullscreen_exit_rounded
                                  : Icons.fullscreen_rounded,
                              color: Colors.white70,
                              size: 20,
                            ),
                            onPressed: _toggleFullscreen,
                          ),
                          InkWell(
                            borderRadius: BorderRadius.circular(999),
                            onTap: nav.closeVerci,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: Colors.white24),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.close_rounded,
                                      size: 14, color: WavelengthColors.emerald),
                                  SizedBox(width: 4),
                                  Text('Exit',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 11.5)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Center Stage Visualizer
                    Expanded(
                      child: StreamBuilder<Duration>(
                        stream: handler.positionStream,
                        builder: (context, posSnap) {
                          final posMs =
                              (posSnap.data ?? handler.position).inMilliseconds;
                          if (_loadingLyrics) {
                            return const Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CircularProgressIndicator(
                                    color: WavelengthColors.emerald,
                                  ),
                                  SizedBox(height: 12),
                                  Text(
                                    'Aligning Constellation & Syncing Lyrics...',
                                    style: TextStyle(color: Colors.white60),
                                  ),
                                ],
                              ),
                            );
                          }

                          if (lines.isEmpty) {
                            return Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    WavelengthArtwork(
                                      imageUrl: track.artworkUrl,
                                      size: 180,
                                      borderRadius: 18,
                                    ),
                                    const SizedBox(height: 18),
                                    Text(
                                      track.title,
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.w900),
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      _lyrics?.plainLyrics?.isNotEmpty == true
                                          ? _lyrics!.plainLyrics!
                                              .split('\n')
                                              .take(6)
                                              .join('\n')
                                          : 'Enjoy the ambient Lumn glow around your display.',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                          color: Colors.white60, fontSize: 14),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }

                          var activeIdx = 0;
                          for (var i = lines.length - 1; i >= 0; i--) {
                            if (posMs >= lines[i].timeMs - 200) {
                              activeIdx = i;
                              break;
                            }
                          }
                          final activeLine = lines[activeIdx];
                          final nextLine =
                              activeIdx + 1 < lines.length ? lines[activeIdx + 1] : null;

                          switch (effects.verciStyle) {
                            case VerciStyle.constellation:
                              return _buildConstellationStage(
                                activeLine,
                                nextLine,
                                posMs,
                                effects,
                              );
                            case VerciStyle.kinetic:
                              return _buildKineticStage(
                                activeLine,
                                track,
                                effects,
                              );
                            case VerciStyle.fisheye:
                              return _buildFisheyeStage(
                                lines,
                                activeIdx,
                                handler,
                                effects,
                              );
                            case VerciStyle.minimal:
                              return _buildMinimalStage(
                                activeLine,
                                nextLine,
                                activeIdx,
                                effects,
                              );
                            case VerciStyle.canvas:
                            case VerciStyle.spicetify:
                              return _buildSpicetifyCanvasStage(
                                lines,
                                activeIdx,
                                track,
                                handler,
                                palette,
                                effects,
                              );
                          }
                        },
                      ),
                    ),

                    // Bottom Glassmorphic Player Controls HUD
                    Container(
                      padding: const EdgeInsets.fromLTRB(18, 10, 18, 14),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        border: const Border(
                          top: BorderSide(color: Colors.white12),
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          StreamBuilder<Duration>(
                            stream: handler.positionStream,
                            builder: (_, snap) {
                              final dur = handler.duration;
                              final maxMs =
                                  math.max(1000, dur.inMilliseconds).toDouble();
                              final pos = (snap.data ?? handler.position)
                                  .inMilliseconds
                                  .toDouble()
                                  .clamp(0.0, maxMs);
                              return Row(
                                children: [
                                  Text(
                                    _fmt(Duration(milliseconds: pos.round())),
                                    style: const TextStyle(
                                        fontSize: 11, color: Colors.white60),
                                  ),
                                  Expanded(
                                    child: SliderTheme(
                                      data: SliderTheme.of(context).copyWith(
                                        trackHeight: 3,
                                        thumbShape: const RoundSliderThumbShape(
                                            enabledThumbRadius: 5),
                                      ),
                                      child: Slider(
                                        min: 0,
                                        max: maxMs,
                                        value: pos,
                                        activeColor: WavelengthColors.emerald,
                                        inactiveColor: Colors.white24,
                                        onChanged: (v) => handler.seek(
                                            Duration(milliseconds: v.round())),
                                      ),
                                    ),
                                  ),
                                  Text(
                                    _fmt(dur),
                                    style: const TextStyle(
                                        fontSize: 11, color: Colors.white60),
                                  ),
                                ],
                              );
                            },
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.skip_previous_rounded,
                                    color: Colors.white70, size: 28),
                                onPressed: handler.skipToPrevious,
                              ),
                              const SizedBox(width: 24),
                              Container(
                                width: 52,
                                height: 52,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                                child: IconButton(
                                  icon: Icon(
                                    handler.isPlaying
                                        ? Icons.pause_rounded
                                        : Icons.play_arrow_rounded,
                                    color: Colors.black,
                                    size: 28,
                                  ),
                                  onPressed: () => handler.isPlaying
                                      ? handler.pause()
                                      : handler.play(),
                                ),
                              ),
                              const SizedBox(width: 24),
                              IconButton(
                                icon: const Icon(Icons.skip_next_rounded,
                                    color: Colors.white70, size: 28),
                                onPressed: handler.skipToNext,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildConstellationStage(
    LyricLine activeLine,
    LyricLine? nextLine,
    int posMs,
    DisplayEffectsState effects,
  ) {
    final nodes = _buildConstellationNodes(activeLine, nextLine);
    if (nodes.isEmpty) return const SizedBox.shrink();

    var activeWordIdx = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (posMs >= nodes[i].startMs && posMs < nodes[i].endMs) {
        activeWordIdx = i;
        break;
      }
      if (posMs >= nodes[i].endMs) activeWordIdx = i;
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;
        final baseStyle = _fontBase(effects.verciFont);

        return Stack(
          children: [
            CustomPaint(
              size: Size(w, h),
              painter: _ConstellationLinesPainter(
                nodes: nodes,
                activeWordIdx: activeWordIdx,
              ),
            ),
            ...nodes.asMap().entries.map((entry) {
              final idx = entry.key;
              final node = entry.value;
              final isActive = idx == activeWordIdx;
              final isPast = idx < activeWordIdx;
              final size =
                  (isActive ? 28.0 : 15.0) * effects.verciTextScale;

              return Positioned(
                left: (node.xFrac * w - 75).clamp(8.0, math.max(8.0, w - 158)),
                top: (node.yFrac * h - 28).clamp(8.0, math.max(8.0, h - 68)),
                width: 150,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '✦',
                      style: TextStyle(
                        fontSize: isActive ? 16 : 11,
                        color: isActive
                            ? WavelengthColors.emerald
                            : (isPast ? Colors.white60 : Colors.white24),
                      ),
                    ),
                    Text(
                      node.word,
                      textAlign: TextAlign.center,
                      style: baseStyle.copyWith(
                        fontSize: size,
                        color: isActive
                            ? Colors.white
                            : (isPast ? Colors.white70 : Colors.white30),
                        shadows: isActive
                            ? [
                                Shadow(
                                  color: Colors.white.withValues(alpha: 0.75),
                                  blurRadius: 22,
                                ),
                              ]
                            : null,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        );
      },
    );
  }

  Widget _buildKineticStage(
    LyricLine activeLine,
    WavelengthTrack track,
    DisplayEffectsState effects,
  ) {
    final words = activeLine.text.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    String chunk1 = '';
    String chunk2 = '';
    String chunk3 = '';
    if (words.length <= 2) {
      chunk1 = words.isNotEmpty ? words[0] : '';
      chunk3 = words.length > 1 ? words[1] : '';
    } else if (words.length == 3) {
      chunk1 = words[0];
      chunk2 = words[1];
      chunk3 = words[2];
    } else {
      final third = (words.length / 3).ceil();
      final twoThirds = (2 * words.length / 3).ceil();
      chunk1 = words.sublist(0, third).join(' ');
      chunk2 = words.sublist(third, twoThirds).join(' ');
      chunk3 = words.sublist(twoThirds).join(' ');
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            children: [
              Text(
                _dateStr.toUpperCase(),
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 12,
                  letterSpacing: 1.8,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                _timeStr,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 56,
                  fontWeight: FontWeight.w200,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
          Column(
            children: [
              if (chunk1.isNotEmpty)
                Text(
                  '$chunk1 ✦',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'serif',
                    fontStyle: FontStyle.italic,
                    fontSize: 26 * effects.verciTextScale,
                    color: WavelengthColors.amberHiRes,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              const SizedBox(height: 10),
              if (chunk2.isNotEmpty)
                Text(
                  chunk2,
                  textAlign: TextAlign.center,
                  style: _fontBase(effects.verciFont).copyWith(
                    fontSize: 40 * effects.verciTextScale,
                    color: Colors.white,
                    height: 1.05,
                  ),
                ),
              const SizedBox(height: 12),
              if (chunk3.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                  decoration: BoxDecoration(
                    color: WavelengthColors.amberHiRes,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: WavelengthColors.amberHiRes.withValues(alpha: 0.45),
                        blurRadius: 24,
                      ),
                    ],
                  ),
                  child: Text(
                    chunk3,
                    textAlign: TextAlign.center,
                    style: _fontBase(effects.verciFont).copyWith(
                      fontSize: 32 * effects.verciTextScale,
                      color: Colors.black,
                    ),
                  ),
                ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white12),
            ),
            child: Text(
              '${track.title} • ${track.artist}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFisheyeStage(
    List<LyricLine> lines,
    int activeIdx,
    dynamic handler,
    DisplayEffectsState effects,
  ) {
    final prev = activeIdx > 0 ? lines[activeIdx - 1] : null;
    final curr = lines[activeIdx];
    final next = activeIdx + 1 < lines.length ? lines[activeIdx + 1] : null;
    final baseStyle = _fontBase(effects.verciFont);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (prev != null)
              GestureDetector(
                onTap: () => handler.seek(Duration(milliseconds: prev.timeMs)),
                child: Text(
                  prev.text,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18 * effects.verciTextScale,
                    color: Colors.white30,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 18),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.white24),
              ),
              child: Text(
                curr.text,
                textAlign: TextAlign.center,
                style: baseStyle.copyWith(
                  fontSize: 29 * effects.verciTextScale,
                  color: Colors.white,
                  height: 1.25,
                ),
              ),
            ),
            const SizedBox(height: 18),
            if (next != null)
              GestureDetector(
                onTap: () => handler.seek(Duration(milliseconds: next.timeMs)),
                child: Text(
                  next.text,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18 * effects.verciTextScale,
                    color: Colors.white30,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMinimalStage(
    LyricLine activeLine,
    LyricLine? nextLine,
    int activeIdx,
    DisplayEffectsState effects,
  ) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 24),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF141416).withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'NOW SINGING • LINE #${activeIdx + 1}',
              style: const TextStyle(
                color: WavelengthColors.emerald,
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              activeLine.text,
              textAlign: TextAlign.center,
              style: _fontBase(effects.verciFont).copyWith(
                fontSize: 28 * effects.verciTextScale,
                color: Colors.white,
                height: 1.25,
              ),
            ),
            if (nextLine != null) ...[
              const SizedBox(height: 14),
              Text(
                'Up next: "${nextLine.text}"',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white38, fontSize: 13),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSpicetifyCanvasStage(
    List<LyricLine> lines,
    int activeIdx,
    WavelengthTrack track,
    dynamic handler,
    ExtractedPalette palette,
    DisplayEffectsState effects,
  ) {
    if (_lastScrolledIdx != activeIdx && _scrollCtrl.hasClients) {
      _lastScrolledIdx = activeIdx;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollCtrl.hasClients) {
          _scrollCtrl.animateTo(
            math.max(0.0, activeIdx * 64.0 - 80.0),
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOutCubic,
          );
        }
      });
    }

    final clip = CuratedCatalog.resolveHighlightForTrack(track);
    final baseStyle = _fontBase(effects.verciFont);

    return Column(
      children: [
        if (effects.verciStyle == VerciStyle.canvas)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
            child: Stack(
              children: [
                WavelengthArtwork(
                  imageUrl: track.artworkUrl,
                  size: 168,
                  borderRadius: 18,
                ),
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      clip?.label ?? 'LIVE VISUAL CANVAS',
                      style: const TextStyle(
                        color: WavelengthColors.emerald,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        Expanded(
          child: ListView.builder(
            controller: _scrollCtrl,
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 20),
            itemCount: lines.length,
            itemBuilder: (_, idx) {
              final line = lines[idx];
              final isActive = idx == activeIdx;
              return GestureDetector(
                onTap: () => handler.seek(Duration(milliseconds: line.timeMs)),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: isActive
                      ? BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          gradient: RadialGradient(
                            colors: [
                              palette.accent.withValues(alpha: 0.45),
                              Colors.purpleAccent.withValues(alpha: 0.18),
                              Colors.transparent,
                            ],
                          ),
                        )
                      : null,
                  child: Text(
                    line.text,
                    style: baseStyle.copyWith(
                      fontSize: (isActive ? 25 : 18) * effects.verciTextScale,
                      color: isActive ? Colors.white : Colors.white38,
                      height: 1.3,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ConstellationLinesPainter extends CustomPainter {
  _ConstellationLinesPainter({
    required this.nodes,
    required this.activeWordIdx,
  });

  final List<_WordNode> nodes;
  final int activeWordIdx;

  @override
  void paint(Canvas canvas, Size size) {
    if (nodes.length < 2) return;
    for (var i = 1; i < nodes.length; i++) {
      final a = Offset(nodes[i - 1].xFrac * size.width, nodes[i - 1].yFrac * size.height);
      final b = Offset(nodes[i].xFrac * size.width, nodes[i].yFrac * size.height);
      final passed = i <= activeWordIdx;
      final paint = Paint()
        ..color = passed
            ? Colors.white.withValues(alpha: 0.72)
            : Colors.white.withValues(alpha: 0.2)
        ..strokeWidth = passed ? 2.0 : 1.1
        ..style = PaintingStyle.stroke;
      if (passed) {
        canvas.drawLine(a, b, paint);
      } else {
        // Dashed star-map link for upcoming words
        const dash = 6.0;
        const gap = 5.0;
        final total = (b - a).distance;
        final dir = (b - a) / math.max(1.0, total);
        var d = 0.0;
        while (d < total) {
          final p1 = a + dir * d;
          final p2 = a + dir * math.min(total, d + dash);
          canvas.drawLine(p1, p2, paint);
          d += dash + gap;
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _ConstellationLinesPainter oldDelegate) =>
      oldDelegate.activeWordIdx != activeWordIdx || oldDelegate.nodes != nodes;
}
