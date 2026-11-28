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
  return MasterAudioResolver(
    db: ref.watch(databaseProvider),
    customBackendUrl: ref.watch(sharedPrefsProvider).getString('wl_custom_backend'),
  );
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

class IntegrationCredsNotifier extends Notifier<({String metaAppId, String snapClientId})> {
  static const _metaKey = 'wl_meta_app_id';
  static const _snapKey = 'wl_snap_client_id';

  @override
  ({String metaAppId, String snapClientId}) build() {
    final prefs = ref.watch(sharedPrefsProvider);
    return (
      metaAppId: prefs.getString(_metaKey) ?? '',
      snapClientId: prefs.getString(_snapKey) ?? '',
    );
  }

  Future<void> save({required String metaAppId, required String snapClientId}) async {
    final prefs = ref.read(sharedPrefsProvider);
    await prefs.setString(_metaKey, metaAppId.trim());
    await prefs.setString(_snapKey, snapClientId.trim());
    state = (metaAppId: metaAppId.trim(), snapClientId: snapClientId.trim());
  }
}

final integrationCredsProvider = NotifierProvider<IntegrationCredsNotifier,
    ({String metaAppId, String snapClientId})>(IntegrationCredsNotifier.new);

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
