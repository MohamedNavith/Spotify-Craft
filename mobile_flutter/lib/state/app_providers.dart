import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../audio/wavelength_audio_handler.dart';
import '../core/database.dart';
import '../core/models.dart';
import '../core/palette_extractor.dart';
import '../data/catalog_service.dart';
import '../data/master_audio_resolver.dart';
import '../data/offline_service.dart';
import '../data/spotify_import_service.dart';
import 'navigation_controller.dart';

final databaseProvider = Provider<WavelengthDatabase>((ref) {
  throw UnimplementedError('databaseProvider must be overridden in ProviderScope');
});

final sharedPrefsProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('sharedPrefsProvider must be overridden in ProviderScope');
});

final audioHandlerProvider = Provider<WavelengthAudioHandler>((ref) {
  throw UnimplementedError('audioHandlerProvider must be overridden in ProviderScope');
});

final navigationProvider = Provider<WavelengthNavigationController>((ref) {
  final controller = WavelengthNavigationController();
  ref.onDispose(controller.dispose);
  return controller;
});

final catalogServiceProvider = Provider<CatalogService>((ref) {
  return CatalogService(db: ref.watch(databaseProvider));
});

final resolverProvider = Provider<MasterAudioResolver>((ref) {
  return MasterAudioResolver(db: ref.watch(databaseProvider));
});

final offlineServiceProvider = Provider<OfflineService>((ref) {
  return OfflineService(
    db: ref.watch(databaseProvider),
    resolver: ref.watch(resolverProvider),
  );
});

final spotifyImportProvider = Provider<SpotifyImportService>((ref) {
  return SpotifyImportService(catalog: ref.watch(catalogServiceProvider));
});

class LibraryTickNotifier extends Notifier<int> {
  @override
  int build() => 0;
  void bump() => state++;
}

final libraryTickProvider =
    NotifierProvider<LibraryTickNotifier, int>(LibraryTickNotifier.new);

class ThemePrefNotifier extends Notifier<AppThemePreference> {
  static const _prefKey = 'wl_theme_mode';

  @override
  AppThemePreference build() {
    final raw = ref.watch(sharedPrefsProvider).getString(_prefKey);
    return AppThemePreference.values.firstWhere(
      (e) => e.name == raw,
      orElse: () => AppThemePreference.dark,
    );
  }

  Future<void> setPreference(AppThemePreference pref) async {
    state = pref;
    await ref.read(sharedPrefsProvider).setString(_prefKey, pref.name);
  }
}

final themePreferenceProvider =
    NotifierProvider<ThemePrefNotifier, AppThemePreference>(ThemePrefNotifier.new);

class FavoriteArtistsNotifier extends Notifier<List<String>> {
  static const _prefKey = 'wavelength_favorite_artists';
  static const List<String> _defaults = [
    'Taylor Swift',
    'Arijit Singh',
    'Bruno Mars',
    'Anirudh Ravichander',
  ];

  @override
  List<String> build() {
    final raw = ref.watch(sharedPrefsProvider).getString(_prefKey);
    if (raw == null || raw.isEmpty) return _defaults;
    try {
      final list = (jsonDecode(raw) as List<dynamic>).cast<String>();
      return list;
    } catch (_) {
      return _defaults;
    }
  }

  Future<void> toggle(String artistName) async {
    final next = List<String>.from(state);
    if (next.contains(artistName)) {
      next.remove(artistName);
    } else {
      next.add(artistName);
    }
    state = next;
    await ref.read(sharedPrefsProvider).setString(_prefKey, jsonEncode(next));
  }

  Future<void> addCustom(String artistName) async {
    final clean = artistName.trim();
    if (clean.isEmpty || state.contains(clean)) return;
    final next = [...state, clean];
    state = next;
    await ref.read(sharedPrefsProvider).setString(_prefKey, jsonEncode(next));
  }
}

final favoriteArtistsProvider =
    NotifierProvider<FavoriteArtistsNotifier, List<String>>(
        FavoriteArtistsNotifier.new);

class DisplayEffectsState {
  const DisplayEffectsState({
    this.dynamicIslandVisible = true,
    this.lumnGlowEnabled = true,
    this.lumnGlowIntensity = 80.0,
    this.canvasModeEnabled = true,
    this.verciStyle = VerciStyle.constellation,
    this.verciFont = VerciFontStyle.figtree,
    this.verciTextScale = 1.0,
  });

  final bool dynamicIslandVisible;
  final bool lumnGlowEnabled;
  final double lumnGlowIntensity;
  final bool canvasModeEnabled;
  final VerciStyle verciStyle;
  final VerciFontStyle verciFont;
  final double verciTextScale;

  DisplayEffectsState copyWith({
    bool? dynamicIslandVisible,
    bool? lumnGlowEnabled,
    double? lumnGlowIntensity,
    bool? canvasModeEnabled,
    VerciStyle? verciStyle,
    VerciFontStyle? verciFont,
    double? verciTextScale,
  }) {
    return DisplayEffectsState(
      dynamicIslandVisible: dynamicIslandVisible ?? this.dynamicIslandVisible,
      lumnGlowEnabled: lumnGlowEnabled ?? this.lumnGlowEnabled,
      lumnGlowIntensity: lumnGlowIntensity ?? this.lumnGlowIntensity,
      canvasModeEnabled: canvasModeEnabled ?? this.canvasModeEnabled,
      verciStyle: verciStyle ?? this.verciStyle,
      verciFont: verciFont ?? this.verciFont,
      verciTextScale: verciTextScale ?? this.verciTextScale,
    );
  }
}

class DisplayEffectsNotifier extends Notifier<DisplayEffectsState> {
  @override
  DisplayEffectsState build() {
    final prefs = ref.watch(sharedPrefsProvider);
    final styleRaw = prefs.getString('wl_verci_style');
    final style = VerciStyle.values.firstWhere(
      (s) => s.name == styleRaw,
      orElse: () => VerciStyle.constellation,
    );
    return DisplayEffectsState(
      dynamicIslandVisible: prefs.getBool('wl_island_visible') ?? true,
      lumnGlowEnabled: prefs.getBool('wl_lumn_glow') ?? true,
      lumnGlowIntensity: prefs.getDouble('wl_lumn_intensity') ?? 80.0,
      canvasModeEnabled: prefs.getBool('wl_canvas_enabled') ?? true,
      verciStyle: style,
    );
  }

  Future<void> toggleDynamicIsland([bool? value]) async {
    final next = value ?? !state.dynamicIslandVisible;
    state = state.copyWith(dynamicIslandVisible: next);
    await ref.read(sharedPrefsProvider).setBool('wl_island_visible', next);
  }

  Future<void> toggleLumnGlow([bool? value]) async {
    final next = value ?? !state.lumnGlowEnabled;
    state = state.copyWith(lumnGlowEnabled: next);
    await ref.read(sharedPrefsProvider).setBool('wl_lumn_glow', next);
  }

  Future<void> setLumnGlowIntensity(double intensity) async {
    state = state.copyWith(lumnGlowIntensity: intensity.clamp(20.0, 140.0));
    await ref.read(sharedPrefsProvider).setDouble('wl_lumn_intensity', state.lumnGlowIntensity);
  }

  Future<void> toggleCanvasMode([bool? value]) async {
    final next = value ?? !state.canvasModeEnabled;
    state = state.copyWith(canvasModeEnabled: next);
    await ref.read(sharedPrefsProvider).setBool('wl_canvas_enabled', next);
  }

  Future<void> setVerciStyle(VerciStyle style) async {
    state = state.copyWith(verciStyle: style);
    await ref.read(sharedPrefsProvider).setString('wl_verci_style', style.name);
  }

  void setVerciFont(VerciFontStyle font) {
    state = state.copyWith(verciFont: font);
  }

  void setVerciTextScale(double scale) {
    state = state.copyWith(verciTextScale: scale.clamp(0.7, 1.5));
  }
}

final displayEffectsProvider =
    NotifierProvider<DisplayEffectsNotifier, DisplayEffectsState>(
        DisplayEffectsNotifier.new);

final audioEngineTickProvider = StreamProvider<int>((ref) async* {
  final handler = ref.watch(audioHandlerProvider);
  var i = 0;
  yield i;
  await for (final _ in handler.engineChanges) {
    yield ++i;
  }
});

final currentPaletteProvider = FutureProvider<ExtractedPalette>((ref) async {
  ref.watch(audioEngineTickProvider);
  final handler = ref.read(audioHandlerProvider);
  final track = handler.currentTrack;
  if (track == null) return ArtworkPaletteExtractor.fallbackFor('wavelength');
  return ArtworkPaletteExtractor.fromUrl(
    track.artworkUrl,
    fallbackSeed: '${track.id}-${track.title}',
  );
});

final likedTracksProvider = FutureProvider<List<WavelengthTrack>>((ref) async {
  ref.watch(libraryTickProvider);
  ref.watch(audioEngineTickProvider);
  return ref.watch(databaseProvider).getLikedTracks();
});

final userPlaylistsProvider = FutureProvider<List<WavelengthPlaylist>>((ref) async {
  ref.watch(libraryTickProvider);
  return ref.watch(databaseProvider).getPlaylists();
});

final historyProvider = FutureProvider<List<ListeningHistoryEntry>>((ref) async {
  ref.watch(libraryTickProvider);
  ref.watch(audioEngineTickProvider);
  return ref.watch(databaseProvider).getHistory(limit: 50);
});

final offlineTracksProvider = FutureProvider<List<OfflineTrackEntry>>((ref) async {
  ref.watch(libraryTickProvider);
  return ref.watch(databaseProvider).getOfflineTracks();
});

final recentSearchesProvider = FutureProvider<List<String>>((ref) async {
  ref.watch(libraryTickProvider);
  return ref.watch(databaseProvider).getRecentSearches();
});

final statsSummaryProvider = FutureProvider<LibraryStatsSummary>((ref) async {
  ref.watch(libraryTickProvider);
  return ref.watch(databaseProvider).getStatsSummary();
});
