import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../audio/wavelength_audio_handler.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import '../../state/app_providers.dart';
import '../widgets/artwork_image.dart';
import 'add_to_playlist_sheet.dart';

Future<void> showStreamingQualitySheet(
  BuildContext context,
  WidgetRef ref,
) async {
  await showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    backgroundColor: Colors.black,
    builder: (_) => const _StreamingQualitySheet(),
  );
}

class _StreamingQualitySheet extends ConsumerStatefulWidget {
  const _StreamingQualitySheet();

  @override
  ConsumerState<_StreamingQualitySheet> createState() =>
      _StreamingQualitySheetState();
}

class _StreamingQualitySheetState extends ConsumerState<_StreamingQualitySheet> {
  Future<void> _selectQuality(
    WavelengthAudioHandler handler,
    StreamQuality next,
  ) async {
    if ((next == StreamQuality.lossless ||
            next == StreamQuality.hiResLossless) &&
        handler.quality != next) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (dCtx) => AlertDialog(
          backgroundColor: const Color(0xFF1C1C1E),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          icon: const Icon(
            Icons.warning_amber_rounded,
            color: WavelengthColors.amberHiRes,
            size: 40,
          ),
          title: Text(
            'Turn On ${next.label}?',
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
          content: Text(
            'Lossless audio streams consume significantly more bandwidth — up to ${next == StreamQuality.hiResLossless ? '145 MB' : '36 MB'} per 3-minute song. Streaming over cellular data may quickly exhaust your mobile data plan.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 13),
          ),
          actionsAlignment: MainAxisAlignment.center,
          actions: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: WavelengthColors.appleBlue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => Navigator.pop(dCtx, true),
                  child: const Text('Turn On Lossless',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 6),
                TextButton(
                  onPressed: () => Navigator.pop(dCtx, false),
                  child: const Text('Keep Current Tier'),
                ),
              ],
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }
    await handler.setStreamQuality(next);
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final track = handler.currentTrack;
    final details = track?.qualityDetails ?? handler.currentStreamDetails;
    final device = handler.outputDevice;

    final options = [
      StreamQuality.highEfficiency,
      StreamQuality.highQuality,
      StreamQuality.lossless,
      StreamQuality.hiResLossless,
      StreamQuality.auto,
    ];

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (_, scrollCtrl) {
        return Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: const BoxDecoration(
                color: Color(0xFF121214),
                border: Border(bottom: BorderSide(color: Colors.white10)),
              ),
              child: Row(
                children: [
                  TextButton.icon(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.chevron_left_rounded,
                        color: WavelengthColors.appleBlue),
                    label: const Text('Back',
                        style: TextStyle(color: WavelengthColors.appleBlue)),
                  ),
                  const Expanded(
                    child: Text(
                      'Mobile Data Streaming',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: Colors.white),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white70),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 30),
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF1C1C1E),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Column(
                      children: options.asMap().entries.map((entry) {
                        final idx = entry.key;
                        final opt = entry.value;
                        final selected = handler.quality == opt;
                        return Column(
                          children: [
                            ListTile(
                              onTap: () => _selectQuality(handler, opt),
                              title: Text(
                                opt.label,
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 15),
                              ),
                              subtitle: Text(
                                opt.subtitle,
                                style: const TextStyle(
                                    color: Color(0xFF8E8E93), fontSize: 12),
                              ),
                              trailing: selected
                                  ? const Icon(Icons.check_rounded,
                                      color: WavelengthColors.appleBlue)
                                  : null,
                            ),
                            if (idx < options.length - 1)
                              const Divider(
                                  height: 1,
                                  indent: 16,
                                  color: Color(0xFF2C2C2E)),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    'Lossless streaming will consume significantly more data.\n\nA three-minute song will be approximately:\n– 1.5 MB with High Efficiency\n– 6 MB with High Quality at 256–320 kbps\n– 36 MB with Lossless at 24-bit/48 kHz\n– 145 MB with Hi-Res Lossless at 24-bit/192 kHz\n\nSupport varies and depends on song availability, network conditions, and connected speaker, wired earphone, or USB-C DAC capability.',
                    style: TextStyle(
                      color: Color(0xFF8E8E93),
                      fontSize: 12.5,
                      height: 1.48,
                    ),
                  ),
                  if (track != null) ...[
                    const SizedBox(height: 18),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1C1C1E),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: Colors.white10),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.album_rounded,
                                  size: 16, color: WavelengthColors.appleBlue),
                              const SizedBox(width: 6),
                              const Expanded(
                                child: Text(
                                  'Now Playing Stream Specs',
                                  style: TextStyle(
                                    color: Color(0xFF8E8E93),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: details?.isLossless == true
                                      ? WavelengthColors.amberHiRes
                                          .withValues(alpha: 0.2)
                                      : Colors.white10,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  details?.tierLabel ?? 'HIGH QUALITY AAC',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: details?.isLossless == true
                                        ? WavelengthColors.amberHiRes
                                        : Colors.white70,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 18, color: Colors.white10),
                          Row(
                            children: [
                              Expanded(
                                child: _SpecCell(
                                  label: 'Format & Codec',
                                  value: details?.codec ?? 'AAC',
                                ),
                              ),
                              Expanded(
                                child: _SpecCell(
                                  label: 'Bitrate',
                                  value: details?.bitrateKbps != null
                                      ? '${details!.bitrateKbps} kbps'
                                      : '320 kbps',
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: _SpecCell(
                                  label: 'Sample Rate / Depth',
                                  value:
                                      '${((details?.sampleRateHz ?? 44100) / 1000).toStringAsFixed(1)} kHz / ${details?.bitDepth ?? 16}-bit',
                                ),
                              ),
                              Expanded(
                                child: _SpecCell(
                                  label: 'Est. Size / Song',
                                  value:
                                      '~${(details?.estimatedSizeMb(track.durationMs) ?? 6.8).toStringAsFixed(1)} MB',
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 18, color: Colors.white10),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.headphones_rounded,
                                  size: 18, color: WavelengthColors.appleBlue),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'DAC & Earphone Hardware Status: ${device.routeLabel} (${device.friendlySummary}). ${details?.isLossless == true ? 'Bit-perfect FLAC decoding active cleanly.' : 'Streams clean studio master audio matching your route capability.'}',
                                  style: const TextStyle(
                                    color: Color(0xFFA1A1A6),
                                    fontSize: 11.5,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SpecCell extends StatelessWidget {
  const _SpecCell({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(color: Color(0xFF71717A), fontSize: 11)),
        const SizedBox(height: 2),
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontFamily: 'monospace',
                fontWeight: FontWeight.w600,
                fontSize: 12)),
      ],
    );
  }
}

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
      initialChildSize: 0.82,
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
            Row(
              children: [
                const Icon(Icons.tune_rounded, color: WavelengthColors.emerald),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Equalizer & Audio Effects',
                    style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
                  ),
                ),
                TextButton(
                  onPressed: () => showStreamingQualitySheet(context, ref),
                  child: const Text('Quality Tiers'),
                ),
              ],
            ),
            const SizedBox(height: 10),
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
                    size: 26,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(device.routeLabel,
                            style: const TextStyle(
                                fontWeight: FontWeight.w700, fontSize: 14)),
                        Text(device.friendlySummary,
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Hardware Equalizer'),
              subtitle: Text(
                caps.initialized
                    ? 'Active on ExoPlayer session (${caps.bandCount} hardware bands)'
                    : 'Play a song to calibrate device DSP bands',
              ),
              value: handler.eqEnabled,
              activeTrackColor: WavelengthColors.emerald,
              onChanged: caps.initialized ? (v) => handler.setEqEnabled(v) : null,
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: EqPresets.all.map((preset) {
                final active = handler.activePresetName == preset.name;
                return ChoiceChip(
                  label: Text(preset.name),
                  selected: active,
                  selectedColor: WavelengthColors.emerald,
                  labelStyle: TextStyle(
                    color: active ? Colors.black : Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                  onSelected:
                      caps.initialized ? (_) => handler.applyEqPreset(preset) : null,
                );
              }).toList(),
            ),
            if (caps.initialized) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
                decoration: BoxDecoration(
                  color: Colors.black38,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
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
                          style: const TextStyle(
                              fontSize: 11, color: Colors.white70),
                        ),
                        RotatedBox(
                          quarterTurns: 3,
                          child: SizedBox(
                            width: 136,
                            child: Slider(
                              min: caps.minMb.toDouble(),
                              max: caps.maxMb.toDouble(),
                              activeColor: WavelengthColors.emerald,
                              value: gainMb.toDouble().clamp(
                                  caps.minMb.toDouble(),
                                  caps.maxMb.toDouble()),
                              onChanged: (val) =>
                                  handler.setEqBand(i, val.round()),
                            ),
                          ),
                        ),
                        Text(hzLabel,
                            style: const TextStyle(
                                fontSize: 11, fontWeight: FontWeight.w700)),
                      ],
                    );
                  }),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const SizedBox(width: 84, child: Text('Bass Boost')),
                  Expanded(
                    child: Slider(
                      min: 0,
                      max: 1000,
                      activeColor: WavelengthColors.emerald,
                      value: handler.bassStrength.toDouble(),
                      onChanged: (v) => handler.setBassBoostStrength(v.round()),
                    ),
                  ),
                ],
              ),
            ],
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Gapless & Crossfade',
                    style: TextStyle(fontWeight: FontWeight.w700)),
                Text('${handler.crossfadeSeconds}s',
                    style: const TextStyle(
                        color: WavelengthColors.emerald,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w700)),
              ],
            ),
            Slider(
              min: 0,
              max: 12,
              divisions: 12,
              activeColor: WavelengthColors.emerald,
              value: handler.crossfadeSeconds.toDouble(),
              onChanged: (v) => handler.setCrossfadeSeconds(v.round()),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Normalize Volume'),
              subtitle: const Text('Consistent volume across masters'),
              value: handler.normalizeAudio,
              activeTrackColor: WavelengthColors.emerald,
              onChanged: (v) => handler.setNormalizeAudio(v),
            ),
            const SizedBox(height: 8),
            const Text('Playback Speed',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [0.75, 1.0, 1.15, 1.25, 1.5, 2.0].map((s) {
                final selected = (handler.speed - s).abs() < 0.02;
                return ChoiceChip(
                  label: Text('${s}x'),
                  selected: selected,
                  selectedColor: WavelengthColors.emerald,
                  labelStyle: TextStyle(
                    color: selected ? Colors.black : Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                  onSelected: (_) => handler.setSpeed(s),
                );
              }).toList(),
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
