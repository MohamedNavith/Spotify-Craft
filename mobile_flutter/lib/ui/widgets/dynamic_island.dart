import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../state/app_providers.dart';
import 'artwork_image.dart';

class WavelengthDynamicIsland extends ConsumerStatefulWidget {
  const WavelengthDynamicIsland({super.key});

  @override
  ConsumerState<WavelengthDynamicIsland> createState() =>
      _WavelengthDynamicIslandState();
}

class _WavelengthDynamicIslandState
    extends ConsumerState<WavelengthDynamicIsland>
    with SingleTickerProviderStateMixin {
  late final AnimationController _spinCtrl;
  String? _lastTrackId;
  bool _isPopping = false;
  Timer? _popTimer;

  @override
  void initState() {
    super.initState();
    _spinCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();
  }

  @override
  void dispose() {
    _popTimer?.cancel();
    _spinCtrl.dispose();
    super.dispose();
  }

  String _fmt(Duration d) {
    final s = d.inSeconds.clamp(0, 35999);
    return '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    final effects = ref.watch(displayEffectsProvider);
    final nav = ref.watch(navigationProvider);
    final handler = ref.watch(audioHandlerProvider);
    final track = handler.currentTrack;

    if (!effects.dynamicIslandVisible || nav.isVerciOpen || track == null) {
      return const SizedBox.shrink();
    }

    if (_lastTrackId != track.id) {
      _lastTrackId = track.id;
      _isPopping = true;
      _popTimer?.cancel();
      _popTimer = Timer(const Duration(milliseconds: 2200), () {
        if (mounted) setState(() => _isPopping = false);
      });
    }

    final isPlaying = handler.isPlaying;
    final isLiked = handler.isTrackLiked(track.id);

    return ListenableBuilder(
      listenable: nav,
      builder: (context, _) {
        final expanded = nav.isDynamicIslandExpanded;
        final topPad = MediaQuery.of(context).padding.top + 6;

        return Positioned(
          top: topPad,
          left: 0,
          right: 0,
          child: Center(
            child: GestureDetector(
              onVerticalDragEnd: (details) {
                final vy = details.primaryVelocity ?? 0;
                if (vy < -260) {
                  if (expanded) {
                    nav.setDynamicIslandExpanded(false);
                  } else {
                    ref.read(displayEffectsProvider.notifier).toggleDynamicIsland(false);
                  }
                }
              },
              child: AnimatedScale(
                scale: _isPopping ? 1.03 : 1.0,
                duration: const Duration(milliseconds: 220),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOutCubic,
                  constraints: BoxConstraints(
                    maxWidth: expanded
                        ? math.min(MediaQuery.of(context).size.width * 0.92, 368)
                        : 256,
                  ),
                  padding: expanded
                      ? const EdgeInsets.all(14)
                      : const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.94),
                    borderRadius: BorderRadius.circular(expanded ? 26 : 999),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.85),
                        blurRadius: expanded ? 32 : 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: expanded
                      ? _buildExpandedCard(context, track, isPlaying, isLiked)
                      : _buildCollapsedPill(context, track, isPlaying),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildCollapsedPill(
    BuildContext context,
    dynamic track,
    bool isPlaying,
  ) {
    final nav = ref.read(navigationProvider);
    final handler = ref.read(audioHandlerProvider);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => nav.setDynamicIslandExpanded(true),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _spinCtrl,
            builder: (_, child) => Transform.rotate(
              angle: isPlaying ? _spinCtrl.value * math.pi * 2 : 0,
              child: child,
            ),
            child: WavelengthArtwork(
              imageUrl: track.artworkUrl,
              size: 22,
              isCircular: true,
            ),
          ),
          const SizedBox(width: 7),
          _MiniEqBars(active: isPlaying),
          const SizedBox(width: 7),
          Flexible(
            child: Text(
              track.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                decoration: TextDecoration.none,
              ),
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            customBorder: const CircleBorder(),
            onTap: () => isPlaying ? handler.pause() : handler.play(),
            child: Container(
              width: 22,
              height: 22,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(
                isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                size: 14,
                color: Colors.black,
              ),
            ),
          ),
          const SizedBox(width: 4),
          InkWell(
            customBorder: const CircleBorder(),
            onTap: () =>
                ref.read(displayEffectsProvider.notifier).toggleDynamicIsland(false),
            child: const Padding(
              padding: EdgeInsets.all(2),
              child: Icon(Icons.close_rounded, size: 13, color: Colors.white54),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExpandedCard(
    BuildContext context,
    dynamic track,
    bool isPlaying,
    bool isLiked,
  ) {
    final nav = ref.read(navigationProvider);
    final handler = ref.read(audioHandlerProvider);

    return Material(
      color: Colors.transparent,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              WavelengthArtwork(
                imageUrl: track.artworkUrl,
                size: 48,
                borderRadius: 12,
              ),
              const SizedBox(width: 12),
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
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      track.artist,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white60,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                padding: EdgeInsets.zero,
                icon: const Icon(Icons.keyboard_arrow_up_rounded,
                    color: Colors.white70),
                onPressed: () => nav.setDynamicIslandExpanded(false),
              ),
              IconButton(
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                padding: EdgeInsets.zero,
                icon: const Icon(Icons.close_rounded,
                    color: Colors.white54, size: 18),
                onPressed: () {
                  nav.setDynamicIslandExpanded(false);
                  ref.read(displayEffectsProvider.notifier).toggleDynamicIsland(false);
                },
              ),
            ],
          ),
          const SizedBox(height: 8),
          StreamBuilder<Duration>(
            stream: handler.positionStream,
            builder: (_, snap) {
              final dur = handler.duration;
              final maxMs = math.max(1000, dur.inMilliseconds).toDouble();
              final pos = (snap.data ?? handler.position)
                  .inMilliseconds
                  .toDouble()
                  .clamp(0.0, maxMs);
              return Column(
                children: [
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 3,
                      overlayShape: SliderComponentShape.noOverlay,
                      thumbShape:
                          const RoundSliderThumbShape(enabledThumbRadius: 4.5),
                    ),
                    child: Slider(
                      min: 0,
                      max: maxMs,
                      value: pos,
                      activeColor: WavelengthColors.emerald,
                      inactiveColor: Colors.white24,
                      onChanged: (v) =>
                          handler.seek(Duration(milliseconds: v.round())),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _fmt(Duration(milliseconds: pos.round())),
                        style: const TextStyle(
                            color: Colors.white54, fontSize: 10),
                      ),
                      Text(
                        _fmt(dur),
                        style: const TextStyle(
                            color: Colors.white54, fontSize: 10),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: Icon(
                  isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  color: isLiked ? WavelengthColors.emerald : Colors.white70,
                  size: 20,
                ),
                onPressed: () async {
                  await handler.toggleLikeTrack(track);
                  ref.read(libraryTickProvider.notifier).bump();
                },
              ),
              IconButton(
                icon: const Icon(Icons.skip_previous_rounded,
                    color: Colors.white, size: 26),
                onPressed: handler.skipToPrevious,
              ),
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: Icon(
                    isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                    color: Colors.black,
                    size: 24,
                  ),
                  onPressed: () =>
                      isPlaying ? handler.pause() : handler.play(),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.skip_next_rounded,
                    color: Colors.white, size: 26),
                onPressed: handler.skipToNext,
              ),
              IconButton(
                icon: const Icon(Icons.track_changes_rounded,
                    color: WavelengthColors.amberHiRes, size: 22),
                tooltip: 'Open Verci Studio',
                onPressed: () => nav.openVerci(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniEqBars extends StatefulWidget {
  const _MiniEqBars({required this.active});
  final bool active;

  @override
  State<_MiniEqBars> createState() => _MiniEqBarsState();
}

class _MiniEqBarsState extends State<_MiniEqBars>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, _) {
        final v = _ctrl.value;
        final h1 = widget.active ? 5 + v * 7 : 5.0;
        final h2 = widget.active ? 12 - v * 6 : 7.0;
        final h3 = widget.active ? 7 + (1 - v) * 6 : 6.0;
        return Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [h1, h2, h3]
              .map((h) => Container(
                    width: 2.3,
                    height: h,
                    margin: const EdgeInsets.symmetric(horizontal: 1),
                    decoration: BoxDecoration(
                      color: WavelengthColors.emerald,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ))
              .toList(),
        );
      },
    );
  }
}
