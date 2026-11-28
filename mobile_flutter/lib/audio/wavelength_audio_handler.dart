import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'package:audio_service/audio_service.dart';
import 'package:audio_session/audio_session.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/database.dart';
import '../core/models.dart';
import '../data/catalog_service.dart';
import '../data/curated_catalog.dart';
import '../data/master_audio_resolver.dart';
import '../platform/native_bridge.dart';
import 'headset_click_detector.dart';

class EqPreset {
  const EqPreset(this.name, this.bandGainsMb, {this.bassBoost = 0});
  final String name;
  final List<int> bandGainsMb; // Normalized 5-band targets in millibels
  final int bassBoost;
}

abstract final class EqPresets {
  static const List<EqPreset> all = [
    EqPreset('Flat', [0, 0, 0, 0, 0]),
    EqPreset('Bass Boost', [650, 420, 0, -100, 120], bassBoost: 520),
    EqPreset('Vocal Clarity', [-200, 50, 380, 480, 220]),
    EqPreset('Electronic / EDM', [550, 250, -150, 320, 500], bassBoost: 360),
    EqPreset('Acoustic & Folk', [220, 160, 120, 280, 320]),
    EqPreset('Rock', [450, 220, -180, 260, 420], bassBoost: 240),
    EqPreset('Studio Hi-Res', [120, 60, 0, 80, 180]),
  ];
}

class WavelengthAudioHandler extends BaseAudioHandler
    with QueueHandler, SeekHandler {
  WavelengthAudioHandler._(
    this._db,
    this._prefs,
    this._resolver,
  ) {
    _clickDetector = HeadsetClickDetector(onAction: _handleHeadsetAction);
  }

  static const String _prefQueue = 'wl_queue_json';
  static const String _prefIndex = 'wl_queue_index';
  static const String _prefPosMs = 'wl_last_pos_ms';
  static const String _prefQuality = 'wl_stream_quality';
  static const String _prefShuffle = 'wl_shuffle';
  static const String _prefRepeat = 'wl_repeat';
  static const String _prefSpeed = 'wl_speed';
  static const String _prefNormalize = 'wl_normalize';
  static const String _prefAutoplay = 'wl_autoplay';
  static const String _prefAutoResumeBt = 'wl_auto_resume_bt';
  static const String _prefGapless = 'wl_gapless';
  static const String _prefCustomBackend = 'wl_custom_backend';

  final WavelengthDatabase _db;
  final SharedPreferences _prefs;
  final MasterAudioResolver _resolver;
  final AudioPlayer _player = AudioPlayer();
  late final HeadsetClickDetector _clickDetector;
  final math.Random _rng = math.Random();

  final StreamController<String> _toastController =
      StreamController<String>.broadcast();
  Stream<String> get toastStream => _toastController.stream;

  final StreamController<void> _stateChangeController =
      StreamController<void>.broadcast();
  Stream<void> get engineChanges => _stateChangeController.stream;

  List<WavelengthTrack> _tracks = [];
  List<int> _playOrder = [];
  int _orderCursor = 0;

  bool _shuffle = false;
  RepeatModeSetting _repeatMode = RepeatModeSetting.off;
  StreamQuality _quality = StreamQuality.hiResLossless;
  double _speed = 1.0;
  double _volume = 1.0;
  bool _normalizeAudio = true;
  bool _autoplayRadio = true;
  bool _autoResumeOnReconnect = false;
  bool _gaplessEnabled = true;

  bool _manuallyPaused = true;
  bool _pausedByAudioFocus = false;
  bool _pausedByNoisy = false;
  int _loadGeneration = 0;
  int _consecutiveFailures = 0;
  bool _resolvingTrack = false;
  String? _statusMessage;
  AudioStreamDetails? _currentStreamDetails;
  AudioOutputDeviceInfo _outputDevice = const AudioOutputDeviceInfo(
    route: 'speaker',
    name: 'Phone Speaker',
  );
  EqualizerCapabilities _eqCaps =
      const EqualizerCapabilities(initialized: false);
  bool _eqEnabled = false;
  String _activePresetName = 'Flat';
  List<int> _eqBandGainsMb = [0, 0, 0, 0, 0];
  int _bassStrength = 0;

  Set<String> _likedIds = {};
  DateTime? _sleepTimerEndsAt;
  bool _sleepEndOfTrack = false;
  Timer? _sleepTimer;
  Timer? _savePosTimer;
  final Map<String, String> _artFileCache = {};
  String? _fallbackArtPath;
  bool _androidAutoInitialized = false;

  // Exposed state getters
  List<WavelengthTrack> get tracks => List.unmodifiable(_tracks);
  WavelengthTrack? get currentTrack =>
      (_playOrder.isNotEmpty && _orderCursor >= 0 && _orderCursor < _playOrder.length)
          ? _tracks[_playOrder[_orderCursor]]
          : null;
  int get currentOriginalIndex =>
      (_playOrder.isNotEmpty && _orderCursor >= 0 && _orderCursor < _playOrder.length)
          ? _playOrder[_orderCursor]
          : -1;
  bool get shuffleEnabled => _shuffle;
  RepeatModeSetting get repeatMode => _repeatMode;
  StreamQuality get quality => _quality;
  double get speed => _speed;
  double get volume => _volume;
  bool get normalizeAudio => _normalizeAudio;
  bool get autoplayRadio => _autoplayRadio;
  bool get autoResumeOnReconnect => _autoResumeOnReconnect;
  bool get gaplessEnabled => _gaplessEnabled;
  bool get isResolving => _resolvingTrack;
  String? get statusMessage => _statusMessage;
  AudioStreamDetails? get currentStreamDetails => _currentStreamDetails;
  AudioOutputDeviceInfo get outputDevice => _outputDevice;
  EqualizerCapabilities get eqCapabilities => _eqCaps;
  bool get eqEnabled => _eqEnabled;
  String get activePresetName => _activePresetName;
  List<int> get eqBandGainsMb => List.unmodifiable(_eqBandGainsMb);
  int get bassStrength => _bassStrength;
  DateTime? get sleepTimerEndsAt => _sleepTimerEndsAt;
  bool get sleepEndOfTrack => _sleepEndOfTrack;
  Duration get position => _player.position;
  Duration get duration => _player.duration ?? Duration(milliseconds: currentTrack?.durationMs ?? 0);
  Stream<Duration> get positionStream => _player.positionStream;
  Stream<Duration?> get durationStream => _player.durationStream;
  Stream<PlayerState> get playerStateStream => _player.playerStateStream;
  bool get isPlaying => _player.playing;

  bool _initialized = false;

  static WavelengthAudioHandler syncInstance(
    WavelengthDatabase db,
    SharedPreferences prefs,
  ) {
    final backendUrl = prefs.getString(_prefCustomBackend);
    final resolver = MasterAudioResolver(db: db, customBackendUrl: backendUrl);
    return WavelengthAudioHandler._(db, prefs, resolver);
  }

  Future<void> ensureReady() async {
    if (_initialized) return;
    _initialized = true;
    await _initialize();
  }

  static Future<WavelengthAudioHandler> create(
    WavelengthDatabase db,
    SharedPreferences prefs,
  ) async {
    final handler = syncInstance(db, prefs);
    await handler.ensureReady();
    return handler;
  }

  Future<void> _initialize() async {
    await _prepareFallbackArtwork();
    _likedIds = await _db.getLikedIds();

    _quality = StreamQuality.fromKey(_prefs.getString(_prefQuality));
    _shuffle = _prefs.getBool(_prefShuffle) ?? false;
    final repIdx = _prefs.getInt(_prefRepeat) ?? 0;
    _repeatMode =
        RepeatModeSetting.values[repIdx.clamp(0, RepeatModeSetting.values.length - 1)];
    _speed = _prefs.getDouble(_prefSpeed) ?? 1.0;
    _normalizeAudio = _prefs.getBool(_prefNormalize) ?? true;
    _autoplayRadio = _prefs.getBool(_prefAutoplay) ?? true;
    _autoResumeOnReconnect = _prefs.getBool(_prefAutoResumeBt) ?? false;
    _gaplessEnabled = _prefs.getBool(_prefGapless) ?? true;

    _outputDevice = await NativeBridge.getAudioOutputDevice();
    NativeBridge.audioDeviceStream.listen((device) {
      final wasSpeaker = _outputDevice.route == 'speaker';
      final isAccessory = device.route != 'speaker';
      _outputDevice = device;
      _emitChange();
      if (_autoResumeOnReconnect &&
          wasSpeaker &&
          isAccessory &&
          _pausedByNoisy &&
          !_manuallyPaused &&
          currentTrack != null) {
        _pausedByNoisy = false;
        play();
      }
    });

    final session = await AudioSession.instance;
    await session.configure(const AudioSessionConfiguration.music());
    session.interruptionEventStream.listen(_handleInterruption);
    session.becomingNoisyEventStream.listen((_) {
      if (_player.playing) {
        _pausedByNoisy = true;
        _player.pause();
        _toastController.add('Paused because headphones disconnected');
        _syncPlaybackState();
      }
    });

    _player.playbackEventStream.listen((_) => _syncPlaybackState());
    _player.playerStateStream.listen((st) {
      _syncPlaybackState();
      if (st.processingState == ProcessingState.completed) {
        unawaited(_handleTrackCompleted());
      }
    });
    _player.androidAudioSessionIdStream.listen((sessionId) async {
      if (sessionId != null && sessionId > 0) {
        _eqCaps = await NativeBridge.initAudioEffects(sessionId);
        if (_eqCaps.initialized) {
          _eqBandGainsMb = List<int>.filled(_eqCaps.bandCount, 0);
          await NativeBridge.setLoudnessGain(_normalizeAudio ? 350 : 0);
        }
        _emitChange();
      }
    });

    await _restorePersistedSession();
  }

  Future<void> _prepareFallbackArtwork() async {
    try {
      final cacheDir = await getTemporaryDirectory();
      final artDir = Directory(p.join(cacheDir.path, 'wavelength_art'));
      if (!await artDir.exists()) await artDir.create(recursive: true);
      final file = File(p.join(artDir.path, 'fallback.png'));
      if (!await file.exists()) {
        final data = await rootBundle.load('assets/wavelength-icon.png');
        await file.writeAsBytes(data.buffer.asUint8List());
      }
      _fallbackArtPath = file.path;
    } catch (_) {}
  }

  Future<String?> _ensureLocalArtFile(WavelengthTrack track) async {
    if (track.artworkUrl.isEmpty) return _fallbackArtPath;
    final cached = _artFileCache[track.artworkUrl];
    if (cached != null && await File(cached).exists()) return cached;

    try {
      final cacheDir = await getTemporaryDirectory();
      final artDir = Directory(p.join(cacheDir.path, 'wavelength_art'));
      if (!await artDir.exists()) await artDir.create(recursive: true);
      final safeName = '${track.artworkUrl.hashCode}.jpg';
      final file = File(p.join(artDir.path, safeName));
      if (await file.exists()) {
        _artFileCache[track.artworkUrl] = file.path;
        return file.path;
      }
      final resp = await http
          .get(Uri.parse(track.artworkUrl))
          .timeout(const Duration(seconds: 5));
      if (resp.statusCode == 200 && resp.bodyBytes.isNotEmpty) {
        await file.writeAsBytes(resp.bodyBytes);
        _artFileCache[track.artworkUrl] = file.path;
        return file.path;
      }
    } catch (_) {}
    return _fallbackArtPath;
  }

  MediaItem _toMediaItem(WavelengthTrack track, {String? localArtPath}) {
    final art = localArtPath ?? _artFileCache[track.artworkUrl] ?? _fallbackArtPath;
    return MediaItem(
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.durationMs > 0
          ? Duration(milliseconds: track.durationMs)
          : null,
      artUri: art != null
          ? Uri.file(art)
          : (track.artworkUrl.isNotEmpty ? Uri.parse(track.artworkUrl) : null),
    );
  }

  Future<void> _restorePersistedSession() async {
    final raw = _prefs.getString(_prefQueue);
    if (raw == null || raw.isEmpty) return;
    try {
      final decoded = (jsonDecode(raw) as List<dynamic>)
          .whereType<Map<String, dynamic>>()
          .map(WavelengthTrack.fromJson)
          .toList();
      if (decoded.isEmpty) return;
      _tracks = decoded;
      final savedIndex =
          (_prefs.getInt(_prefIndex) ?? 0).clamp(0, _tracks.length - 1);
      final savedPosMs = _prefs.getInt(_prefPosMs) ?? 0;
      _rebuildPlayOrder(anchorOriginalIndex: savedIndex);
      await _publishQueueAndCurrentMedia();
      // Do not auto-play unexpectedly on launch; load silently and ready to resume!
      if (currentTrack != null) {
        await _loadTrackAtCursor(
          autoPlay: false,
          initialPosition: Duration(milliseconds: savedPosMs),
        );
      }
    } catch (_) {}
  }

  void _rebuildPlayOrder({required int anchorOriginalIndex}) {
    final indices = List<int>.generate(_tracks.length, (i) => i);
    if (_tracks.isEmpty) {
      _playOrder = [];
      _orderCursor = 0;
      return;
    }
    if (_shuffle && _tracks.length > 1) {
      final remaining = indices.where((i) => i != anchorOriginalIndex).toList()
        ..shuffle(_rng);
      _playOrder = [anchorOriginalIndex, ...remaining];
      _orderCursor = 0;
    } else {
      _playOrder = indices;
      _orderCursor = anchorOriginalIndex.clamp(0, _playOrder.length - 1);
    }
  }

  Future<void> _publishQueueAndCurrentMedia() async {
    queue.add(_playOrder.map((i) => _toMediaItem(_tracks[i])).toList());
    final t = currentTrack;
    if (t == null) {
      mediaItem.add(null);
      await NativeBridge.updateWidgetState(
        title: 'Wavelength',
        artist: 'Tap to listen',
        isPlaying: false,
      );
      return;
    }
    mediaItem.add(_toMediaItem(t));
    final artPath = await _ensureLocalArtFile(t);
    if (currentTrack?.id == t.id) {
      mediaItem.add(_toMediaItem(t, localArtPath: artPath));
      await NativeBridge.updateWidgetState(
        title: t.title,
        artist: t.artist,
        isPlaying: _player.playing,
        artPath: artPath,
      );
    }
  }

  Future<void> playTracks(
    List<WavelengthTrack> queueTracks, {
    int startIndex = 0,
  }) async {
    if (queueTracks.isEmpty) return;
    _tracks = List<WavelengthTrack>.from(queueTracks);
    final anchor = startIndex.clamp(0, _tracks.length - 1);
    _rebuildPlayOrder(anchorOriginalIndex: anchor);
    _consecutiveFailures = 0;
    _manuallyPaused = false;
    await _saveQueuePrefs();
    await _loadTrackAtCursor(autoPlay: true);
  }

  Future<void> _loadTrackAtCursor({
    required bool autoPlay,
    Duration? initialPosition,
  }) async {
    final t = currentTrack;
    if (t == null) return;
    final gen = ++_loadGeneration;
    _resolvingTrack = true;
    _statusMessage = 'Resolving ${_quality.shortBadge} stream...';
    _emitChange();

    await _publishQueueAndCurrentMedia();

    try {
      final resolved = await _resolver.resolve(
        t,
        _quality,
        outputDevice: _outputDevice,
      );
      if (gen != _loadGeneration) return; // Stale request canceled cleanly

      _currentStreamDetails = resolved.details;
      _statusMessage = resolved.isPreview
          ? 'Playing 30s official preview (full stream unavailable)'
          : null;

      await _player.setAudioSource(
        AudioSource.uri(
          Uri.parse(resolved.uri),
          tag: _toMediaItem(t),
        ),
        initialPosition: initialPosition ?? Duration.zero,
      );
      if (gen != _loadGeneration) return;

      await _player.setSpeed(_speed);
      await _player.setVolume(_volume);
      _consecutiveFailures = 0;
      _resolvingTrack = false;
      _emitChange();

      if (autoPlay) {
        final session = await AudioSession.instance;
        await session.setActive(true);
        _manuallyPaused = false;
        _pausedByAudioFocus = false;
        _pausedByNoisy = false;
        unawaited(_db.recordHistory(t));
        unawaited(_player.play());
        unawaited(_syncWidgetNow());
      } else {
        _syncPlaybackState();
      }
      _startPositionPersistenceTimer();
    } catch (e) {
      if (gen != _loadGeneration) return;
      _resolvingTrack = false;
      _consecutiveFailures++;
      _statusMessage = 'Stream failed for "${t.title}"';
      _emitChange();
      if (_consecutiveFailures < math.min(_tracks.length, 4) && _tracks.length > 1) {
        _toastController.add('Skipped unplayable track "${t.title}"');
        await skipToNext();
      } else {
        _toastController.add('Could not play "${t.title}"');
        _syncPlaybackState();
      }
    }
  }

  void _startPositionPersistenceTimer() {
    _savePosTimer?.cancel();
    _savePosTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (_tracks.isNotEmpty) {
        _prefs.setInt(_prefPosMs, _player.position.inMilliseconds);
        _prefs.setInt(_prefIndex, currentOriginalIndex);
      }
    });
  }

  Future<void> _saveQueuePrefs() async {
    final trimmed = _tracks.take(60).toList();
    await _prefs.setString(
      _prefQueue,
      jsonEncode(trimmed.map((t) => t.toJson()).toList()),
    );
    await _prefs.setInt(_prefIndex, currentOriginalIndex);
  }

  Future<void> _syncWidgetNow() async {
    final t = currentTrack;
    if (t == null) return;
    final art = _artFileCache[t.artworkUrl] ?? _fallbackArtPath;
    await NativeBridge.updateWidgetState(
      title: t.title,
      artist: t.artist,
      isPlaying: _player.playing,
      artPath: art,
    );
  }

  void _handleInterruption(AudioInterruptionEvent event) {
    if (event.begin) {
      switch (event.type) {
        case AudioInterruptionType.duck:
          _player.setVolume((_volume * 0.25).clamp(0.1, 1.0));
          break;
        case AudioInterruptionType.pause:
        case AudioInterruptionType.unknown:
          if (_player.playing) {
            _pausedByAudioFocus = !_manuallyPaused;
            _player.pause();
            _syncPlaybackState();
          }
          break;
      }
    } else {
      switch (event.type) {
        case AudioInterruptionType.duck:
          _player.setVolume(_volume);
          break;
        case AudioInterruptionType.pause:
          if (_pausedByAudioFocus && !_manuallyPaused) {
            _pausedByAudioFocus = false;
            play();
          }
          break;
        case AudioInterruptionType.unknown:
          _pausedByAudioFocus = false;
          break;
      }
    }
  }

  void _handleHeadsetAction(HeadsetAction action) {
    switch (action) {
      case HeadsetAction.togglePlayPause:
        if (_player.playing) {
          pause();
        } else {
          play();
        }
        break;
      case HeadsetAction.nextTrack:
        skipToNext();
        break;
      case HeadsetAction.previousTrack:
        skipToPrevious();
        break;
    }
  }

  @override
  Future<void> click([MediaButton button = MediaButton.media]) async {
    switch (button) {
      case MediaButton.media:
        _clickDetector.registerMediaClick();
        break;
      case MediaButton.next:
        await skipToNext();
        break;
      case MediaButton.previous:
        await skipToPrevious();
        break;
    }
  }

  @override
  Future<void> play() async {
    if (currentTrack == null) {
      if (CuratedCatalog.todayTopHits.isNotEmpty) {
        await playTracks(CuratedCatalog.todayTopHits);
      }
      return;
    }
    _manuallyPaused = false;
    _pausedByAudioFocus = false;
    _pausedByNoisy = false;
    final session = await AudioSession.instance;
    await session.setActive(true);
    if (_player.processingState == ProcessingState.idle) {
      await _loadTrackAtCursor(autoPlay: true);
    } else {
      await _player.play();
    }
    unawaited(_syncWidgetNow());
    _emitChange();
  }

  @override
  Future<void> pause() async {
    _manuallyPaused = true;
    _pausedByAudioFocus = false;
    await _player.pause();
    await _prefs.setInt(_prefPosMs, _player.position.inMilliseconds);
    unawaited(_syncWidgetNow());
    _syncPlaybackState();
    _emitChange();
  }

  @override
  Future<void> stop() async {
    _manuallyPaused = true;
    _loadGeneration++;
    await _player.stop();
    await _prefs.setInt(_prefPosMs, 0);
    await NativeBridge.updateWidgetState(
      title: currentTrack?.title ?? 'Wavelength',
      artist: 'Paused',
      isPlaying: false,
      artPath: _artFileCache[currentTrack?.artworkUrl ?? ''] ?? _fallbackArtPath,
    );
    await super.stop();
    _emitChange();
  }

  @override
  Future<void> onNotificationDeleted() async {
    await stop();
  }

  @override
  Future<void> seek(Duration position) async {
    await _player.seek(position);
    _syncPlaybackState();
  }

  @override
  Future<void> skipToNext() async {
    if (_playOrder.isEmpty) return;
    if (_orderCursor + 1 < _playOrder.length) {
      _orderCursor++;
      await _loadTrackAtCursor(autoPlay: true);
      return;
    }
    if (_repeatMode == RepeatModeSetting.all) {
      if (_shuffle && _tracks.length > 1) {
        final anchor = _playOrder[_orderCursor];
        _rebuildPlayOrder(anchorOriginalIndex: anchor);
        if (_playOrder.length > 1) {
          // Move old anchor to end so next cycle feels fresh
          final first = _playOrder.removeAt(0);
          _playOrder.add(first);
        }
      }
      _orderCursor = 0;
      await _loadTrackAtCursor(autoPlay: true);
      return;
    }
    if (_autoplayRadio && currentTrack != null) {
      final radioTracks =
          await CatalogService(db: _db).buildSongRadio(currentTrack!, localPool: CuratedCatalog.allTracks);
      if (radioTracks.isNotEmpty) {
        final nextStart = _tracks.length;
        _tracks.addAll(radioTracks);
        for (var i = nextStart; i < _tracks.length; i++) {
          _playOrder.add(i);
        }
        _orderCursor = nextStart;
        _toastController.add('Autoplay Radio: Continuing similar tracks');
        await _loadTrackAtCursor(autoPlay: true);
        return;
      }
    }
    await pause();
  }

  @override
  Future<void> skipToPrevious() async {
    if (_playOrder.isEmpty) return;
    if (_player.position > const Duration(seconds: 3)) {
      await seek(Duration.zero);
      return;
    }
    if (_orderCursor > 0) {
      _orderCursor--;
      await _loadTrackAtCursor(autoPlay: true);
    } else if (_repeatMode == RepeatModeSetting.all) {
      _orderCursor = _playOrder.length - 1;
      await _loadTrackAtCursor(autoPlay: true);
    } else {
      await seek(Duration.zero);
    }
  }

  @override
  Future<void> skipToQueueItem(int index) async {
    if (index < 0 || index >= _playOrder.length) return;
    _orderCursor = index;
    await _loadTrackAtCursor(autoPlay: true);
  }

  Future<void> _handleTrackCompleted() async {
    if (_sleepEndOfTrack) {
      _sleepEndOfTrack = false;
      _sleepTimerEndsAt = null;
      await pause();
      _toastController.add('Sleep timer stopped playback at end of track');
      _emitChange();
      return;
    }
    if (_repeatMode == RepeatModeSetting.one) {
      await seek(Duration.zero);
      await play();
      return;
    }
    await skipToNext();
  }

  @override
  Future<void> customAction(String name, [Map<String, dynamic>? extras]) async {
    if (name == 'toggle_like') {
      final t = currentTrack;
      if (t != null) {
        await toggleLikeTrack(t);
      }
    }
  }

  Future<bool> toggleLikeTrack(WavelengthTrack track) async {
    final liked = await _db.toggleLike(track);
    if (liked) {
      _likedIds.add(track.id);
    } else {
      _likedIds.remove(track.id);
    }
    _syncPlaybackState();
    _emitChange();
    return liked;
  }

  bool isTrackLiked(String trackId) => _likedIds.contains(trackId);
  Set<String> get likedIds => Set.unmodifiable(_likedIds);

  Future<void> toggleShuffle() async {
    _shuffle = !_shuffle;
    await _prefs.setBool(_prefShuffle, _shuffle);
    final currIdx = currentOriginalIndex;
    if (currIdx >= 0) {
      _rebuildPlayOrder(anchorOriginalIndex: currIdx);
    }
    await _publishQueueAndCurrentMedia();
    _syncPlaybackState();
    _emitChange();
  }

  Future<void> cycleRepeatMode() async {
    final nextIdx = (_repeatMode.index + 1) % RepeatModeSetting.values.length;
    _repeatMode = RepeatModeSetting.values[nextIdx];
    await _prefs.setInt(_prefRepeat, _repeatMode.index);
    _syncPlaybackState();
    _emitChange();
  }

  Future<void> setStreamQuality(StreamQuality newQuality) async {
    _quality = newQuality;
    await _prefs.setString(_prefQuality, newQuality.apiKey);
    _emitChange();
    final t = currentTrack;
    if (t != null) {
      final pos = _player.position;
      final wasPlaying = _player.playing;
      await _loadTrackAtCursor(autoPlay: wasPlaying, initialPosition: pos);
    }
  }

  @override
  Future<void> setSpeed(double speed) async {
    _speed = speed.clamp(0.5, 2.0);
    await _prefs.setDouble(_prefSpeed, _speed);
    await _player.setSpeed(_speed);
    _syncPlaybackState();
    _emitChange();
  }

  Future<void> setVolumeLevel(double v) async {
    _volume = v.clamp(0.0, 1.0);
    await _player.setVolume(_volume);
    _emitChange();
  }

  Future<void> setNormalizeAudio(bool enabled) async {
    _normalizeAudio = enabled;
    await _prefs.setBool(_prefNormalize, enabled);
    await NativeBridge.setLoudnessGain(enabled ? 350 : 0);
    _emitChange();
  }

  Future<void> setAutoplayRadio(bool enabled) async {
    _autoplayRadio = enabled;
    await _prefs.setBool(_prefAutoplay, enabled);
    _emitChange();
  }

  Future<void> setAutoResumeOnReconnect(bool enabled) async {
    _autoResumeOnReconnect = enabled;
    await _prefs.setBool(_prefAutoResumeBt, enabled);
    _emitChange();
  }

  Future<void> setGaplessEnabled(bool enabled) async {
    _gaplessEnabled = enabled;
    await _prefs.setBool(_prefGapless, enabled);
    _emitChange();
  }

  Future<void> setCustomBackendUrl(String? url) async {
    final clean = url?.trim() ?? '';
    _resolver.customBackendUrl = clean.isEmpty ? null : clean;
    await _prefs.setString(_prefCustomBackend, clean);
    _emitChange();
  }

  String get customBackendUrl => _prefs.getString(_prefCustomBackend) ?? '';

  // Equalizer controls
  Future<void> setEqEnabled(bool enabled) async {
    _eqEnabled = enabled;
    await NativeBridge.setEqualizerEnabled(enabled);
    _emitChange();
  }

  Future<void> applyEqPreset(EqPreset preset) async {
    _eqEnabled = true;
    _activePresetName = preset.name;
    await NativeBridge.setEqualizerEnabled(true);
    final targetBands = List<int>.generate(_eqCaps.bandCount, (i) {
      final srcIdx =
          (i * (preset.bandGainsMb.length - 1) / math.max(1, _eqCaps.bandCount - 1))
              .round()
              .clamp(0, preset.bandGainsMb.length - 1);
      return preset.bandGainsMb[srcIdx];
    });
    _eqBandGainsMb = targetBands;
    for (var i = 0; i < targetBands.length; i++) {
      await NativeBridge.setEqualizerBand(i, targetBands[i]);
    }
    _bassStrength = preset.bassBoost;
    await NativeBridge.setBassBoost(_bassStrength);
    _emitChange();
  }

  Future<void> setEqBand(int bandIndex, int gainMb) async {
    if (bandIndex < 0 || bandIndex >= _eqBandGainsMb.length) return;
    _eqEnabled = true;
    _activePresetName = 'Custom';
    await NativeBridge.setEqualizerEnabled(true);
    _eqBandGainsMb[bandIndex] = gainMb;
    await NativeBridge.setEqualizerBand(bandIndex, gainMb);
    _emitChange();
  }

  Future<void> setBassBoostStrength(int strength) async {
    _bassStrength = strength.clamp(0, 1000);
    _activePresetName = 'Custom';
    await NativeBridge.setBassBoost(_bassStrength);
    _emitChange();
  }

  // Queue operations
  void addToQueue(WavelengthTrack track) {
    if (_tracks.isEmpty) {
      unawaited(playTracks([track]));
      return;
    }
    _tracks.add(track);
    _playOrder.add(_tracks.length - 1);
    _publishQueueAndCurrentMedia();
    _emitChange();
  }

  void playNext(WavelengthTrack track) {
    if (_tracks.isEmpty) {
      unawaited(playTracks([track]));
      return;
    }
    _tracks.add(track);
    final insertAt = math.min(_orderCursor + 1, _playOrder.length);
    _playOrder.insert(insertAt, _tracks.length - 1);
    _publishQueueAndCurrentMedia();
    _emitChange();
  }

  @override
  Future<void> removeQueueItemAt(int index) async {
    if (index < 0 || index >= _playOrder.length) return;
    if (index == _orderCursor) return; // Keep current track playing safely
    _playOrder.removeAt(index);
    if (index < _orderCursor) _orderCursor--;
    await _publishQueueAndCurrentMedia();
    _emitChange();
  }

  void reorderQueueItem(int oldIndex, int newIndex) {
    if (oldIndex < 0 || oldIndex >= _playOrder.length) return;
    if (newIndex > oldIndex) newIndex--;
    if (newIndex < 0 || newIndex >= _playOrder.length) return;
    final currentOriginal = _playOrder[_orderCursor];
    final moved = _playOrder.removeAt(oldIndex);
    _playOrder.insert(newIndex, moved);
    _orderCursor = _playOrder.indexOf(currentOriginal);
    _publishQueueAndCurrentMedia();
    _emitChange();
  }

  void clearUpcomingQueue() {
    if (_playOrder.isEmpty) return;
    final curr = _playOrder[_orderCursor];
    _playOrder = [curr];
    _orderCursor = 0;
    _publishQueueAndCurrentMedia();
    _emitChange();
  }

  List<WavelengthTrack> get orderedQueueTracks =>
      _playOrder.map((i) => _tracks[i]).toList();
  int get orderCursor => _orderCursor;

  // Sleep Timer
  void setSleepTimer(Duration? duration, {bool endOfTrack = false}) {
    _sleepTimer?.cancel();
    _sleepEndOfTrack = endOfTrack;
    if (endOfTrack) {
      _sleepTimerEndsAt = null;
      _emitChange();
      return;
    }
    if (duration == null) {
      _sleepTimerEndsAt = null;
      _emitChange();
      return;
    }
    _sleepTimerEndsAt = DateTime.now().add(duration);
    _sleepTimer = Timer(duration, () async {
      _sleepTimerEndsAt = null;
      _sleepEndOfTrack = false;
      await pause();
      _toastController.add('Sleep timer paused playback');
      _emitChange();
    });
    _emitChange();
  }

  // Android Auto MediaBrowserService browse tree
  @override
  Future<List<MediaItem>> getChildren(
    String parentMediaId, [
    Map<String, dynamic>? options,
  ]) async {
    _androidAutoInitialized = true;
    if (parentMediaId == AudioService.browsableRootId) {
      return const [
        MediaItem(
          id: 'auto:hits',
          title: "Today's Top Hits",
          playable: false,
        ),
        MediaItem(
          id: 'auto:bollywood',
          title: 'Hot Hits India',
          playable: false,
        ),
        MediaItem(
          id: 'auto:liked',
          title: 'Liked Songs',
          playable: false,
        ),
        MediaItem(
          id: 'auto:playlists',
          title: 'Your Playlists',
          playable: false,
        ),
      ];
    }
    if (parentMediaId == 'auto:hits') {
      return CuratedCatalog.todayTopHits.map((t) => _toMediaItem(t)).toList();
    }
    if (parentMediaId == 'auto:bollywood') {
      return CuratedCatalog.bollywoodHits.map((t) => _toMediaItem(t)).toList();
    }
    if (parentMediaId == 'auto:liked') {
      final liked = await _db.getLikedTracks();
      return liked.map((t) => _toMediaItem(t)).toList();
    }
    if (parentMediaId == 'auto:playlists') {
      final pls = await _db.getPlaylists();
      return pls
          .map((p) => MediaItem(
                id: 'auto_pl:${p.id}',
                title: p.name,
                displaySubtitle: '${p.trackCount} songs',
                playable: false,
              ))
          .toList();
    }
    if (parentMediaId.startsWith('auto_pl:')) {
      final plId = parentMediaId.replaceFirst('auto_pl:', '');
      final tracks = await _db.getPlaylistTracks(plId);
      return tracks.map((t) => _toMediaItem(t)).toList();
    }
    return const [];
  }

  @override
  Future<void> playFromMediaId(
    String mediaId, [
    Map<String, dynamic>? extras,
  ]) async {
    final all = <WavelengthTrack>[
      ...CuratedCatalog.allTracks,
      ...await _db.getLikedTracks(),
    ];
    final idx = all.indexWhere((t) => t.id == mediaId);
    if (idx >= 0) {
      await playTracks(all, startIndex: idx);
      return;
    }
    if (_androidAutoInitialized) {
      final found = await CatalogService(db: _db).searchTracksRemote(mediaId, limit: 5);
      if (found.isNotEmpty) {
        await playTracks(found);
      }
    }
  }

  void _syncPlaybackState() {
    final curr = currentTrack;
    final liked = curr != null && _likedIds.contains(curr.id);
    final playing = _player.playing;

    final proc = switch (_player.processingState) {
      ProcessingState.idle => AudioProcessingState.idle,
      ProcessingState.loading => AudioProcessingState.loading,
      ProcessingState.buffering => AudioProcessingState.buffering,
      ProcessingState.ready => AudioProcessingState.ready,
      ProcessingState.completed => AudioProcessingState.completed,
    };

    playbackState.add(
      PlaybackState(
        controls: [
          MediaControl.skipToPrevious,
          playing ? MediaControl.pause : MediaControl.play,
          MediaControl.skipToNext,
          MediaControl.custom(
            androidIcon:
                liked ? 'drawable/ic_heart_filled' : 'drawable/ic_heart_outline',
            label: liked ? 'Unlike' : 'Like',
            name: 'toggle_like',
          ),
          MediaControl.stop,
        ],
        systemActions: const {
          MediaAction.seek,
          MediaAction.seekBackward,
          MediaAction.seekForward,
          MediaAction.setShuffleMode,
          MediaAction.setRepeatMode,
          MediaAction.setSpeed,
        },
        androidCompactActionIndices: const [0, 1, 2],
        processingState: curr != null && proc == AudioProcessingState.idle
            ? AudioProcessingState.ready
            : proc,
        playing: playing,
        updatePosition: _player.position,
        bufferedPosition: _player.bufferedPosition,
        speed: _player.speed,
        queueIndex: _orderCursor,
        shuffleMode:
            _shuffle ? AudioServiceShuffleMode.all : AudioServiceShuffleMode.none,
        repeatMode: switch (_repeatMode) {
          RepeatModeSetting.off => AudioServiceRepeatMode.none,
          RepeatModeSetting.all => AudioServiceRepeatMode.all,
          RepeatModeSetting.one => AudioServiceRepeatMode.one,
        },
      ),
    );
  }

  void _emitChange() {
    if (!_stateChangeController.isClosed) {
      _stateChangeController.add(null);
    }
  }

  Future<void> disposeHandler() async {
    _sleepTimer?.cancel();
    _savePosTimer?.cancel();
    _clickDetector.dispose();
    await _player.dispose();
    await _toastController.close();
    await _stateChangeController.close();
  }
}
