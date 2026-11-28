import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import '../../data/catalog_service.dart';
import '../../state/app_providers.dart';
import '../screens/detail_screens.dart';
import '../widgets/artwork_image.dart';
import 'share_sheet.dart';

Future<void> showAddToPlaylistSheet(
  BuildContext context,
  WidgetRef ref,
  WavelengthTrack track,
) async {
  final db = ref.read(databaseProvider);
  final existingIds = await db.getPlaylistIdsContainingTrack(track.id);
  if (!context.mounted) return;

  await showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    builder: (ctx) => _AddToPlaylistSheetBody(
      track: track,
      initialSelectedIds: existingIds,
      parentContext: context,
    ),
  );
}

class _AddToPlaylistSheetBody extends ConsumerStatefulWidget {
  const _AddToPlaylistSheetBody({
    required this.track,
    required this.initialSelectedIds,
    required this.parentContext,
  });

  final WavelengthTrack track;
  final Set<String> initialSelectedIds;
  final BuildContext parentContext;

  @override
  ConsumerState<_AddToPlaylistSheetBody> createState() =>
      _AddToPlaylistSheetBodyState();
}

class _AddToPlaylistSheetBodyState
    extends ConsumerState<_AddToPlaylistSheetBody> {
  late final Set<String> _selectedIds;
  String _search = '';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _selectedIds = Set<String>.from(widget.initialSelectedIds);
  }

  Future<void> _createNewPlaylist() async {
    final ctrl = TextEditingController(
      text: '${widget.track.title.split(' ').take(3).join(' ')} Mix',
    );
    final createdName = await showDialog<String>(
      context: context,
      builder: (dCtx) => AlertDialog(
        title: const Text('New Playlist'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Playlist name'),
          onSubmitted: (v) => Navigator.pop(dCtx, v),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dCtx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dCtx, ctrl.text),
            child: const Text('Create & Add'),
          ),
        ],
      ),
    );
    if (createdName == null || createdName.trim().isEmpty) return;

    final db = ref.read(databaseProvider);
    final pl = await db.createPlaylist(
      name: createdName.trim(),
      initialTracks: [widget.track],
    );
    ref.read(libraryTickProvider.notifier).bump();
    if (!mounted) return;
    setState(() => _selectedIds.add(pl.id));
    if (widget.parentContext.mounted) {
      ScaffoldMessenger.of(widget.parentContext).showSnackBar(
        SnackBar(content: Text('Added "${widget.track.title}" to "${pl.name}"')),
      );
    }
  }

  Future<void> _saveSelections() async {
    if (_saving) return;
    setState(() => _saving = true);
    final db = ref.read(databaseProvider);
    final addedTo = <String>[];
    final removedFrom = <String>[];

    for (final id in _selectedIds) {
      if (!widget.initialSelectedIds.contains(id)) {
        await db.addTracksToPlaylist(id, [widget.track]);
        addedTo.add(id);
      }
    }
    for (final id in widget.initialSelectedIds) {
      if (!_selectedIds.contains(id)) {
        await db.removeTrackFromPlaylist(id, widget.track.id);
        removedFrom.add(id);
      }
    }

    ref.read(libraryTickProvider.notifier).bump();
    if (!mounted) return;
    Navigator.of(context).pop();

    if ((addedTo.isNotEmpty || removedFrom.isNotEmpty) &&
        widget.parentContext.mounted) {
      ScaffoldMessenger.of(widget.parentContext).showSnackBar(
        SnackBar(
          content: Text(
            addedTo.isNotEmpty
                ? 'Updated playlists (+${addedTo.length})'
                : 'Removed from ${removedFrom.length} playlist(s)',
          ),
          action: SnackBarAction(
            label: 'Undo',
            onPressed: () async {
              for (final id in addedTo) {
                await db.removeTrackFromPlaylist(id, widget.track.id);
              }
              for (final id in removedFrom) {
                await db.addTracksToPlaylist(id, [widget.track]);
              }
              ref.read(libraryTickProvider.notifier).bump();
            },
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final playlistsAsync = ref.watch(userPlaylistsProvider);
    return DraggableScrollableSheet(
      initialChildSize: 0.62,
      minChildSize: 0.42,
      maxChildSize: 0.9,
      expand: false,
      builder: (_, scrollCtrl) {
        return Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
              child: Row(
                children: [
                  WavelengthArtwork(
                    imageUrl: widget.track.artworkUrl,
                    size: 44,
                    borderRadius: 6,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Add to Playlist',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                        ),
                        Text(
                          widget.track.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  FilledButton(
                    onPressed: _saving ? null : _saveSelections,
                    style: FilledButton.styleFrom(
                      backgroundColor: WavelengthColors.emerald,
                      foregroundColor: Colors.black,
                    ),
                    child: const Text('Done'),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton.icon(
                  onPressed: _createNewPlaylist,
                  icon: const Icon(Icons.add_rounded),
                  label: const Text('New Playlist'),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Find playlist',
                  prefixIcon: const Icon(Icons.search),
                  isDense: true,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                ),
                onChanged: (v) => setState(() => _search = v.trim().toLowerCase()),
              ),
            ),
            Expanded(
              child: playlistsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error loading playlists: $e')),
                data: (playlists) {
                  final filtered = playlists
                      .where((p) =>
                          _search.isEmpty || p.name.toLowerCase().contains(_search))
                      .toList();
                  if (filtered.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'No playlists yet — tap "New Playlist" above.',
                          textAlign: TextAlign.center,
                        ),
                      ),
                    );
                  }
                  return ListView.builder(
                    controller: scrollCtrl,
                    itemCount: filtered.length,
                    itemBuilder: (_, idx) {
                      final pl = filtered[idx];
                      final checked = _selectedIds.contains(pl.id);
                      return CheckboxListTile(
                        value: checked,
                        activeColor: WavelengthColors.emerald,
                        controlAffinity: ListTileControlAffinity.trailing,
                        secondary: PlaylistCollageArtwork(playlist: pl, size: 48),
                        title: Text(pl.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text('${pl.trackCount} songs'),
                        onChanged: (v) {
                          setState(() {
                            if (v == true) {
                              _selectedIds.add(pl.id);
                            } else {
                              _selectedIds.remove(pl.id);
                            }
                          });
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}

Future<void> showTrackOptionsSheet(
  BuildContext context,
  WidgetRef ref,
  WavelengthTrack track, {
  String? currentPlaylistId,
}) async {
  final handler = ref.read(audioHandlerProvider);
  final db = ref.read(databaseProvider);
  final nav = ref.read(navigationProvider);
  final offlineSvc = ref.read(offlineServiceProvider);
  final existingOfflinePath = await db.getOfflineFilePath(track.id);
  final isDownloaded = existingOfflinePath != null;

  if (!context.mounted) return;
  await showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    builder: (ctx) {
      final isLiked = handler.isTrackLiked(track.id);
      return SafeArea(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              ListTile(
                leading: WavelengthArtwork(imageUrl: track.artworkUrl, size: 50),
                title: Text(
                  track.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: Text('${track.artist} • ${track.album}',
                    maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.playlist_add_rounded),
                title: const Text('Add to playlist'),
                onTap: () {
                  Navigator.pop(ctx);
                  showAddToPlaylistSheet(context, ref, track);
                },
              ),
              ListTile(
                leading: Icon(
                  isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  color: isLiked ? WavelengthColors.emerald : null,
                ),
                title: Text(isLiked ? 'Remove from Liked Songs' : 'Like song'),
                onTap: () async {
                  Navigator.pop(ctx);
                  final nowLiked = await handler.toggleLikeTrack(track);
                  ref.read(libraryTickProvider.notifier).bump();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          nowLiked ? 'Added to Liked Songs' : 'Removed from Liked Songs',
                        ),
                      ),
                    );
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.queue_play_next_rounded),
                title: const Text('Play next'),
                onTap: () {
                  handler.playNext(track);
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Playing "${track.title}" next')),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.add_to_queue_rounded),
                title: const Text('Add to queue'),
                onTap: () {
                  handler.addToQueue(track);
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Added "${track.title}" to queue')),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.radio_rounded),
                title: const Text('Go to Song Radio'),
                onTap: () async {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Building Song Radio...')),
                  );
                  final radio = await CatalogService(db: db).buildSongRadio(track);
                  await handler.playTracks([track, ...radio]);
                },
              ),
              ListTile(
                leading: Icon(
                  isDownloaded
                      ? Icons.download_done_rounded
                      : Icons.download_for_offline_outlined,
                  color: isDownloaded ? WavelengthColors.emerald : null,
                ),
                title: Text(isDownloaded ? 'Remove Offline Download' : 'Download Offline'),
                onTap: () async {
                  Navigator.pop(ctx);
                  if (isDownloaded) {
                    await offlineSvc.deleteOfflineTrack(track.id);
                    ref.read(libraryTickProvider.notifier).bump();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Removed offline download')),
                      );
                    }
                  } else {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Downloading "${track.title}"...')),
                      );
                    }
                    try {
                      await offlineSvc.downloadTrack(
                        track,
                        handler.quality,
                        outputDevice: handler.outputDevice,
                      );
                      ref.read(libraryTickProvider.notifier).bump();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Saved "${track.title}" for offline playback')),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Download failed: $e')),
                        );
                      }
                    }
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.person_outline_rounded),
                title: const Text('Go to artist'),
                onTap: () {
                  Navigator.pop(ctx);
                  nav.pushInActiveTab(ArtistDetailScreen(artistName: track.artist));
                },
              ),
              ListTile(
                leading: const Icon(Icons.album_outlined),
                title: const Text('Go to album'),
                onTap: () {
                  Navigator.pop(ctx);
                  nav.pushInActiveTab(
                    AlbumDetailScreen(
                      albumTitle: track.album,
                      artistName: track.artist,
                      artworkUrl: track.artworkUrl,
                      seedTrack: track,
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.info_outline_rounded),
                title: const Text('Song credits & audio specs'),
                onTap: () {
                  Navigator.pop(ctx);
                  showDialog<void>(
                    context: context,
                    builder: (dCtx) => AlertDialog(
                      title: Text(track.title),
                      content: Text(
                        'Artist: ${track.artist}\n'
                        'Album: ${track.album}\n'
                        'Source: ${track.source}\n'
                        'Credits: ${track.credits ?? 'Metadata courtesy of iTunes / JioSaavn / Jamendo'}\n'
                        'Quality: ${track.qualityDetails?.badgeLabel ?? handler.quality.subtitle}',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(dCtx),
                          child: const Text('Close'),
                        ),
                      ],
                    ),
                  );
                },
              ),
              if (currentPlaylistId != null)
                ListTile(
                  leading: const Icon(Icons.remove_circle_outline,
                      color: WavelengthColors.danger),
                  title: const Text('Remove from this playlist',
                      style: TextStyle(color: WavelengthColors.danger)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    await db.removeTrackFromPlaylist(currentPlaylistId, track.id);
                    ref.read(libraryTickProvider.notifier).bump();
                  },
                ),
              ListTile(
                leading: const Icon(Icons.ios_share_rounded),
                title: const Text('Share'),
                onTap: () {
                  Navigator.pop(ctx);
                  showShareSheet(context, ref, track: track);
                },
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      );
    },
  );
}
