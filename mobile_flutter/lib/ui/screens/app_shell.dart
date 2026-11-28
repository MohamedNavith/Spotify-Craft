import 'dart:async';
import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../core/models.dart';
import '../../core/palette_extractor.dart';
import '../../core/theme.dart';
import '../../data/curated_catalog.dart';
import '../../platform/native_bridge.dart';
import '../../state/app_providers.dart';
import '../modals/share_sheet.dart';
import '../widgets/artwork_image.dart';
import '../widgets/dynamic_island.dart';
import 'full_player_screen.dart';
import 'home_search_library_screens.dart';
import 'settings_screen.dart';
import 'spotify_import_screen.dart';
import 'verci_experience_screen.dart';

class WavelengthAppShell extends ConsumerStatefulWidget {
  const WavelengthAppShell({super.key});

  @override
  ConsumerState<WavelengthAppShell> createState() => _WavelengthAppShellState();
}

class _WavelengthAppShellState extends ConsumerState<WavelengthAppShell> {
  StreamSubscription<String>? _toastSub;
  StreamSubscription<String>? _deepLinkSub;

  @override
  void initState() {
    super.initState();
    _initRuntimeListeners();
  }

  Future<void> _initRuntimeListeners() async {
    final handler = ref.read(audioHandlerProvider);
    _toastSub = handler.toastStream.listen((msg) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg)),
        );
      }
    });

    if (Platform.isAndroid) {
      await Permission.notification.request();
      final initialLink = await NativeBridge.getInitialDeepLink();
      if (initialLink != null && initialLink.isNotEmpty) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _handleIncomingLink(initialLink);
        });
      }
      _deepLinkSub = NativeBridge.deepLinkStream.listen(_handleIncomingLink);
    }
  }

  void _handleIncomingLink(String payload) {
    if (!mounted) return;
    final nav = ref.read(navigationProvider);
    final handler = ref.read(audioHandlerProvider);

    if (payload.contains('open.spotify.com/') || payload.startsWith('spotify:')) {
      nav.collapseFullPlayer();
      nav.pushInActiveTab(SpotifyImportScreen(initialInput: payload));
      return;
    }

    if (payload == 'wavelength://player') {
      nav.openFullPlayer();
      return;
    }

    if (payload.startsWith('wavelength://track/')) {
      final uri = Uri.tryParse(payload);
      final title = uri?.queryParameters['title'];
      final artist = uri?.queryParameters['artist'];
      if (title != null) {
        ref
            .read(catalogServiceProvider)
            .searchTracksRemote('$title ${artist ?? ''}', limit: 5)
            .then((found) {
          if (found.isNotEmpty) {
            handler.playTracks(found);
            nav.openFullPlayer();
          }
        });
      } else {
        final match = CuratedCatalog.allTracks
            .where((t) => payload.contains(t.id))
            .firstOrNull;
        if (match != null) {
          handler.playTracks([match]);
          nav.openFullPlayer();
        }
      }
    }
  }

  @override
  void dispose() {
    _toastSub?.cancel();
    _deepLinkSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final nav = ref.watch(navigationProvider);
    final effects = ref.watch(displayEffectsProvider);
    final themePref = ref.watch(themePreferenceProvider);
    final keyboardVisible = MediaQuery.of(context).viewInsets.bottom > 0;
    nav.setKeyboardVisible(keyboardVisible);

    return ListenableBuilder(
      listenable: nav,
      builder: (context, _) {
        return PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) async {
            if (didPop) return;
            final handled = await nav.handleBackPress(
              rootContext: context,
              onShowExitToast: (msg) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(msg),
                    duration: const Duration(seconds: 2),
                  ),
                );
              },
            );
            if (!handled) {
              SystemNavigator.pop();
            }
          },
          child: Stack(
            children: [
              Scaffold(
                appBar: PreferredSize(
                  preferredSize: const Size.fromHeight(58),
                  child: _WavelengthTopBar(
                    isDynamicIslandOn: effects.dynamicIslandVisible,
                    isDark: themePref != AppThemePreference.light,
                    onToggleIsland: () => ref
                        .read(displayEffectsProvider.notifier)
                        .toggleDynamicIsland(),
                    onOpenSettings: () => nav.selectTab(3),
                    onToggleTheme: () => ref
                        .read(themePreferenceProvider.notifier)
                        .setPreference(
                          themePref == AppThemePreference.dark
                              ? AppThemePreference.light
                              : AppThemePreference.dark,
                        ),
                  ),
                ),
                body: Stack(
                  children: [
                    IndexedStack(
                      index: nav.currentTabIndex,
                      children: [
                        _TabNavigatorHost(
                          navigatorKey: nav.tabNavigatorKeys[0],
                          rootPage: const HomeScreen(),
                        ),
                        _TabNavigatorHost(
                          navigatorKey: nav.tabNavigatorKeys[1],
                          rootPage: const SearchScreen(),
                        ),
                        _TabNavigatorHost(
                          navigatorKey: nav.tabNavigatorKeys[2],
                          rootPage: const LibraryScreen(),
                        ),
                        _TabNavigatorHost(
                          navigatorKey: nav.tabNavigatorKeys[3],
                          rootPage: const SettingsScreen(),
                        ),
                      ],
                    ),
                    const Positioned(
                      left: 0,
                      right: 0,
                      bottom: 0,
                      child: _PersistentMiniPlayer(),
                    ),
                  ],
                ),
                bottomNavigationBar: _WavelengthBottomNavBar(
                  currentIndex: nav.currentTabIndex,
                  onSelectTab: nav.selectTab,
                  onOpenVerci: nav.openVerci,
                ),
              ),
              if (nav.isFullPlayerOpen)
                const Positioned.fill(
                  child: FullPlayerScreen(),
                ),
              if (nav.isVerciOpen)
                const Positioned.fill(
                  child: VerciExperienceScreen(),
                ),
              const WavelengthDynamicIsland(),
            ],
          ),
        );
      },
    );
  }
}

class _WavelengthTopBar extends StatelessWidget {
  const _WavelengthTopBar({
    required this.isDynamicIslandOn,
    required this.isDark,
    required this.onToggleIsland,
    required this.onOpenSettings,
    required this.onToggleTheme,
  });

  final bool isDynamicIslandOn;
  final bool isDark;
  final VoidCallback onToggleIsland;
  final VoidCallback onOpenSettings;
  final VoidCallback onToggleTheme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, MediaQuery.of(context).padding.top + 8, 12, 8),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.94),
        border: const Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: const BoxDecoration(
              color: WavelengthColors.emerald,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.sensors_rounded,
                color: Colors.black, size: 20),
          ),
          const SizedBox(width: 10),
          const Text(
            'Wavelength',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: onToggleIsland,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isDynamicIslandOn
                    ? WavelengthColors.emerald.withValues(alpha: 0.16)
                    : Colors.white10,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: isDynamicIslandOn
                      ? WavelengthColors.emerald.withValues(alpha: 0.5)
                      : Colors.white12,
                ),
              ),
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: isDynamicIslandOn
                      ? WavelengthColors.emerald
                      : Colors.white38,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
          const SizedBox(width: 4),
          IconButton(
            constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
            icon: Icon(
              isDark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
              size: 20,
            ),
            onPressed: onToggleTheme,
          ),
          IconButton(
            constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
            icon: const Icon(Icons.settings_outlined, size: 21),
            onPressed: onOpenSettings,
          ),
        ],
      ),
    );
  }
}

class _WavelengthBottomNavBar extends StatelessWidget {
  const _WavelengthBottomNavBar({
    required this.currentIndex,
    required this.onSelectTab,
    required this.onOpenVerci,
  });

  final int currentIndex;
  final void Function(int index) onSelectTab;
  final VoidCallback onOpenVerci;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          6, 6, 6, math.max(8, MediaQuery.of(context).padding.bottom)),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.96),
        border: const Border(top: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _NavButton(
            icon: currentIndex == 0 ? Icons.home_rounded : Icons.home_outlined,
            label: 'Home',
            active: currentIndex == 0,
            onTap: () => onSelectTab(0),
          ),
          _NavButton(
            icon: Icons.search_rounded,
            label: 'Search',
            active: currentIndex == 1,
            onTap: () => onSelectTab(1),
          ),
          _NavButton(
            icon: currentIndex == 2
                ? Icons.library_music_rounded
                : Icons.library_music_outlined,
            label: 'Library',
            active: currentIndex == 2,
            onTap: () => onSelectTab(2),
          ),
          _NavButton(
            icon: currentIndex == 3
                ? Icons.settings_rounded
                : Icons.settings_outlined,
            label: 'Settings',
            active: currentIndex == 3,
            onTap: () => onSelectTab(3),
          ),
          InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onOpenVerci,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      const Icon(
                        Icons.track_changes_rounded,
                        color: WavelengthColors.amberHiRes,
                        size: 22,
                      ),
                      Positioned(
                        top: -2,
                        right: -3,
                        child: Container(
                          width: 7,
                          height: 7,
                          decoration: const BoxDecoration(
                            color: WavelengthColors.emerald,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Verci',
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: active ? WavelengthColors.emerald : Colors.white60,
              size: 22,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                color: active ? Colors.white : Colors.white60,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabNavigatorHost extends StatelessWidget {
  const _TabNavigatorHost({
    required this.navigatorKey,
    required this.rootPage,
  });

  final GlobalKey<NavigatorState> navigatorKey;
  final Widget rootPage;

  @override
  Widget build(BuildContext context) {
    return Navigator(
      key: navigatorKey,
      onGenerateRoute: (_) => MaterialPageRoute<void>(
        builder: (_) => rootPage,
      ),
    );
  }
}

class _PersistentMiniPlayer extends ConsumerWidget {
  const _PersistentMiniPlayer();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(audioEngineTickProvider);
    ref.watch(libraryTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final nav = ref.watch(navigationProvider);
    final track = handler.currentTrack;
    if (track == null) return const SizedBox.shrink();

    final palette = ref.watch(currentPaletteProvider).value ??
        ArtworkPaletteExtractor.fallbackFor(track.title);
    final isLiked = handler.isTrackLiked(track.id);

    return GestureDetector(
      onTap: nav.openFullPlayer,
      onVerticalDragEnd: (d) {
        if ((d.primaryVelocity ?? 0) < -240) nav.openFullPlayer();
      },
      onHorizontalDragEnd: (d) {
        final vx = d.primaryVelocity ?? 0;
        if (vx < -280) handler.skipToNext();
        if (vx > 280) handler.skipToPrevious();
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(8, 0, 8, 8),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              palette.backgroundTop,
              Theme.of(context).cardColor.withValues(alpha: 0.96),
            ],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white12),
          boxShadow: const [
            BoxShadow(
              color: Colors.black54,
              blurRadius: 18,
              offset: Offset(0, 6),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: WavelengthSpacing.miniPlayerHeight,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(
                  children: [
                    WavelengthArtwork(
                      imageUrl: track.artworkUrl,
                      size: 42,
                      borderRadius: 6,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            track.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            track.artist,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 11,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      constraints:
                          const BoxConstraints(minWidth: 40, minHeight: 40),
                      icon: const Icon(Icons.cast_rounded, size: 19),
                      onPressed: () =>
                          showShareSheet(context, ref, track: track),
                    ),
                    IconButton(
                      constraints:
                          const BoxConstraints(minWidth: 40, minHeight: 40),
                      icon: Icon(
                        isLiked ? Icons.check_circle_rounded : Icons.add_rounded,
                        color: isLiked
                            ? WavelengthColors.emerald
                            : Colors.white70,
                        size: 22,
                      ),
                      onPressed: () async {
                        await handler.toggleLikeTrack(track);
                        ref.read(libraryTickProvider.notifier).bump();
                      },
                    ),
                    const SizedBox(width: 4),
                    InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () =>
                          handler.isPlaying ? handler.pause() : handler.play(),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          handler.isPlaying
                              ? Icons.pause_rounded
                              : Icons.play_arrow_rounded,
                          color: Colors.black,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            StreamBuilder<Duration>(
              stream: handler.positionStream,
              builder: (_, posSnap) {
                final totalMs = handler.duration.inMilliseconds;
                final posMs = (posSnap.data ?? handler.position).inMilliseconds;
                final pct =
                    totalMs > 0 ? (posMs / totalMs).clamp(0.0, 1.0) : 0.0;
                return LinearProgressIndicator(
                  value: pct,
                  minHeight: 2.2,
                  backgroundColor: Colors.white12,
                  valueColor: const AlwaysStoppedAnimation(Colors.white),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
