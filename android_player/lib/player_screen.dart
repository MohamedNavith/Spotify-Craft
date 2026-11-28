import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

import 'playback.dart';

class PlayerScreen extends StatelessWidget {
  const PlayerScreen({
    super.key,
    required this.player,
    required this.onAdd,
    required this.onQueue,
  });
  final Playback player;
  final void Function(MediaItem) onAdd;
  final VoidCallback onQueue;
  String time(Duration d) =>
      '${d.inMinutes}:${(d.inSeconds % 60).toString().padLeft(2, '0')}';
  @override
  Widget build(BuildContext context) => StreamBuilder<MediaItem?>(
    stream: player.mediaItem,
    initialData: player.mediaItem.value,
    builder: (context, s) {
      final t = s.data;
      return Scaffold(
        appBar: AppBar(
          title: const Text('Now playing'),
          actions: [
            IconButton(
              tooltip: 'Queue',
              onPressed: onQueue,
              icon: const Icon(Icons.queue_music),
            ),
          ],
        ),
        body: t == null
            ? const Center(child: Text('Choose a song to play'))
            : SafeArea(
                child: ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    AspectRatio(
                      aspectRatio: 1,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: t.artUri == null
                            ? const Icon(Icons.album, size: 90)
                            : Image.network(
                                t.artUri.toString(),
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) =>
                                    const Icon(Icons.album, size: 90),
                              ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        t.title,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      subtitle: Text(t.artist ?? ''),
                      trailing: IconButton(
                        tooltip: 'Add to playlist',
                        onPressed: () => onAdd(t),
                        icon: const Icon(Icons.playlist_add),
                      ),
                    ),
                    StreamBuilder<Duration>(
                      stream: player.engine.positionStream,
                      builder: (context, s) {
                        final p = s.data ?? Duration.zero;
                        final total = player.engine.duration ?? Duration.zero;
                        return Column(
                          children: [
                            Slider(
                              value: p.inMilliseconds
                                  .clamp(0, total.inMilliseconds)
                                  .toDouble(),
                              max: total.inMilliseconds > 0
                                  ? total.inMilliseconds.toDouble()
                                  : 1,
                              onChanged: total.inMilliseconds > 0
                                  ? (v) => player.seek(
                                      Duration(milliseconds: v.round()),
                                    )
                                  : null,
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [Text(time(p)), Text(time(total))],
                            ),
                          ],
                        );
                      },
                    ),
                    StreamBuilder<PlaybackState>(
                      stream: player.playbackState,
                      builder: (c, s) => Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          StreamBuilder<bool>(
                            stream: player.engine.shuffleModeEnabledStream,
                            builder: (c, s) => IconButton(
                              tooltip: 'Shuffle',
                              isSelected: s.data ?? false,
                              onPressed: () =>
                                  player.engine.setShuffleModeEnabled(
                                    !player.engine.shuffleModeEnabled,
                                  ),
                              icon: const Icon(Icons.shuffle),
                            ),
                          ),
                          IconButton(
                            tooltip: 'Previous',
                            onPressed: player.skipToPrevious,
                            icon: const Icon(Icons.skip_previous),
                          ),
                          IconButton.filled(
                            tooltip: s.data?.playing == true ? 'Pause' : 'Play',
                            onPressed: s.data?.playing == true
                                ? player.pause
                                : player.play,
                            icon: Icon(
                              s.data?.playing == true
                                  ? Icons.pause
                                  : Icons.play_arrow,
                            ),
                          ),
                          IconButton(
                            tooltip: 'Next',
                            onPressed: player.skipToNext,
                            icon: const Icon(Icons.skip_next),
                          ),
                          StreamBuilder<LoopMode>(
                            stream: player.engine.loopModeStream,
                            builder: (c, s) {
                              final m = s.data ?? LoopMode.off;
                              return IconButton(
                                tooltip: 'Repeat: ${m.name}',
                                isSelected: m != LoopMode.off,
                                onPressed: () =>
                                    player.engine.setLoopMode(switch (m) {
                                      LoopMode.off => LoopMode.all,
                                      LoopMode.all => LoopMode.one,
                                      _ => LoopMode.off,
                                    }),
                                icon: Icon(
                                  m == LoopMode.one
                                      ? Icons.repeat_one
                                      : Icons.repeat,
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    if (t.id.startsWith('official:'))
                      const Center(child: Text('Catalog preview')),
                  ],
                ),
              ),
      );
    },
  );
}
