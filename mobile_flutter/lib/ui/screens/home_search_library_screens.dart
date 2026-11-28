import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/fuzzy_search.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import '../../data/curated_catalog.dart';
import '../../data/local_audio_scanner.dart';
import '../../state/app_providers.dart';
import '../modals/add_to_playlist_sheet.dart';
import '../modals/share_sheet.dart';
import '../widgets/artwork_image.dart';
import 'detail_screens.dart';
import 'spotify_import_screen.dart';

enum HomeCategoryTab { all, music, podcasts }

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  HomeCategoryTab _category = HomeCategoryTab.all;
  List<WavelengthTrack> _favSingerTracks = const [];
  String _loadedFavKey = '';

  String _greetingText() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  Future<void> _syncFavSingerPicks(List<String> artists) async {
    final key = artists.join('|');
    if (key == _loadedFavKey || artists.isEmpty) return;
    _loadedFavKey = key;
    final found = await ref
        .read(catalogServiceProvider)
        .searchTracksRemote(artists.take(3).join(' '), limit: 12);
    if (mounted && found.isNotEmpty) {
      setState(() => _favSingerTracks = found);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    ref.watch(libraryTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final nav = ref.watch(navigationProvider);
    final history = ref.watch(historyProvider).value ?? const [];
    final liked = ref.watch(likedTracksProvider).value ?? const [];
    final favArtists = ref.watch(favoriteArtistsProvider);

    unawaited(_syncFavSingerPicks(favArtists));

    final mixes = CuratedCatalog.generatePersonalizedMixes(
      history.map((h) => h.track).toList(),
      liked,
    );

    final quickTiles = [
      (
        title: "Today's Top Hits",
        gradient: [const Color(0xFF047857), const Color(0xFF16A34A)],
        icon: Icons.local_fire_department_outlined,
        playlist: CuratedCatalog.curatedPlaylists[0],
        isLiked: false,
      ),
      (
        title: 'Bollywood & Indian Hits',
        gradient: [const Color(0xFFD97706), const Color(0xFFE11D48)],
        icon: Icons.auto_awesome_outlined,
        playlist: CuratedCatalog.curatedPlaylists[1],
        isLiked: false,
      ),
      (
        title: 'Global Top 50',
        gradient: [const Color(0xFF4338CA), const Color(0xFF9333EA)],
        icon: Icons.sensors_rounded,
        playlist: CuratedCatalog.curatedPlaylists[2],
        isLiked: false,
      ),
      (
        title: 'Chill Lo-Fi Study',
        gradient: [const Color(0xFF115E59), const Color(0xFF0E7490)],
        icon: Icons.headphones_outlined,
        playlist: CuratedCatalog.curatedPlaylists[3],
        isLiked: false,
      ),
      (
        title: 'Liked Songs',
        gradient: [const Color(0xFF6B21A8), const Color(0xFF312E81)],
        icon: Icons.favorite_rounded,
        playlist: WavelengthPlaylist(
          id: 'liked-songs',
          name: 'Liked Songs',
          description: '${liked.length} favorites',
          isSystem: true,
          trackCount: liked.length,
          tracks: liked,
        ),
        isLiked: true,
      ),
      (
        title: 'Rock & Pop Legends',
        gradient: [const Color(0xFF9F1239), const Color(0xFFDB2777)],
        icon: Icons.music_note_rounded,
        playlist: WavelengthPlaylist(
          id: 'collection-rock-pop',
          name: 'Rock & Pop Legends',
          description: 'Guitar anthems and indie pop',
          isSystem: true,
          tracks: CuratedCatalog.global50,
        ),
        isLiked: false,
      ),
    ];

    final pausedTrack = handler.currentTrack;
    final showResumeBanner = pausedTrack != null &&
        !handler.isPlaying &&
        handler.position > const Duration(seconds: 2);

    return Scaffold(
      body: CustomScrollView(
        controller: nav.tabScrollControllers[0],
        slivers: [
          // Top All | Music | Podcasts pill switcher (matches 05_mobile_home.png)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
              child: Row(
                children: HomeCategoryTab.values.map((tab) {
                  final active = _category == tab;
                  final label =
                      tab.name[0].toUpperCase() + tab.name.substring(1);
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => setState(() => _category = tab),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 160),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: active
                              ? Colors.white
                              : Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          label,
                          style: TextStyle(
                            color: active ? Colors.black : Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          if (_category == HomeCategoryTab.podcasts)
            SliverList(
              delegate: SliverChildListDelegate([
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 14, 16, 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Podcasts & Shows',
                        style: TextStyle(
                            fontSize: 26, fontWeight: FontWeight.w900),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Curated audio shows and engineering deep dives',
                        style: TextStyle(color: Colors.white60, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                ...CuratedCatalog.samplePodcasts.map((pod) {
                  return Container(
                    margin: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Color(pod.colorStart),
                                    Color(pod.colorEnd),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.mic_rounded,
                                  color: Colors.white, size: 30),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'PODCAST',
                                    style: TextStyle(
                                      color: WavelengthColors.emerald,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                                  Text(
                                    pod.title,
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  Text(
                                    pod.description,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Colors.white60,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 20, color: Colors.white10),
                        ...pod.episodes.map((ep) {
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: const CircleAvatar(
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.black,
                              child: Icon(Icons.play_arrow_rounded),
                            ),
                            title: Text(ep.title,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700, fontSize: 14)),
                            subtitle: Text(
                              '${ep.publishedLabel} • ${ep.durationSec ~/ 60} min${ep.resumeSec > 0 ? ' • Resume ${ep.resumeSec ~/ 60}m' : ''}',
                              style: const TextStyle(
                                  color: Colors.white60, fontSize: 12),
                            ),
                            onTap: () {
                              handler.playTracks([
                                WavelengthTrack(
                                  id: 'podcast:${ep.id}',
                                  title: ep.title,
                                  artist: pod.host,
                                  album: pod.title,
                                  audioUrl:
                                      'https://prod-1.storage.jamendo.com/?trackid=241&format=mp31',
                                  durationMs: ep.durationSec * 1000,
                                  source: 'jamendo',
                                  credits: pod.description,
                                ),
                              ]);
                            },
                          );
                        }),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 140),
              ]),
            )
          else ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        _greetingText(),
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.7,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.auto_graph_rounded),
                      tooltip: 'Sound Stats & Wrapped',
                      onPressed: () =>
                          nav.pushInActiveTab(const StatsAndWrappedScreen()),
                    ),
                  ],
                ),
              ),
            ),

            if (showResumeBanner)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: WavelengthColors.emerald.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: WavelengthColors.emerald.withValues(alpha: 0.45),
                      ),
                    ),
                    child: Row(
                      children: [
                        WavelengthArtwork(
                            imageUrl: pausedTrack.artworkUrl, size: 46),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'PICK UP WHERE YOU LEFT OFF',
                                style: TextStyle(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w800,
                                  color: WavelengthColors.emerald,
                                  letterSpacing: 0.8,
                                ),
                              ),
                              Text(
                                pausedTrack.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ),
                        FilledButton.icon(
                          onPressed: () => handler.play(),
                          style: FilledButton.styleFrom(
                            backgroundColor: WavelengthColors.emerald,
                            foregroundColor: Colors.black,
                          ),
                          icon: const Icon(Icons.play_arrow_rounded),
                          label: const Text('Resume'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Stacked Gradient-Icon Shortcut Cards (exact match to 05_mobile_home.png)
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, idx) {
                    final tile = quickTiles[idx];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () => nav.pushInActiveTab(
                          PlaylistDetailScreen(
                            initialPlaylist: tile.playlist,
                            isLikedSongsCollection: tile.isLiked,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 58,
                              height: 58,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: tile.gradient,
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                              child: Icon(tile.icon,
                                  color: Colors.white, size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Text(
                                tile.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(
                                Icons.play_circle_filled_rounded,
                                color: WavelengthColors.emerald,
                                size: 30,
                              ),
                              onPressed: () {
                                if (tile.playlist.tracks.isNotEmpty) {
                                  handler.playTracks(tile.playlist.tracks);
                                } else {
                                  nav.pushInActiveTab(
                                    PlaylistDetailScreen(
                                      initialPlaylist: tile.playlist,
                                      isLikedSongsCollection: tile.isLiked,
                                    ),
                                  );
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                  childCount: quickTiles.length,
                ),
              ),
            ),

            if (_favSingerTracks.isNotEmpty)
              _HorizontalTracksSection(
                title: 'Because You Like ${favArtists.take(2).join(' & ')}',
                tracks: _favSingerTracks,
                onPlay: (idx) =>
                    handler.playTracks(_favSingerTracks, startIndex: idx),
              ),

            _HorizontalPlaylistsSection(
              title: 'Made For You',
              playlists: mixes,
              onOpen: (pl) => nav.pushInActiveTab(
                PlaylistDetailScreen(initialPlaylist: pl),
              ),
            ),

            _HorizontalArtistsSection(
              artists: CuratedCatalog.featuredArtists,
              onOpen: (artist) => nav.pushInActiveTab(
                ArtistDetailScreen(artistName: artist.name, artistModel: artist),
              ),
            ),

            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 18, 16, 8),
                child: Text(
                  'Quick Picks & Master Hits',
                  style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
                ),
              ),
            ),

            SliverList(
              delegate: SliverChildBuilderDelegate(
                (ctx, idx) {
                  final tracks =
                      CuratedCatalog.todayTopHits + CuratedCatalog.bollywoodHits;
                  final t = tracks[idx];
                  return TrackRowTile(
                    track: t,
                    isActive: handler.currentTrack?.id == t.id,
                    isPlaying: handler.isPlaying,
                    isLiked: handler.isTrackLiked(t.id),
                    onTap: () => handler.playTracks(tracks, startIndex: idx),
                    onToggleLike: () async {
                      await handler.toggleLikeTrack(t);
                      ref.read(libraryTickProvider.notifier).bump();
                    },
                    onAddToPlaylist: () =>
                        showAddToPlaylistSheet(context, ref, t),
                    onMorePressed: () => showTrackOptionsSheet(context, ref, t),
                  );
                },
                childCount: CuratedCatalog.todayTopHits.length +
                    CuratedCatalog.bollywoodHits.length,
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 140)),
          ],
        ],
      ),
    );
  }
}

class _HorizontalTracksSection extends StatelessWidget {
  const _HorizontalTracksSection({
    required this.title,
    required this.tracks,
    required this.onPlay,
  });

  final String title;
  final List<WavelengthTrack> tracks;
  final void Function(int index) onPlay;

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
          ),
          SizedBox(
            height: 194,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: tracks.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (_, idx) {
                final t = tracks[idx];
                return InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => onPlay(idx),
                  child: SizedBox(
                    width: 136,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        WavelengthArtwork(
                          imageUrl: t.artworkUrl,
                          size: 136,
                          borderRadius: 12,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          t.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                        Text(
                          t.artist,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 11, color: Colors.white60),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _HorizontalPlaylistsSection extends StatelessWidget {
  const _HorizontalPlaylistsSection({
    required this.title,
    required this.playlists,
    required this.onOpen,
  });

  final String title;
  final List<WavelengthPlaylist> playlists;
  final void Function(WavelengthPlaylist pl) onOpen;

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
          ),
          SizedBox(
            height: 196,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: playlists.length,
              separatorBuilder: (_, _) => const SizedBox(width: 14),
              itemBuilder: (_, idx) {
                final pl = playlists[idx];
                return InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => onOpen(pl),
                  child: SizedBox(
                    width: 138,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        PlaylistCollageArtwork(
                          playlist: pl,
                          size: 138,
                          borderRadius: 12,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          pl.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 13.5),
                        ),
                        Text(
                          pl.description,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 11.5, color: Colors.white60),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _HorizontalArtistsSection extends StatelessWidget {
  const _HorizontalArtistsSection({
    required this.artists,
    required this.onOpen,
  });

  final List<WavelengthArtist> artists;
  final void Function(WavelengthArtist artist) onOpen;

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Text(
              'Popular Artists',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
          ),
          SizedBox(
            height: 156,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: artists.length,
              separatorBuilder: (_, _) => const SizedBox(width: 14),
              itemBuilder: (_, idx) {
                final a = artists[idx];
                return InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => onOpen(a),
                  child: SizedBox(
                    width: 110,
                    child: Column(
                      children: [
                        WavelengthArtwork(
                          imageUrl: a.artworkUrl,
                          localAssetPath: a.localAssetPath,
                          size: 106,
                          isCircular: true,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          a.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 12.5),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

enum SearchFilter { all, songs, artists, albums, playlists, lyrics }

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _ctrl = TextEditingController();
  Timer? _debounce;
  SearchFilter _filter = SearchFilter.all;
  String _query = '';
  bool _loading = false;
  List<WavelengthTrack> _tracks = const [];
  String? _didYouMean;

  @override
  void dispose() {
    _debounce?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  void _onQueryChanged(String value, {bool saveHistory = false}) {
    setState(() => _query = value);
    _debounce?.cancel();
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      setState(() {
        _tracks = const [];
        _didYouMean = null;
        _loading = false;
      });
      return;
    }

    final local = FuzzySearchEngine.searchTracks(
      trimmed,
      CuratedCatalog.allTracks,
      minScore: 0.42,
    );
    setState(() {
      _tracks = local;
      _loading = true;
    });

    _debounce = Timer(const Duration(milliseconds: 250), () async {
      await _executeRemoteSearch(trimmed, saveHistory: saveHistory);
    });
  }

  Future<void> _executeRemoteSearch(String q, {bool saveHistory = false}) async {
    final catalog = ref.read(catalogServiceProvider);
    final db = ref.read(databaseProvider);
    if (saveHistory) {
      await db.saveSearchQuery(q);
      ref.read(libraryTickProvider.notifier).bump();
    }

    final remote = _filter == SearchFilter.lyrics
        ? await catalog.searchByLyricsSnippet(q)
        : await catalog.searchTracksRemote(q, limit: 25);

    if (!mounted || _ctrl.text.trim() != q) return;

    final local = FuzzySearchEngine.searchTracks(
      q,
      CuratedCatalog.allTracks,
      minScore: 0.42,
    );

    final byKey = <String, WavelengthTrack>{};
    for (final t in [...local, ...remote]) {
      final k =
          '${FuzzySearchEngine.normalize(t.title)}::${FuzzySearchEngine.normalize(t.artist)}';
      byKey.putIfAbsent(k, () => t);
    }

    final ranked = byKey.values
        .map((t) => (track: t, score: FuzzySearchEngine.scoreTrack(q, t)))
        .toList()
      ..sort((a, b) => b.score.compareTo(a.score));

    final list = _filter == SearchFilter.lyrics && remote.isNotEmpty
        ? remote
        : ranked.map((e) => e.track).toList();

    final vocab = [
      ...CuratedCatalog.featuredArtists.map((a) => a.name),
      ...CuratedCatalog.allTracks.map((t) => t.title),
      ...list.map((t) => t.title),
      ...list.map((t) => t.artist),
    ];
    final suggestion = (list.isEmpty ||
            (ranked.isNotEmpty && ranked.first.score < 0.72))
        ? FuzzySearchEngine.suggestDidYouMean(q, vocab)
        : null;

    setState(() {
      _tracks = list;
      _didYouMean = suggestion;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final nav = ref.watch(navigationProvider);
    final recentAsync = ref.watch(recentSearchesProvider);
    final userPlaylists = ref.watch(userPlaylistsProvider).value ?? const [];

    final matchingArtists = _query.trim().isEmpty
        ? const <WavelengthArtist>[]
        : CuratedCatalog.featuredArtists
            .where((a) =>
                FuzzySearchEngine.similarityScore(_query, a.name) >= 0.45)
            .toList();

    final matchingPlaylists = _query.trim().isEmpty
        ? const <WavelengthPlaylist>[]
        : [...CuratedCatalog.curatedPlaylists, ...userPlaylists]
            .where((p) =>
                FuzzySearchEngine.similarityScore(_query, p.name) >= 0.45)
            .toList();

    return Scaffold(
      body: ListView(
        controller: nav.tabScrollControllers[1],
        padding: const EdgeInsets.only(bottom: 145),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: TextField(
              controller: _ctrl,
              textInputAction: TextInputAction.search,
              onChanged: (v) => _onQueryChanged(v),
              onSubmitted: (v) => _onQueryChanged(v, saveHistory: true),
              decoration: InputDecoration(
                hintText: _filter == SearchFilter.lyrics
                    ? 'Type remembered song lyrics...'
                    : 'What do you want to play?',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _query.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () {
                          _ctrl.clear();
                          _onQueryChanged('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: const Color(0xFF22242C),
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(999),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          SizedBox(
            height: 38,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: SearchFilter.values.map((f) {
                final label = f.name[0].toUpperCase() + f.name.substring(1);
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(label),
                    selected: _filter == f,
                    selectedColor: Colors.white,
                    labelStyle: TextStyle(
                      color: _filter == f ? Colors.black : Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 12.5,
                    ),
                    onSelected: (_) {
                      setState(() => _filter = f);
                      if (_ctrl.text.trim().isNotEmpty) {
                        _executeRemoteSearch(_ctrl.text.trim());
                      }
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          if (_didYouMean != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 2),
              child: ActionChip(
                avatar: const Icon(Icons.auto_fix_high_rounded, size: 16),
                label: Text('Did you mean "$_didYouMean"?'),
                onPressed: () {
                  _ctrl.text = _didYouMean!;
                  _onQueryChanged(_didYouMean!, saveHistory: true);
                },
              ),
            ),
          if (_query.trim().isEmpty) ...[
            recentAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
              data: (recent) {
                if (recent.isEmpty) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Recent Searches',
                            style: TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 15),
                          ),
                          const Spacer(),
                          TextButton(
                            onPressed: () async {
                              await ref
                                  .read(databaseProvider)
                                  .clearRecentSearches();
                              ref.read(libraryTickProvider.notifier).bump();
                            },
                            child: const Text('Clear all'),
                          ),
                        ],
                      ),
                      Wrap(
                        spacing: 8,
                        children: recent.map((q) {
                          return InputChip(
                            label: Text(q),
                            onPressed: () {
                              _ctrl.text = q;
                              _onQueryChanged(q, saveHistory: true);
                            },
                            onDeleted: () async {
                              await ref
                                  .read(databaseProvider)
                                  .removeSearchQuery(q);
                              ref.read(libraryTickProvider.notifier).bump();
                            },
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                );
              },
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Text(
                'Browse all',
                style: TextStyle(fontSize: 21, fontWeight: FontWeight.w900),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: CuratedCatalog.browseCategories.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.45,
                ),
                itemBuilder: (_, idx) {
                  final cat = CuratedCatalog.browseCategories[idx];
                  return InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () {
                      _ctrl.text = cat.query;
                      _onQueryChanged(cat.query, saveHistory: true);
                    },
                    child: Container(
                      clipBehavior: Clip.antiAlias,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [cat.colorStart, cat.colorEnd],
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: -10,
                            bottom: -8,
                            child: Transform.rotate(
                              angle: 0.35,
                              child: WavelengthArtwork(
                                imageUrl: cat.coverUrl,
                                size: 78,
                                borderRadius: 10,
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(14),
                            child: Text(
                              cat.name,
                              maxLines: 2,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 16,
                                height: 1.15,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ] else ...[
            if (_loading && _tracks.isEmpty)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              ),
            if ((_filter == SearchFilter.all || _filter == SearchFilter.artists) &&
                matchingArtists.isNotEmpty) ...[
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text('Artists',
                    style:
                        TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              ),
              ...matchingArtists.map((a) => ListTile(
                    leading: WavelengthArtwork(
                      imageUrl: a.artworkUrl,
                      localAssetPath: a.localAssetPath,
                      size: 48,
                      isCircular: true,
                    ),
                    title: Text(a.name,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(a.monthlyListenersLabel),
                    onTap: () => nav.pushInActiveTab(
                      ArtistDetailScreen(artistName: a.name, artistModel: a),
                    ),
                  )),
            ],
            if ((_filter == SearchFilter.all || _filter == SearchFilter.playlists) &&
                matchingPlaylists.isNotEmpty) ...[
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text('Playlists',
                    style:
                        TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              ),
              ...matchingPlaylists.map((p) => ListTile(
                    leading: PlaylistCollageArtwork(playlist: p, size: 48),
                    title: Text(p.name,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text('${p.trackCount} songs'),
                    onTap: () => nav.pushInActiveTab(
                      PlaylistDetailScreen(initialPlaylist: p),
                    ),
                  )),
            ],
            if (_filter == SearchFilter.albums && _tracks.isNotEmpty) ...[
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text('Albums',
                    style:
                        TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              ),
              ..._tracks
                  .map((t) => (album: t.album, track: t))
                  .toList()
                  .take(10)
                  .map((item) => ListTile(
                        leading: WavelengthArtwork(
                            imageUrl: item.track.artworkUrl, size: 48),
                        title: Text(item.album,
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(item.track.artist),
                        onTap: () => nav.pushInActiveTab(
                          AlbumDetailScreen(
                            albumTitle: item.album,
                            artistName: item.track.artist,
                            artworkUrl: item.track.artworkUrl,
                            seedTrack: item.track,
                          ),
                        ),
                      )),
            ],
            if (_filter != SearchFilter.artists &&
                _filter != SearchFilter.playlists &&
                _filter != SearchFilter.albums &&
                _tracks.isNotEmpty) ...[
              if (_filter == SearchFilter.all) ...[
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 14, 16, 8),
                  child: Text('Top Result',
                      style:
                          TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Material(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => handler.playTracks(_tracks, startIndex: 0),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            WavelengthArtwork(
                              imageUrl: _tracks.first.artworkUrl,
                              size: 68,
                              borderRadius: 10,
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _tracks.first.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w800),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Song • ${_tracks.first.artist}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: Colors.white70),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.playlist_add_rounded),
                              onPressed: () => showAddToPlaylistSheet(
                                  context, ref, _tracks.first),
                            ),
                            CircleAvatar(
                              backgroundColor: WavelengthColors.emerald,
                              foregroundColor: Colors.black,
                              child: IconButton(
                                icon: const Icon(Icons.play_arrow_rounded),
                                onPressed: () =>
                                    handler.playTracks(_tracks, startIndex: 0),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 16, 16, 6),
                child: Text('Songs',
                    style:
                        TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              ),
              ...List.generate(_tracks.length, (i) {
                final t = _tracks[i];
                return TrackRowTile(
                  track: t,
                  isActive: handler.currentTrack?.id == t.id,
                  isPlaying: handler.isPlaying,
                  isLiked: handler.isTrackLiked(t.id),
                  onTap: () => handler.playTracks(_tracks, startIndex: i),
                  onToggleLike: () async {
                    await handler.toggleLikeTrack(t);
                    ref.read(libraryTickProvider.notifier).bump();
                  },
                  onAddToPlaylist: () => showAddToPlaylistSheet(context, ref, t),
                  onMorePressed: () => showTrackOptionsSheet(context, ref, t),
                );
              }),
            ] else if (!_loading &&
                _tracks.isEmpty &&
                matchingArtists.isEmpty &&
                matchingPlaylists.isEmpty) ...[
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(
                  child: Text(
                    'No matches found. Try checking spelling or switch to the Lyrics filter.',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

enum LibraryFilter { all, playlists, artists, albums, downloads, local }

class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen> {
  LibraryFilter _filter = LibraryFilter.all;
  List<WavelengthTrack> _localAudio = const [];
  bool _scanningLocal = false;

  Future<void> _openCreatePlaylistModal() async {
    final nameCtrl = TextEditingController();
    final searchCtrl = TextEditingController();
    var searchResults = CuratedCatalog.allTracks.take(8).toList();
    final selected = <WavelengthTrack>[];

    final created = await showModalBottomSheet<bool>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setInner) => DraggableScrollableSheet(
          initialChildSize: 0.85,
          minChildSize: 0.55,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, sc) => Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Create Playlist • Add Songs',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                    ),
                    FilledButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      style: FilledButton.styleFrom(
                        backgroundColor: WavelengthColors.emerald,
                        foregroundColor: Colors.black,
                      ),
                      child: Text('Save (${selected.length})'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Playlist Title',
                    hintText: 'e.g. Late Night Vibe',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: searchCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Search songs to include...',
                    prefixIcon: Icon(Icons.search_rounded),
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (q) async {
                    if (q.trim().isEmpty) {
                      setInner(() => searchResults =
                          CuratedCatalog.allTracks.take(8).toList());
                      return;
                    }
                    final res = await ref
                        .read(catalogServiceProvider)
                        .searchTracksRemote(q, limit: 10);
                    setInner(() => searchResults = res.isNotEmpty
                        ? res
                        : FuzzySearchEngine.searchTracks(
                            q, CuratedCatalog.allTracks));
                  },
                ),
                const SizedBox(height: 10),
                Expanded(
                  child: ListView.builder(
                    controller: sc,
                    itemCount: searchResults.length,
                    itemBuilder: (_, idx) {
                      final t = searchResults[idx];
                      final picked = selected.any((s) => s.id == t.id);
                      return CheckboxListTile(
                        value: picked,
                        activeColor: WavelengthColors.emerald,
                        secondary:
                            WavelengthArtwork(imageUrl: t.artworkUrl, size: 42),
                        title: Text(t.title,
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(t.artist,
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        onChanged: (v) {
                          setInner(() {
                            if (v == true) {
                              selected.add(t);
                            } else {
                              selected.removeWhere((s) => s.id == t.id);
                            }
                          });
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (created == true) {
      final pl = await ref.read(databaseProvider).createPlaylist(
            name: nameCtrl.text.trim().isNotEmpty
                ? nameCtrl.text.trim()
                : 'My Favorite Songs',
            initialTracks: selected,
          );
      ref.read(libraryTickProvider.notifier).bump();
      if (selected.isNotEmpty) {
        await ref.read(audioHandlerProvider).playTracks(selected);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Created "${pl.name}"')),
        );
      }
    }
  }

  Future<void> _scanOrPickLocalAudio({bool pickManual = false}) async {
    setState(() => _scanningLocal = true);
    final tracks = pickManual
        ? await LocalAudioScanner.pickLocalAudioFiles()
        : await LocalAudioScanner.scanCommonAudioFolders();
    if (!mounted) return;
    setState(() {
      _localAudio = tracks;
      _scanningLocal = false;
      _filter = LibraryFilter.local;
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    ref.watch(libraryTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final nav = ref.watch(navigationProvider);
    final liked = ref.watch(likedTracksProvider).value ?? const [];
    final playlists = ref.watch(userPlaylistsProvider).value ?? const [];
    final offlineList = ref.watch(offlineTracksProvider).value ?? const [];

    final totalOfflineMb = offlineList.fold<int>(0, (s, e) => s + e.sizeBytes) /
        (1024 * 1024);

    return Scaffold(
      body: ListView(
        controller: nav.tabScrollControllers[2],
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 145),
        children: [
          // Header matching test_mobile_03_library.png
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF9333EA), Color(0xFF4F46E5)],
                  ),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Text('W',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w900)),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Your Library',
                  style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.search_rounded),
                onPressed: () => nav.selectTab(1),
              ),
              IconButton(
                icon: const Icon(Icons.add_rounded, size: 28),
                onPressed: _openCreatePlaylistModal,
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 38,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: LibraryFilter.values.map((f) {
                final label = f == LibraryFilter.downloads
                    ? 'Downloads (${offlineList.length})'
                    : f.name[0].toUpperCase() + f.name.substring(1);
                final selected = _filter == f;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(label),
                    selected: selected,
                    selectedColor: Colors.white,
                    labelStyle: TextStyle(
                      color: selected ? Colors.black : Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 12.5,
                    ),
                    onSelected: (_) {
                      setState(() => _filter = f);
                      if (f == LibraryFilter.local && _localAudio.isEmpty) {
                        _scanOrPickLocalAudio();
                      }
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 14),

          // Exact Glowing Green Banner: "Create Playlist • Add Your Desired Songs"
          InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: _openCreatePlaylistModal,
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    WavelengthColors.emerald.withValues(alpha: 0.2),
                    Theme.of(context).cardColor,
                    Colors.black87,
                  ],
                ),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: WavelengthColors.emerald.withValues(alpha: 0.45),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: WavelengthColors.emerald,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.add_rounded,
                        color: Colors.black, size: 26),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Create Playlist • Add Your Desired Songs',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Search and add any song, singer, or album directly',
                          style: TextStyle(color: Colors.white60, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: Colors.white54),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Second Banner: Import your music from other apps
          InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () => nav.pushInActiveTab(const SpotifyImportScreen()),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: Colors.white10,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.download_rounded,
                        color: WavelengthColors.emerald),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Import your music from other apps',
                          style: TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 14),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Sync Spotify links, CSV backups & local files',
                          style: TextStyle(color: Colors.white60, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: Colors.white54),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          if (_filter == LibraryFilter.all ||
              _filter == LibraryFilter.playlists) ...[
            // Pinned: Liked Songs
            ListTile(
              contentPadding: const EdgeInsets.symmetric(vertical: 4),
              leading: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFFEC4899)],
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.favorite_rounded, color: Colors.white),
              ),
              title: const Text('Liked Songs',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              subtitle: Text('📌 Pinned • ${liked.length} songs'),
              onTap: () => nav.pushInActiveTab(
                PlaylistDetailScreen(
                  initialPlaylist: WavelengthPlaylist(
                    id: 'liked-songs',
                    name: 'Liked Songs',
                    isSystem: true,
                    tracks: liked,
                  ),
                  isLikedSongsCollection: true,
                ),
              ),
            ),
            // Pinned: Downloaded Songs
            ListTile(
              contentPadding: const EdgeInsets.symmetric(vertical: 4),
              leading: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF059669), Color(0xFF115E59)],
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.download_rounded, color: Colors.white),
              ),
              title: const Text('Downloaded Songs',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              subtitle: Text(
                  '📌 Pinned • ${offlineList.length} offline (${totalOfflineMb.toStringAsFixed(1)} MB)'),
              onTap: () => setState(() => _filter = LibraryFilter.downloads),
            ),
            // Sound Stats & Wrapped
            ListTile(
              contentPadding: const EdgeInsets.symmetric(vertical: 4),
              leading: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: WavelengthColors.elevatedDark,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.auto_graph_rounded,
                    color: WavelengthColors.emerald),
              ),
              title: const Text('Sound Stats & Wrapped',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              subtitle: const Text('Top artists, play history & story cards'),
              onTap: () => nav.pushInActiveTab(const StatsAndWrappedScreen()),
            ),
            ...playlists.map((pl) => ListTile(
                  contentPadding: const EdgeInsets.symmetric(vertical: 4),
                  leading: PlaylistCollageArtwork(playlist: pl, size: 56),
                  title: Text(pl.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 15.5)),
                  subtitle: Text('Playlist • ${pl.trackCount} songs'),
                  trailing: IconButton(
                    icon: const Icon(Icons.ios_share_rounded, size: 20),
                    onPressed: () => showShareSheet(context, ref, playlist: pl),
                  ),
                  onTap: () => nav.pushInActiveTab(
                    PlaylistDetailScreen(initialPlaylist: pl),
                  ),
                )),
          ],

          if (_filter == LibraryFilter.all ||
              _filter == LibraryFilter.artists) ...[
            const Padding(
              padding: EdgeInsets.fromLTRB(0, 14, 0, 6),
              child: Text('ARTISTS',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Colors.white54,
                      letterSpacing: 1.1)),
            ),
            ...CuratedCatalog.featuredArtists.take(6).map((a) => ListTile(
                  contentPadding: const EdgeInsets.symmetric(vertical: 4),
                  leading: WavelengthArtwork(
                    imageUrl: a.artworkUrl,
                    localAssetPath: a.localAssetPath,
                    size: 54,
                    isCircular: true,
                  ),
                  title: Text(a.name,
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text('Artist • ${a.monthlyListenersLabel}'),
                  onTap: () => nav.pushInActiveTab(
                    ArtistDetailScreen(artistName: a.name, artistModel: a),
                  ),
                )),
          ],

          if (_filter == LibraryFilter.all ||
              _filter == LibraryFilter.albums) ...[
            const Padding(
              padding: EdgeInsets.fromLTRB(0, 14, 0, 6),
              child: Text('ALBUMS',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Colors.white54,
                      letterSpacing: 1.1)),
            ),
            ...CuratedCatalog.curatedAlbums.map((al) => ListTile(
                  contentPadding: const EdgeInsets.symmetric(vertical: 4),
                  leading: WavelengthArtwork(
                    imageUrl: al.artworkUrl,
                    size: 54,
                    borderRadius: 10,
                  ),
                  title: Text(al.title,
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text('Album • ${al.artist} • ${al.year}'),
                  onTap: () => nav.pushInActiveTab(
                    AlbumDetailScreen(
                      albumTitle: al.title,
                      artistName: al.artist,
                      artworkUrl: al.artworkUrl,
                      initialTracks: al.tracks,
                    ),
                  ),
                )),
          ],

          if (_filter == LibraryFilter.downloads) ...[
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Offline Storage (${offlineList.length} • ${totalOfflineMb.toStringAsFixed(1)} MB)',
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                ),
                if (offlineList.isNotEmpty)
                  TextButton(
                    onPressed: () async {
                      await ref
                          .read(offlineServiceProvider)
                          .clearAllOfflineDownloads();
                      ref.read(libraryTickProvider.notifier).bump();
                    },
                    child: const Text('Clear All'),
                  ),
              ],
            ),
            if (offlineList.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No downloaded songs yet. Open ... on any song or playlist and tap Download Offline.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white60),
                ),
              ),
            ...offlineList.map((entry) => ListTile(
                  leading: WavelengthArtwork(
                      imageUrl: entry.track.artworkUrl, size: 48),
                  title: Text(entry.track.title,
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(
                      '${entry.track.artist} • ${entry.qualityLabel} • ${(entry.sizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB'),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline,
                        color: WavelengthColors.danger),
                    onPressed: () async {
                      await ref
                          .read(offlineServiceProvider)
                          .deleteOfflineTrack(entry.track.id);
                      ref.read(libraryTickProvider.notifier).bump();
                    },
                  ),
                  onTap: () => handler.playTracks(
                    offlineList
                        .where((e) => File(e.localPath).existsSync())
                        .map((e) => e.track)
                        .toList(),
                    startIndex: offlineList.indexOf(entry),
                  ),
                )),
          ],

          if (_filter == LibraryFilter.local) ...[
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _scanningLocal
                        ? null
                        : () => _scanOrPickLocalAudio(pickManual: false),
                    icon: const Icon(Icons.folder_open_rounded),
                    label: const Text('Scan Folders'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _scanningLocal
                        ? null
                        : () => _scanOrPickLocalAudio(pickManual: true),
                    icon: const Icon(Icons.audio_file_rounded),
                    label: const Text('Pick Audio Files'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (_scanningLocal)
              const Center(child: CircularProgressIndicator())
            else if (_localAudio.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Pick FLAC / MP3 / WAV / M4A files directly from phone storage to play.',
                  textAlign: TextAlign.center,
                ),
              )
            else
              ...List.generate(_localAudio.length, (i) {
                final t = _localAudio[i];
                return TrackRowTile(
                  track: t,
                  isActive: handler.currentTrack?.id == t.id,
                  isPlaying: handler.isPlaying,
                  isLiked: handler.isTrackLiked(t.id),
                  isDownloaded: true,
                  onTap: () => handler.playTracks(_localAudio, startIndex: i),
                  onToggleLike: () async {
                    await handler.toggleLikeTrack(t);
                    ref.read(libraryTickProvider.notifier).bump();
                  },
                  onAddToPlaylist: () => showAddToPlaylistSheet(context, ref, t),
                  onMorePressed: () => showTrackOptionsSheet(context, ref, t),
                );
              }),
          ],
        ],
      ),
    );
  }
}
