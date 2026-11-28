import 'dart:async';

enum HeadsetAction { togglePlayPause, nextTrack, previousTrack }

/// Interprets repeated headset/earphone single-button taps:
/// 1 press = play/pause, 2 presses = next, 3 presses = previous.
class HeadsetClickDetector {
  HeadsetClickDetector({
    required this.onAction,
    this.clickWindow = const Duration(milliseconds: 340),
  });

  final void Function(HeadsetAction action) onAction;
  final Duration clickWindow;

  int _clickCount = 0;
  Timer? _timer;

  void registerMediaClick() {
    _timer?.cancel();
    _clickCount++;
    if (_clickCount >= 3) {
      _clickCount = 0;
      onAction(HeadsetAction.previousTrack);
      return;
    }
    _timer = Timer(clickWindow, _flush);
  }

  void _flush() {
    final count = _clickCount;
    _clickCount = 0;
    if (count == 1) {
      onAction(HeadsetAction.togglePlayPause);
    } else if (count == 2) {
      onAction(HeadsetAction.nextTrack);
    } else if (count >= 3) {
      onAction(HeadsetAction.previousTrack);
    }
  }

  void dispose() {
    _timer?.cancel();
    _clickCount = 0;
  }
}
