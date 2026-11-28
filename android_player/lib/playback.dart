import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:audio_session/audio_session.dart';
import 'package:just_audio/just_audio.dart';

class Playback extends BaseAudioHandler with QueueHandler, SeekHandler {
  final engine = AudioPlayer();
  Future<void> initialize() async {
    final session = await AudioSession.instance;
    await session.configure(AudioSessionConfiguration.music());
    engine.playbackEventStream.listen(
      (event) => broadcast(),
      onError: (Object e) {
        playbackState.add(
          playbackState.value.copyWith(
            processingState: AudioProcessingState.error,
            errorMessage: 'This recording is unavailable.',
          ),
        );
      },
    );
    engine.currentIndexStream.listen((i) {
      if (i != null && i < queue.value.length) mediaItem.add(queue.value[i]);
    });
  }

  void broadcast() {
    playbackState.add(
      playbackState.value.copyWith(
        controls: [
          MediaControl.skipToPrevious,
          engine.playing ? MediaControl.pause : MediaControl.play,
          MediaControl.skipToNext,
          MediaControl.stop,
        ],
        systemActions: {
          MediaAction.seek,
          MediaAction.seekBackward,
          MediaAction.seekForward,
        },
        androidCompactActionIndices: [0, 1, 2],
        processingState:
            AudioProcessingState.values[engine.processingState.index],
        playing: engine.playing,
        updatePosition: engine.position,
        bufferedPosition: engine.bufferedPosition,
        speed: engine.speed,
        queueIndex: engine.currentIndex,
      ),
    );
  }

  Future<void> select(List<MediaItem> items, int start) async {
    queue.add(items);
    mediaItem.add(items[start]);
    await engine.setAudioSources([
      for (final item in items)
        AudioSource.uri(Uri.parse(item.extras!['url'] as String), tag: item),
    ], initialIndex: start);
    await play();
  }

  @override
  Future<void> play() => engine.play();
  @override
  Future<void> pause() => engine.pause();
  @override
  Future<void> seek(Duration position) => engine.seek(position);
  @override
  Future<void> skipToNext() => engine.seekToNext();
  @override
  Future<void> skipToPrevious() => engine.position.inSeconds > 3
      ? seek(Duration.zero)
      : engine.seekToPrevious();
  @override
  Future<void> stop() async {
    await engine.stop();
    await super.stop();
  }
}
