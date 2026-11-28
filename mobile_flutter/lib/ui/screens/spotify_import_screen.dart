import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import '../../state/app_providers.dart';
import '../widgets/artwork_image.dart';

class SpotifyImportScreen extends ConsumerStatefulWidget {
  const SpotifyImportScreen({super.key, this.initialInput});

  final String? initialInput;

  @override
  ConsumerState<SpotifyImportScreen> createState() =>
      _SpotifyImportScreenState();
}

class _SpotifyImportScreenState extends ConsumerState<SpotifyImportScreen> {
  late final TextEditingController _inputCtrl;
  final TextEditingController _nameCtrl = TextEditingController();
  SpotifyImportResult? _result;
  List<ImportTrackCandidate> _candidates = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _inputCtrl = TextEditingController(text: widget.initialInput ?? '');
    if ((widget.initialInput ?? '').contains('spotify')) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _runImport());
    }
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _runImport() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final svc = ref.read(spotifyImportProvider);
      final isSpotifyUrl =
          text.contains('open.spotify.com/') || text.startsWith('spotify:');
      final res = isSpotifyUrl
          ? await svc.importFromSpotifyLink(text)
          : await svc.importFromExportText(text);
      if (!mounted) return;
      setState(() {
        _result = res;
        _candidates = List<ImportTrackCandidate>.from(res.candidates);
        _nameCtrl.text = res.playlistTitle;
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  Future<void> _pickExportFile() async {
    final file = await FilePicker.pickFile(
      type: FileType.custom,
      allowedExtensions: const ['csv', 'json', 'txt'],
    );
    if (file == null) return;
    final path = file.path;
    if (path == null) return;
    final raw = await File(path).readAsString();

    if (file.name.toLowerCase().endsWith('.json') &&
        raw.contains('"playlists"') &&
        raw.contains('"schemaVersion"')) {
      final restored =
          await ref.read(databaseProvider).importLibraryBackupJson(raw);
      ref.read(libraryTickProvider.notifier).bump();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Restored ${restored.playlistsImported} playlists & ${restored.likesAdded} likes from Wavelength backup',
            ),
          ),
        );
      }
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final imported = await ref.read(spotifyImportProvider).importFromExportText(
            raw,
            fileName: file.name,
          );
      if (mounted) {
        setState(() {
          _result = imported;
          _candidates = List<ImportTrackCandidate>.from(imported.candidates);
          _nameCtrl.text = imported.playlistTitle;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  Future<void> _manualFixCandidate(int index) async {
    final cand = _candidates[index];
    final qCtrl =
        TextEditingController(text: '${cand.sourceTitle} ${cand.sourceArtist}');
    final catalog = ref.read(catalogServiceProvider);
    var results = await catalog.searchTracksRemote(qCtrl.text, limit: 8);
    if (!mounted) return;

    await showDialog<void>(
      context: context,
      builder: (dCtx) => StatefulBuilder(
        builder: (dCtx, setInner) => AlertDialog(
          title: Text('Fix "${cand.sourceTitle}"'),
          content: SizedBox(
            width: 340,
            height: 360,
            child: Column(
              children: [
                TextField(
                  controller: qCtrl,
                  decoration: InputDecoration(
                    hintText: 'Search alternative recording',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.search),
                      onPressed: () async {
                        final fresh =
                            await catalog.searchTracksRemote(qCtrl.text, limit: 8);
                        setInner(() => results = fresh);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Expanded(
                  child: ListView.builder(
                    itemCount: results.length,
                    itemBuilder: (_, rIdx) {
                      final t = results[rIdx];
                      return ListTile(
                        leading: WavelengthArtwork(imageUrl: t.artworkUrl, size: 40),
                        title: Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(t.artist, maxLines: 1, overflow: TextOverflow.ellipsis),
                        onTap: () {
                          setState(() {
                            _candidates[index] = cand.copyWith(
                              matchedTrack: t,
                              confidence: 1.0,
                              status: ImportMatchStatus.matched,
                            );
                          });
                          Navigator.pop(dCtx);
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
  }

  Future<void> _saveToLibrary() async {
    final matched = _candidates
        .where((c) => c.matchedTrack != null)
        .map((c) => c.matchedTrack!)
        .toList();
    if (matched.isEmpty) return;

    final pl = await ref.read(databaseProvider).createPlaylist(
          name: _nameCtrl.text.trim().isNotEmpty
              ? _nameCtrl.text.trim()
              : 'Imported Playlist',
          description: 'Imported into Wavelength',
          artworkUrl: _result?.artworkUrl ?? '',
          initialTracks: matched,
        );
    ref.read(libraryTickProvider.notifier).bump();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Created "${pl.name}" with ${matched.length} songs'),
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final matchedCount =
        _candidates.where((c) => c.matchedTrack != null).length;

    return Scaffold(
      appBar: AppBar(title: const Text('Import Playlist & Backups')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 110),
        children: [
          const Text(
            'Paste a Spotify link, Exportify CSV/JSON, or Song - Artist lines',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _inputCtrl,
            maxLines: 4,
            decoration: InputDecoration(
              hintText:
                  'https://open.spotify.com/playlist/...\nOR one "Song Title - Artist" per line',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              filled: true,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: _loading ? null : _runImport,
                  style: FilledButton.styleFrom(
                    backgroundColor: WavelengthColors.emerald,
                    foregroundColor: Colors.black,
                    minimumSize: const Size(0, 48),
                  ),
                  icon: const Icon(Icons.cloud_sync_rounded),
                  label: const Text('Fetch & Match'),
                ),
              ),
              const SizedBox(width: 10),
              OutlinedButton.icon(
                onPressed: _loading ? null : _pickExportFile,
                style: OutlinedButton.styleFrom(minimumSize: const Size(0, 48)),
                icon: const Icon(Icons.upload_file_rounded),
                label: const Text('CSV / JSON'),
              ),
            ],
          ),
          if (_loading) ...[
            const SizedBox(height: 20),
            const Center(child: CircularProgressIndicator()),
            const SizedBox(height: 8),
            const Center(
              child: Text('Matching tracks across Wavelength free providers...'),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: WavelengthColors.danger)),
          ],
          if (_result != null) ...[
            const SizedBox(height: 18),
            if (_result!.limitationsNote != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: WavelengthColors.elevatedDark,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _result!.limitationsNote!,
                  style: const TextStyle(fontSize: 12, color: Colors.white70),
                ),
              ),
            TextField(
              controller: _nameCtrl,
              decoration: const InputDecoration(
                labelText: 'New Playlist Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: matchedCount == 0 ? null : _saveToLibrary,
              style: FilledButton.styleFrom(
                backgroundColor: WavelengthColors.emerald,
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 48),
              ),
              icon: const Icon(Icons.check_circle_outline),
              label: Text(
                'Save Playlist ($matchedCount / ${_candidates.length} matched)',
              ),
            ),
            const SizedBox(height: 14),
            ..._candidates.asMap().entries.map((entry) {
              final idx = entry.key;
              final c = entry.value;
              final color = switch (c.status) {
                ImportMatchStatus.matched => WavelengthColors.emerald,
                ImportMatchStatus.lowConfidence => WavelengthColors.amberHiRes,
                ImportMatchStatus.unmatched => WavelengthColors.danger,
              };
              final statusLabel = switch (c.status) {
                ImportMatchStatus.matched => 'Matched',
                ImportMatchStatus.lowConfidence => 'Verify',
                ImportMatchStatus.unmatched => 'Unmatched',
              };
              return ListTile(
                leading: WavelengthArtwork(
                  imageUrl: c.matchedTrack?.artworkUrl ?? '',
                  size: 46,
                ),
                title: Text(
                  c.matchedTrack?.title ?? c.sourceTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  c.matchedTrack != null
                      ? '${c.matchedTrack!.artist} (${(c.confidence * 100).round()}%)'
                      : 'Source: ${c.sourceArtist}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: TextButton(
                  onPressed: () => _manualFixCandidate(idx),
                  child: Text(
                    c.status == ImportMatchStatus.matched ? statusLabel : 'Pick Match',
                    style: TextStyle(color: color, fontWeight: FontWeight.w700),
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}
