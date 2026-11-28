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
import 'settings_screen.dart';
import 'spotify_import_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  String _greetingText() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(audioEngineTickProvider);
    ref.watch(libraryTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final nav = ref.watch(navigationProvider);
    final history = ref.watch(historyProvider).value ?? const [];
    final liked = ref.watch(likedTracksProvider).value ?? const [];

    final mixes = CuratedCatalog.generatePersonalizedMixes(
      history.map((h) => h.track).toList(),
      liked,
    );
    final curatedPlaylists = CuratedCatalog.curatedPlaylists;
    final quickGrid = [
      WavelengthPlaylist(
        id: 'liked-songs',
        name: 'Liked Songs',
        description: '${liked.length} favorites',
        isSystem: true,
        trackCount: liked.length,
        tracks: liked,
      ),
      ...mixes.take(2),
      ...curatedPlaylists.take(3),
    ];

    final pausedTrack = handler.currentTrack;
    final showResumeBanner = pausedTrack != null &&
        !handler.isPlaying &&
        handler.position > const Duration(seconds: 2);

    return Scaffold(
      body: CustomScrollView(
        controller: nav.tabScrollControllers[0],
        slivers: [
          SliverAppBar(
            floating: true,
            title: Text(
              _greetingText(),
              style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w800),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.auto_graph_rounded),
                tooltip: 'Sound Stats & Wrapped',
                onPressed: () =>
                    nav.pushInActiveTab(const StatsAndWrappedScreen()),
              ),
              IconButton(
                icon: const Icon(Icons.search_rounded),
                tooltip: 'Search',
                onPressed: () => nav.selectTab(1),
              ),
              IconButton(
                icon: const Icon(Icons.settings_outlined),
                tooltip: 'Settings',
                onPressed: () => nav.pushInActiveTab(const SettingsScreen()),
              ),
            ],
          ),
          if (showResumeBanner)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
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
                          imageUrl: pausedTrack.artworkUrl, size: 48),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'RESUME WHERE YOU LEFT OFF',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: WavelengthColors.emerald,
                                letterSpacing: 0.9,
                              ),
                            ),
                            Text(
                              pausedTrack.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            Text(
                              pausedTrack.artist,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 12, color: Colors.white70),
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
          // Quick 2-column Spotify-style shortcuts grid
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 3.1,
              ),
              delegate: SliverChildBuilderDelegate(
                (ctx, idx) {
                  final item = quickGrid[idx];
                  final isLikedCard = item.id == 'liked-songs';
                  return Material(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(10),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(10),
                      onTap: () => nav.pushInActiveTab(
                        PlaylistDetailScreen(
                          initialPlaylist: item,
                          isLikedSongsCollection: isLikedCard,
                        ),
                      ),
                      child: Row(
                        children: [
                          if (isLikedCard)
                            Container(
                              width: 54,
                              height: double.infinity,
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Color(0xFF4F46E5), Color(0xFF1DB954)],
                                ),
                                borderRadius: BorderRadius.horizontal(
                                    left: Radius.circular(10)),
                              ),
                              child: const Icon(Icons.favorite_rounded,
                                  color: Colors.white, size: 22),
                            )
                          else
                            PlaylistCollageArtwork(
                              playlist: item,
                              size: 54,
                              borderRadius: 10,
                            ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: Text(
                                item.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12.5,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                childCount: quickGrid.length,
              ),
            ),
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
          _HorizontalPlaylistsSection(
            title: 'Charts & Curated Stations',
            playlists: curatedPlaylists,
            onOpen: (pl) => nav.pushInActiveTab(
              PlaylistDetailScreen(initialPlaylist: pl),
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
                final tracks = CuratedCatalog.todayTopHits + CuratedCatalog.bollywoodHits;
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
                  onAddToPlaylist: () => showAddToPlaylistSheet(context, ref, t),
                  onMorePressed: () => showTrackOptionsSheet(context, ref, t),
                );
              },
              childCount:
                  CuratedCatalog.todayTopHits.length +
                  CuratedCatalog.bollywoodHits.length,
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 120)),
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
              style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
            ),
          ),
          SizedBox(
            height: 202,
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
                    width: 142,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        PlaylistCollageArtwork(
                          playlist: pl,
                          size: 142,
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
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
            ),
          ),
          SizedBox(
            height: 158,
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
                    width: 112,
                    child: Column(
                      children: [
                        WavelengthArtwork(
                          imageUrl: a.artworkUrl,
                          localAssetPath: a.localAssetPath,
                          size: 108,
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

    // Immediate instant local fuzzy results!
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
      appBar: AppBar(
        title: const Text('Search',
            style: TextStyle(fontSize: 23, fontWeight: FontWeight.w800)),
      ),
      body: ListView(
        controller: nav.tabScrollControllers[1],
        padding: const EdgeInsets.only(bottom: 120),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
            child: TextField(
              controller: _ctrl,
              textInputAction: TextInputAction.search,
              onChanged: (v) => _onQueryChanged(v),
              onSubmitted: (v) => _onQueryChanged(v, saveHistory: true),
              decoration: InputDecoration(
                hintText: _filter == SearchFilter.lyrics
                    ? 'Type lyrics you remember...'
                    : 'Songs, artists, albums, lyrics...',
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
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
                filled: true,
              ),
            ),
          ),
          SizedBox(
            height: 40,
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
                    selectedColor: WavelengthColors.emerald,
                    labelStyle: TextStyle(
                      color: _filter == f ? Colors.black : null,
                      fontWeight: FontWeight.w600,
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
            // Recent search history
            recentAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
              data: (recent) {
                if (recent.isEmpty) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Recent Searches',
                            style: TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 16),
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
              padding: EdgeInsets.fromLTRB(16, 16, 16, 10),
              child: Text(
                'Browse Categories',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
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
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1.78,
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
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [cat.colorStart, cat.colorEnd],
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              cat.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          WavelengthArtwork(
                            imageUrl: cat.coverUrl,
                            size: 46,
                            borderRadius: 8,
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

enum LibraryFilter { all, playlists, offline, local }

class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen> {
  LibraryFilter _filter = LibraryFilter.all;
  List<WavelengthTrack> _localAudio = const [];
  bool _scanningLocal = false;

  Future<void> _createPlaylistDialog() async {
    final ctrl = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (dCtx) => AlertDialog(
        title: const Text('Create Playlist'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'My Lossless Mix'),
          onSubmitted: (v) => Navigator.pop(dCtx, v),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dCtx),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(dCtx, ctrl.text),
              child: const Text('Create')),
        ],
      ),
    );
    if (name == null || name.trim().isEmpty) return;
    await ref.read(databaseProvider).createPlaylist(name: name.trim());
    ref.read(libraryTickProvider.notifier).bump();
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
    if (tracks.isEmpty && !pickManual) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content:
                Text('No audio found in Music/Downloads; try Pick Files')),
      );
    }
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
      appBar: AppBar(
        title: const Text('Your Library',
            style: TextStyle(fontSize: 23, fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            icon: const Icon(Icons.playlist_add_check_rounded),
            tooltip: 'Import Spotify / CSV',
            onPressed: () => nav.pushInActiveTab(const SpotifyImportScreen()),
          ),
          IconButton(
            icon: const Icon(Icons.add_rounded, size: 28),
            tooltip: 'Create Playlist',
            onPressed: _createPlaylistDialog,
          ),
        ],
      ),
      body: ListView(
        controller: nav.tabScrollControllers[2],
        padding: const EdgeInsets.only(bottom: 120),
        children: [
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                ChoiceChip(
                  label: const Text('All'),
                  selected: _filter == LibraryFilter.all,
                  onSelected: (_) => setState(() => _filter = LibraryFilter.all),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: Text('Playlists (${playlists.length})'),
                  selected: _filter == LibraryFilter.playlists,
                  onSelected: (_) =>
                      setState(() => _filter = LibraryFilter.playlists),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: Text('Offline (${offlineList.length})'),
                  selected: _filter == LibraryFilter.offline,
                  onSelected: (_) =>
                      setState(() => _filter = LibraryFilter.offline),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('Local Audio'),
                  selected: _filter == LibraryFilter.local,
                  onSelected: (_) {
                    setState(() => _filter = LibraryFilter.local);
                    if (_localAudio.isEmpty) _scanOrPickLocalAudio();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          if (_filter == LibraryFilter.all ||
              _filter == LibraryFilter.playlists) ...[
            ListTile(
              leading: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF1DB954)],
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.favorite_rounded, color: Colors.white),
              ),
              title: const Text('Liked Songs',
                  style: TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text('Pinned Playlist • ${liked.length} songs'),
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
            ListTile(
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
                  style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('Top artists, play history & story cards'),
              onTap: () =>
                  nav.pushInActiveTab(const StatsAndWrappedScreen()),
            ),
            ListTile(
              leading: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: WavelengthColors.elevatedDark,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.cloud_download_outlined,
                    color: WavelengthColors.cyanLossless),
              ),
              title: const Text('Import Spotify / CSV / JSON',
                  style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle:
                  const Text('Fuzzy match playlists with manual fix review'),
              onTap: () => nav.pushInActiveTab(const SpotifyImportScreen()),
            ),
            ...playlists.map((pl) => ListTile(
                  leading: PlaylistCollageArtwork(playlist: pl, size: 56),
                  title: Text(pl.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700)),
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
              _filter == LibraryFilter.offline) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 6),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Offline Storage (${offlineList.length} files • ${totalOfflineMb.toStringAsFixed(1)} MB)',
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
            ),
            if (offlineList.isEmpty && _filter == LibraryFilter.offline)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: Text(
                      'No offline downloads yet. Tap ... -> Download Offline on any song or playlist.'),
                ),
              ),
            ...offlineList.map((entry) => ListTile(
                  leading: WavelengthArtwork(
                      imageUrl: entry.track.artworkUrl, size: 48),
                  title: Text(entry.track.title,
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(
                    '${entry.track.artist} • ${entry.qualityLabel} • ${(entry.sizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB',
                  ),
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
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
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
                      label: const Text('Pick Files'),
                    ),
                  ),
                ],
              ),
            ),
            if (_scanningLocal)
              const Center(child: CircularProgressIndicator())
            else if (_localAudio.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: Text(
                    'Pick MP3 / FLAC / WAV / M4A files from your phone to play directly in Wavelength.',
                    textAlign: TextAlign.center,
                  ),
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
