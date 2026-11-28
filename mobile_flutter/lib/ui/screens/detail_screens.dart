import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/fuzzy_search.dart';
import '../../core/models.dart';
import '../../core/palette_extractor.dart';
import '../../core/theme.dart';
import '../../data/catalog_service.dart';
import '../../data/curated_catalog.dart';
import '../../state/app_providers.dart';
import '../modals/add_to_playlist_sheet.dart';
import '../modals/share_sheet.dart';
import '../widgets/artwork_image.dart';

class PlaylistDetailScreen extends ConsumerStatefulWidget {
  const PlaylistDetailScreen({
    super.key,
    required this.initialPlaylist,
    this.isLikedSongsCollection = false,
  });

  final WavelengthPlaylist initialPlaylist;
  final bool isLikedSongsCollection;

  @override
  ConsumerState<PlaylistDetailScreen> createState() =>
      _PlaylistDetailScreenState();
}

class _PlaylistDetailScreenState extends ConsumerState<PlaylistDetailScreen> {
  late WavelengthPlaylist _playlist;
  ExtractedPalette _palette = ArtworkPaletteExtractor.fallbackFor('playlist');

  @override
  void initState() {
    super.initState();
    _playlist = widget.initialPlaylist;
    _loadPalette();
  }

  Future<void> _loadPalette() async {
    final p = await ArtworkPaletteExtractor.fromUrl(
      _playlist.artworkUrl,
      fallbackSeed: _playlist.name,
    );
    if (mounted) setState(() => _palette = p);
  }

  Future<void> _renameOrEditPlaylist() async {
    final nameCtrl = TextEditingController(text: _playlist.name);
    final descCtrl = TextEditingController(text: _playlist.description);
    var isPublic = _playlist.isPublic;
    final saved = await showDialog<bool>(
      context: context,
      builder: (dCtx) => StatefulBuilder(
        builder: (dCtx, setInner) => AlertDialog(
          title: const Text('Edit Playlist'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: descCtrl,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Public / Shareable'),
                value: isPublic,
                onChanged: (v) => setInner(() => isPublic = v),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dCtx, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dCtx, true),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
    if (saved == true && nameCtrl.text.trim().isNotEmpty) {
      await ref.read(databaseProvider).updatePlaylistMeta(
            _playlist.id,
            name: nameCtrl.text,
            description: descCtrl.text,
            isPublic: isPublic,
          );
      ref.read(libraryTickProvider.notifier).bump();
      final updated =
          await ref.read(databaseProvider).getPlaylistById(_playlist.id);
      if (updated != null && mounted) setState(() => _playlist = updated);
    }
  }

  Future<void> _downloadPlaylistOffline(List<WavelengthTrack> tracks) async {
    final offline = ref.read(offlineServiceProvider);
    final handler = ref.read(audioHandlerProvider);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Downloading ${tracks.length} tracks offline...')),
    );
    var done = 0;
    for (final t in tracks) {
      try {
        await offline.downloadTrack(
          t,
          handler.quality,
          outputDevice: handler.outputDevice,
        );
        done++;
      } catch (_) {}
    }
    ref.read(libraryTickProvider.notifier).bump();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Saved $done/${tracks.length} tracks offline')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(libraryTickProvider);
    ref.watch(audioEngineTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final userPls = ref.watch(userPlaylistsProvider).value ?? const [];
    final likedAsync = ref.watch(likedTracksProvider);

    final isEditable = !widget.isLikedSongsCollection && !_playlist.isSystem;
    if (isEditable) {
      final match = userPls.where((p) => p.id == _playlist.id).firstOrNull;
      if (match != null) _playlist = match;
    }

    final tracks = widget.isLikedSongsCollection
        ? (likedAsync.value ?? _playlist.tracks)
        : _playlist.tracks;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 270,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                _playlist.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [_palette.accent, _palette.backgroundBottom],
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 12),
                      if (widget.isLikedSongsCollection)
                        Container(
                          width: 136,
                          height: 136,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF4F46E5), Color(0xFF1DB954)],
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.favorite_rounded,
                            color: Colors.white,
                            size: 62,
                          ),
                        )
                      else
                        PlaylistCollageArtwork(
                          playlist: _playlist.copyWith(tracks: tracks),
                          size: 136,
                          borderRadius: 14,
                        ),
                      const SizedBox(height: 36),
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.download_for_offline_outlined),
                tooltip: 'Download all offline',
                onPressed: tracks.isEmpty
                    ? null
                    : () => _downloadPlaylistOffline(tracks),
              ),
              IconButton(
                icon: const Icon(Icons.ios_share_rounded),
                tooltip: 'Share playlist',
                onPressed: () => showShareSheet(
                  context,
                  ref,
                  playlist: _playlist.copyWith(tracks: tracks),
                ),
              ),
              if (isEditable)
                PopupMenuButton<String>(
                  onSelected: (v) async {
                    if (v == 'edit') {
                      await _renameOrEditPlaylist();
                    } else if (v == 'delete') {
                      await ref
                          .read(databaseProvider)
                          .deletePlaylist(_playlist.id);
                      ref.read(libraryTickProvider.notifier).bump();
                      if (context.mounted) Navigator.pop(context);
                    }
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(value: 'edit', child: Text('Edit details')),
                    PopupMenuItem(
                      value: 'delete',
                      child: Text('Delete playlist',
                          style: TextStyle(color: WavelengthColors.danger)),
                    ),
                  ],
                ),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_playlist.description.isNotEmpty)
                    Text(
                      _playlist.description,
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  const SizedBox(height: 6),
                  Text(
                    '${tracks.length} songs${isEditable ? (_playlist.isPublic ? ' • Public' : ' • Private') : ''}',
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: tracks.isEmpty
                              ? null
                              : () => handler.playTracks(tracks, startIndex: 0),
                          style: FilledButton.styleFrom(
                            backgroundColor: WavelengthColors.emerald,
                            foregroundColor: Colors.black,
                            minimumSize: const Size(0, 48),
                          ),
                          icon: const Icon(Icons.play_arrow_rounded),
                          label: const Text('Play',
                              style: TextStyle(fontWeight: FontWeight.w800)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: tracks.isEmpty
                              ? null
                              : () async {
                                  if (!handler.shuffleEnabled) {
                                    await handler.toggleShuffle();
                                  }
                                  await handler.playTracks(tracks, startIndex: 0);
                                },
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(0, 48),
                          ),
                          icon: const Icon(Icons.shuffle_rounded),
                          label: const Text('Shuffle'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (tracks.isEmpty)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'No songs in this collection yet.\nTap + on any song to add it here.',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            )
          else if (isEditable)
            SliverReorderableList(
              itemCount: tracks.length,
              onReorder: (oldIndex, newIndex) async {
                await ref
                    .read(databaseProvider)
                    .reorderPlaylistTrack(_playlist.id, oldIndex, newIndex);
                ref.read(libraryTickProvider.notifier).bump();
              },
              itemBuilder: (ctx, idx) {
                final t = tracks[idx];
                return ReorderableDelayedDragStartListener(
                  key: ValueKey('pl_${_playlist.id}_${t.id}_$idx'),
                  index: idx,
                  child: TrackRowTile(
                    track: t,
                    indexBadge: idx + 1,
                    isActive: handler.currentTrack?.id == t.id,
                    isPlaying: handler.isPlaying,
                    isLiked: handler.isTrackLiked(t.id),
                    onTap: () => handler.playTracks(tracks, startIndex: idx),
                    onToggleLike: () async {
                      await handler.toggleLikeTrack(t);
                      ref.read(libraryTickProvider.notifier).bump();
                    },
                    onAddToPlaylist: () => showAddToPlaylistSheet(context, ref, t),
                    onMorePressed: () => showTrackOptionsSheet(
                      context,
                      ref,
                      t,
                      currentPlaylistId: _playlist.id,
                    ),
                  ),
                );
              },
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (ctx, idx) {
                  final t = tracks[idx];
                  return TrackRowTile(
                    track: t,
                    indexBadge: idx + 1,
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
                childCount: tracks.length,
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 110)),
        ],
      ),
    );
  }
}

class AlbumDetailScreen extends ConsumerStatefulWidget {
  const AlbumDetailScreen({
    super.key,
    required this.albumTitle,
    required this.artistName,
    required this.artworkUrl,
    this.seedTrack,
    this.initialTracks = const [],
  });

  final String albumTitle;
  final String artistName;
  final String artworkUrl;
  final WavelengthTrack? seedTrack;
  final List<WavelengthTrack> initialTracks;

  @override
  ConsumerState<AlbumDetailScreen> createState() => _AlbumDetailScreenState();
}

class _AlbumDetailScreenState extends ConsumerState<AlbumDetailScreen> {
  List<WavelengthTrack> _tracks = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAlbumTracks();
  }

  Future<void> _loadAlbumTracks() async {
    if (widget.initialTracks.isNotEmpty) {
      setState(() {
        _tracks = widget.initialTracks;
        _loading = false;
      });
      return;
    }
    final localMatches = CuratedCatalog.allTracks
        .where((t) =>
            FuzzySearchEngine.normalize(t.album) ==
            FuzzySearchEngine.normalize(widget.albumTitle))
        .toList();
    final remote = await ref
        .read(catalogServiceProvider)
        .searchTracksRemote('${widget.albumTitle} ${widget.artistName}', limit: 15);
    final albumMatches = remote
        .where((t) =>
            FuzzySearchEngine.similarityScore(widget.albumTitle, t.album) >=
            0.55)
        .toList();

    final merged = <String, WavelengthTrack>{};
    if (widget.seedTrack != null) merged[widget.seedTrack!.id] = widget.seedTrack!;
    for (final t in [...localMatches, ...albumMatches]) {
      merged.putIfAbsent(t.id, () => t);
    }
    if (mounted) {
      setState(() {
        _tracks = merged.isNotEmpty ? merged.values.toList() : remote;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    final handler = ref.watch(audioHandlerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(widget.albumTitle)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.only(bottom: 110),
              children: [
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      WavelengthArtwork(
                        imageUrl: widget.artworkUrl,
                        size: 180,
                        borderRadius: 16,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.albumTitle,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontSize: 22, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 6),
                      TextButton(
                        onPressed: () {
                          ref.read(navigationProvider).pushInActiveTab(
                                ArtistDetailScreen(artistName: widget.artistName),
                              );
                        },
                        child: Text(widget.artistName),
                      ),
                      const SizedBox(height: 10),
                      FilledButton.icon(
                        onPressed: _tracks.isEmpty
                            ? null
                            : () => handler.playTracks(_tracks),
                        style: FilledButton.styleFrom(
                          backgroundColor: WavelengthColors.emerald,
                          foregroundColor: Colors.black,
                          minimumSize: const Size(200, 48),
                        ),
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: const Text('Play Album'),
                      ),
                    ],
                  ),
                ),
                ...List.generate(_tracks.length, (i) {
                  final t = _tracks[i];
                  return TrackRowTile(
                    track: t,
                    indexBadge: i + 1,
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
              ],
            ),
    );
  }
}

class ArtistDetailScreen extends ConsumerStatefulWidget {
  const ArtistDetailScreen({
    super.key,
    required this.artistName,
    this.artistModel,
  });

  final String artistName;
  final WavelengthArtist? artistModel;

  @override
  ConsumerState<ArtistDetailScreen> createState() => _ArtistDetailScreenState();
}

class _ArtistDetailScreenState extends ConsumerState<ArtistDetailScreen> {
  List<WavelengthTrack> _tracks = const [];
  bool _loading = true;
  late final WavelengthArtist? _matchedArtist;

  @override
  void initState() {
    super.initState();
    _matchedArtist = widget.artistModel ??
        CuratedCatalog.featuredArtists
            .where((a) =>
                FuzzySearchEngine.similarityScore(widget.artistName, a.name) >=
                0.7)
            .firstOrNull;
    _loadArtistTracks();
  }

  Future<void> _loadArtistTracks() async {
    final local = CuratedCatalog.allTracks
        .where((t) =>
            FuzzySearchEngine.similarityScore(widget.artistName, t.artist) >=
            0.5)
        .toList();
    final remote = await ref
        .read(catalogServiceProvider)
        .searchTracksRemote(widget.artistName, limit: 20);
    final map = <String, WavelengthTrack>{};
    for (final t in [...local, ...remote]) {
      map.putIfAbsent(t.id, () => t);
    }
    if (mounted) {
      setState(() {
        _tracks = map.values.toList();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    final handler = ref.watch(audioHandlerProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                _matchedArtist?.name ?? widget.artistName,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              background: Stack(
                fit: StackFit.expand,
                children: [
                  if (_matchedArtist?.localAssetPath != null)
                    Image.asset(_matchedArtist!.localAssetPath!, fit: BoxFit.cover)
                  else
                    WavelengthArtwork(
                      imageUrl: _tracks.isNotEmpty ? _tracks.first.artworkUrl : '',
                      size: 240,
                      borderRadius: 0,
                    ),
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, WavelengthColors.bgDark],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_matchedArtist != null) ...[
                    Text(
                      _matchedArtist.monthlyListenersLabel,
                      style: const TextStyle(
                        color: WavelengthColors.emerald,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(_matchedArtist.bio,
                        style: const TextStyle(color: Colors.white70)),
                    const SizedBox(height: 12),
                  ],
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _tracks.isEmpty
                              ? null
                              : () => handler.playTracks(_tracks),
                          style: FilledButton.styleFrom(
                            backgroundColor: WavelengthColors.emerald,
                            foregroundColor: Colors.black,
                            minimumSize: const Size(0, 48),
                          ),
                          icon: const Icon(Icons.play_arrow_rounded),
                          label: const Text('Play Popular'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _tracks.isEmpty
                              ? null
                              : () async {
                                  final radio = await CatalogService(
                                    db: ref.read(databaseProvider),
                                  ).buildSongRadio(_tracks.first);
                                  await handler.playTracks([_tracks.first, ...radio]);
                                },
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(0, 48),
                          ),
                          icon: const Icon(Icons.radio_rounded),
                          label: const Text('Artist Radio'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (_loading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (ctx, idx) {
                  final t = _tracks[idx];
                  return TrackRowTile(
                    track: t,
                    indexBadge: idx + 1,
                    isActive: handler.currentTrack?.id == t.id,
                    isPlaying: handler.isPlaying,
                    isLiked: handler.isTrackLiked(t.id),
                    onTap: () => handler.playTracks(_tracks, startIndex: idx),
                    onToggleLike: () async {
                      await handler.toggleLikeTrack(t);
                      ref.read(libraryTickProvider.notifier).bump();
                    },
                    onAddToPlaylist: () => showAddToPlaylistSheet(context, ref, t),
                    onMorePressed: () => showTrackOptionsSheet(context, ref, t),
                  );
                },
                childCount: _tracks.length,
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 110)),
        ],
      ),
    );
  }
}

class StatsAndWrappedScreen extends ConsumerWidget {
  const StatsAndWrappedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(statsSummaryProvider);
    final historyAsync = ref.watch(historyProvider);
    final handler = ref.watch(audioHandlerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Your Sound Stats & Wrapped')),
      body: statsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load stats: $e')),
        data: (stats) {
          final history = historyAsync.value ?? const [];
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 110),
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1DB954), Color(0xFF0F172A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ON-DEVICE WRAPPED',
                      style: TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.4,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '${stats.totalPlays} Plays • ${stats.totalMinutes} Minutes',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${stats.uniqueTracks} unique songs explored completely privately on this phone.',
                      style: const TextStyle(color: Colors.white70),
                    ),
                    if (stats.topTracks.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      FilledButton.icon(
                        onPressed: () => showShareSheet(
                          context,
                          ref,
                          track: stats.topTracks.first.track,
                          highlightedLyric:
                              'My #1 song on Wavelength (${stats.topTracks.first.plays} plays)',
                        ),
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.black87,
                          foregroundColor: Colors.white,
                        ),
                        icon: const Icon(Icons.ios_share_rounded),
                        label: const Text('Share Top Song Card'),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Top Artists',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              if (stats.topArtists.isEmpty)
                const Text('Play a few songs to see your artist breakdown.')
              else
                ...stats.topArtists.asMap().entries.map((entry) {
                  final rank = entry.key + 1;
                  final a = entry.value;
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: WavelengthColors.emerald,
                      foregroundColor: Colors.black,
                      child: Text('#$rank',
                          style: const TextStyle(fontWeight: FontWeight.w800)),
                    ),
                    title: Text(a.artist,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    trailing: Text('${a.plays} plays'),
                  );
                }),
              const SizedBox(height: 20),
              const Text(
                'Recently Played',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              ...history.take(20).map((h) => TrackRowTile(
                    track: h.track,
                    isActive: handler.currentTrack?.id == h.track.id,
                    isPlaying: handler.isPlaying,
                    isLiked: handler.isTrackLiked(h.track.id),
                    onTap: () => handler.playTracks([h.track]),
                    onToggleLike: () async {
                      await handler.toggleLikeTrack(h.track);
                      ref.read(libraryTickProvider.notifier).bump();
                    },
                    onAddToPlaylist: () =>
                        showAddToPlaylistSheet(context, ref, h.track),
                    onMorePressed: () =>
                        showTrackOptionsSheet(context, ref, h.track),
                  )),
            ],
          );
        },
      ),
    );
  }
}
