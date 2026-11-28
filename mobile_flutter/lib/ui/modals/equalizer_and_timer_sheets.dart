import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../audio/wavelength_audio_handler.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import '../../state/app_providers.dart';
import '../widgets/artwork_image.dart';
import 'add_to_playlist_sheet.dart';

Future<void> showEqualizerAndAudioSheet(
  BuildContext context,
  WidgetRef ref,
) async {
  await showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    builder: (_) => const _EqualizerSheet(),
  );
}

class _EqualizerSheet extends ConsumerWidget {
  const _EqualizerSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(audioEngineTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final device = handler.outputDevice;
    final caps = handler.eqCapabilities;

    return DraggableScrollableSheet(
      initialChildSize: 0.78,
      minChildSize: 0.5,
      maxChildSize: 0.94,
      expand: false,
      builder: (_, scrollCtrl) {
        return ListView(
          controller: scrollCtrl,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'Audio Quality & Equalizer',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            // Live DAC / Output Device banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: device.isExternalDac
                    ? WavelengthColors.amberHiRes.withValues(alpha: 0.14)
                    : WavelengthColors.elevatedDark,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: device.isExternalDac
                      ? WavelengthColors.amberHiRes.withValues(alpha: 0.5)
                      : WavelengthColors.borderDark,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    device.route == 'usb_dac'
                        ? Icons.usb_rounded
                        : (device.route.startsWith('bluetooth')
                            ? Icons.bluetooth_audio_rounded
                            : (device.route == 'wired'
                                ? Icons.headphones_rounded
                                : Icons.speaker_rounded)),
                    color: device.isExternalDac
                        ? WavelengthColors.amberHiRes
                        : WavelengthColors.emerald,
                    size: 28,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          device.routeLabel,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          '${device.friendlySummary} • ${device.isLosslessCapable ? 'Lossless Route Ready' : 'Standard Output'}',
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text('Streaming Tier',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: StreamQuality.values.map((q) {
                final selected = handler.quality == q;
                return ChoiceChip(
                  label: Text('${q.label} (${q.shortBadge})'),
                  selected: selected,
                  selectedColor: WavelengthColors.emerald,
                  labelStyle: TextStyle(
                    color: selected ? Colors.black : Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                  onSelected: (_) => handler.setStreamQuality(q),
                );
              }).toList(),
            ),
            const SizedBox(height: 18),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Hardware Equalizer'),
              subtitle: Text(
                caps.initialized
                    ? 'Bound to ExoPlayer session (${caps.bandCount} bands)'
                    : 'Start playing a track to bind Android hardware DSP',
              ),
              value: handler.eqEnabled,
              onChanged: caps.initialized ? (v) => handler.setEqEnabled(v) : null,
            ),
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: EqPresets.all.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (_, idx) {
                  final preset = EqPresets.all[idx];
                  final active = handler.activePresetName == preset.name;
                  return ChoiceChip(
                    label: Text(preset.name),
                    selected: active,
                    onSelected: caps.initialized
                        ? (_) => handler.applyEqPreset(preset)
                        : null,
                  );
                },
              ),
            ),
            if (caps.initialized) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(caps.bandCount, (i) {
                  final hz = i < caps.centerFreqsHz.length
                      ? caps.centerFreqsHz[i]
                      : 1000;
                  final hzLabel = hz >= 1000
                      ? '${(hz / 1000).toStringAsFixed(1)}k'
                      : '$hz';
                  final gainMb = i < handler.eqBandGainsMb.length
                      ? handler.eqBandGainsMb[i]
                      : 0;
                  return Column(
                    children: [
                      Text(
                        '${(gainMb / 100).toStringAsFixed(0)}dB',
                        style: const TextStyle(fontSize: 11, color: Colors.white70),
                      ),
                      RotatedBox(
                        quarterTurns: 3,
                        child: SizedBox(
                          width: 140,
                          child: Slider(
                            min: caps.minMb.toDouble(),
                            max: caps.maxMb.toDouble(),
                            value: gainMb
                                .toDouble()
                                .clamp(caps.minMb.toDouble(), caps.maxMb.toDouble()),
                            onChanged: (val) => handler.setEqBand(i, val.round()),
                          ),
                        ),
                      ),
                      Text(hzLabel,
                          style: const TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w600)),
                    ],
                  );
                }),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const SizedBox(width: 84, child: Text('Bass Boost')),
                  Expanded(
                    child: Slider(
                      min: 0,
                      max: 1000,
                      value: handler.bassStrength.toDouble(),
                      onChanged: (v) => handler.setBassBoostStrength(v.round()),
                    ),
                  ),
                ],
              ),
            ],
            const Divider(height: 24),
            const Text('Playback Speed',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [0.75, 1.0, 1.15, 1.25, 1.5, 2.0].map((s) {
                final selected = (handler.speed - s).abs() < 0.02;
                return ChoiceChip(
                  label: Text('${s}x'),
                  selected: selected,
                  onSelected: (_) => handler.setSpeed(s),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Loudness Normalization'),
              subtitle: const Text('Balances quiet masters using LoudnessEnhancer'),
              value: handler.normalizeAudio,
              onChanged: (v) => handler.setNormalizeAudio(v),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Autoplay Radio'),
              subtitle: const Text('Queue similar tracks when playlist ends'),
              value: handler.autoplayRadio,
              onChanged: (v) => handler.setAutoplayRadio(v),
            ),
          ],
        );
      },
    );
  }
}

Future<void> showSleepTimerSheet(BuildContext context, WidgetRef ref) async {
  final handler = ref.read(audioHandlerProvider);
  await showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    builder: (ctx) {
      final options = <({String label, Duration? duration, bool endOfTrack})>[
        (label: '5 minutes', duration: const Duration(minutes: 5), endOfTrack: false),
        (label: '10 minutes', duration: const Duration(minutes: 10), endOfTrack: false),
        (label: '15 minutes', duration: const Duration(minutes: 15), endOfTrack: false),
        (label: '30 minutes', duration: const Duration(minutes: 30), endOfTrack: false),
        (label: '45 minutes', duration: const Duration(minutes: 45), endOfTrack: false),
        (label: '60 minutes', duration: const Duration(minutes: 60), endOfTrack: false),
        (label: 'End of current track', duration: null, endOfTrack: true),
        (label: 'Turn off sleep timer', duration: null, endOfTrack: false),
      ];
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.all(12),
                child: Text(
                  'Sleep Timer',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
              ),
              ...options.map((opt) {
                return ListTile(
                  leading: Icon(
                    opt.endOfTrack
                        ? Icons.music_off_rounded
                        : (opt.duration == null
                            ? Icons.timer_off_outlined
                            : Icons.bedtime_outlined),
                  ),
                  title: Text(opt.label),
                  onTap: () {
                    handler.setSleepTimer(opt.duration, endOfTrack: opt.endOfTrack);
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          opt.duration == null && !opt.endOfTrack
                              ? 'Sleep timer turned off'
                              : 'Sleep timer set: ${opt.label}',
                        ),
                      ),
                    );
                  },
                );
              }),
            ],
          ),
        ),
      );
    },
  );
}

Future<void> showQueueSheet(BuildContext context, WidgetRef ref) async {
  await showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    builder: (_) => const _QueueSheet(),
  );
}

class _QueueSheet extends ConsumerWidget {
  const _QueueSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(audioEngineTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final queue = handler.orderedQueueTracks;
    final cursor = handler.orderCursor;

    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize: 0.45,
      maxChildSize: 0.94,
      expand: false,
      builder: (_, scrollCtrl) {
        return Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 12, 8),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Play Queue',
                      style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
                    ),
                  ),
                  if (queue.length > 1)
                    TextButton(
                      onPressed: () => handler.clearUpcomingQueue(),
                      child: const Text('Clear upcoming'),
                    ),
                ],
              ),
            ),
            Expanded(
              child: queue.isEmpty
                  ? const Center(child: Text('Queue is empty'))
                  : ReorderableListView.builder(
                      scrollController: scrollCtrl,
                      itemCount: queue.length,
                      onReorder: handler.reorderQueueItem,
                      itemBuilder: (ctx, idx) {
                        final track = queue[idx];
                        final isCurr = idx == cursor;
                        return ListTile(
                          key: ValueKey('q_${idx}_${track.id}'),
                          leading: WavelengthArtwork(
                            imageUrl: track.artworkUrl,
                            size: 44,
                            borderRadius: 6,
                          ),
                          title: Text(
                            track.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: isCurr ? WavelengthColors.emerald : null,
                              fontWeight: isCurr ? FontWeight.w700 : FontWeight.w500,
                            ),
                          ),
                          subtitle: Text(track.artist,
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (!isCurr)
                                IconButton(
                                  icon: const Icon(Icons.close_rounded, size: 18),
                                  onPressed: () => handler.removeQueueItemAt(idx),
                                ),
                              const Icon(Icons.drag_handle_rounded),
                            ],
                          ),
                          onTap: () => handler.skipToQueueItem(idx),
                          onLongPress: () => showTrackOptionsSheet(context, ref, track),
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }
}
