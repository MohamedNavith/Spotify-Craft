import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import '../../data/curated_catalog.dart';
import '../../state/app_providers.dart';
import '../modals/equalizer_and_timer_sheets.dart';
import '../widgets/artwork_image.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final TextEditingController _customArtistCtrl = TextEditingController();

  @override
  void dispose() {
    _customArtistCtrl.dispose();
    super.dispose();
  }

  Future<void> _exportLibraryBackup() async {
    final jsonStr = await ref.read(databaseProvider).exportLibraryBackupJson();
    final dir = await getTemporaryDirectory();
    final file = File(p.join(dir.path, 'wavelength_library_backup.json'));
    await file.writeAsString(jsonStr);
    await SharePlus.instance.share(
      ShareParams(
        files: [XFile(file.path)],
        text: 'Wavelength Library Backup (playlists & likes)',
      ),
    );
  }

  Future<void> _selectQualityTier(StreamQuality next) async {
    final handler = ref.read(audioHandlerProvider);
    if ((next == StreamQuality.lossless ||
            next == StreamQuality.hiResLossless) &&
        handler.quality != next) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (dCtx) => AlertDialog(
          backgroundColor: const Color(0xFF1C1C1E),
          icon: const Icon(
            Icons.warning_amber_rounded,
            color: WavelengthColors.amberHiRes,
            size: 38,
          ),
          title: Text('Turn On ${next.label}?'),
          content: Text(
            'Lossless streams consume up to ${next == StreamQuality.hiResLossless ? '145 MB' : '36 MB'} per 3-minute song on mobile data.',
            textAlign: TextAlign.center,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dCtx, false),
              child: const Text('Keep Current'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: WavelengthColors.appleBlue,
              ),
              onPressed: () => Navigator.pop(dCtx, true),
              child: const Text('Turn On Lossless'),
            ),
          ],
        ),
      );
      if (confirm != true) return;
    }
    await handler.setStreamQuality(next);
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final favArtists = ref.watch(favoriteArtistsProvider);
    final effects = ref.watch(displayEffectsProvider);
    final effectsNotifier = ref.read(displayEffectsProvider.notifier);
    final themePref = ref.watch(themePreferenceProvider);

    final tierOptions = [
      StreamQuality.highEfficiency,
      StreamQuality.highQuality,
      StreamQuality.lossless,
      StreamQuality.hiResLossless,
    ];

    return Scaffold(
      body: ListView(
        controller: ref.read(navigationProvider).tabScrollControllers[3],
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 145),
        children: [
          // Header matching mobile_settings_view.png
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: WavelengthColors.emerald.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: WavelengthColors.emerald.withValues(alpha: 0.35),
                  ),
                ),
                child: const Icon(
                  Icons.settings_rounded,
                  color: WavelengthColors.emerald,
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PREFERENCES & PERSONALIZATION',
                      style: TextStyle(
                        color: WavelengthColors.emerald,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Settings',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.6,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Customize your favorite artists, audio quality, and playback preferences',
            style: TextStyle(color: Colors.white60, fontSize: 13),
          ),

          const Divider(height: 30, color: Colors.white10),

          // Section 1: Your Favourite Singers & Artists (Exact mobile_settings_view.png)
          Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your Favourite Singers & Artists',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Select favorite singers to personalize your Home screen',
                      style: TextStyle(color: Colors.white60, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: WavelengthColors.emerald.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '${favArtists.length} Selected',
                  style: const TextStyle(
                    color: WavelengthColors.emerald,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _customArtistCtrl,
                  decoration: InputDecoration(
                    hintText: 'Add another singer (e.g. Ed Sheeran)',
                    isDense: true,
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    filled: true,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(999),
                      borderSide: const BorderSide(color: Colors.white12),
                    ),
                  ),
                  onSubmitted: (v) async {
                    await ref.read(favoriteArtistsProvider.notifier).addCustom(v);
                    _customArtistCtrl.clear();
                  },
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.icon(
                onPressed: () async {
                  await ref
                      .read(favoriteArtistsProvider.notifier)
                      .addCustom(_customArtistCtrl.text);
                  _customArtistCtrl.clear();
                },
                style: FilledButton.styleFrom(
                  backgroundColor: WavelengthColors.emerald,
                  foregroundColor: Colors.black,
                  shape: const StadiumBorder(),
                ),
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text('Add',
                    style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ],
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: CuratedCatalog.featuredArtists.take(12).length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.76,
            ),
            itemBuilder: (_, idx) {
              final artist = CuratedCatalog.featuredArtists[idx];
              final selected = favArtists.contains(artist.name);
              return GestureDetector(
                onTap: () =>
                    ref.read(favoriteArtistsProvider.notifier).toggle(artist.name),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: selected
                        ? WavelengthColors.emerald.withValues(alpha: 0.12)
                        : Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: selected
                          ? WavelengthColors.emerald
                          : Colors.white10,
                      width: selected ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          WavelengthArtwork(
                            imageUrl: artist.artworkUrl,
                            localAssetPath: artist.localAssetPath,
                            size: 62,
                            isCircular: true,
                          ),
                          if (selected)
                            Container(
                              width: 24,
                              height: 24,
                              decoration: const BoxDecoration(
                                color: WavelengthColors.emerald,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.check_rounded,
                                color: Colors.black,
                                size: 16,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        artist.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontSize: 11.5, fontWeight: FontWeight.w700),
                      ),
                      Text(
                        artist.genres.firstOrNull ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontSize: 9.5, color: Colors.white54),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          const Divider(height: 34, color: Colors.white10),

          // Section 2: Playback & Audio Quality
          const Text(
            'Playback & Audio Quality',
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          const Text(
            'Choose how songs stream and sound on your headphones or DAC',
            style: TextStyle(color: Colors.white60, fontSize: 12),
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1C1C1E),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              children: tierOptions.asMap().entries.map((entry) {
                final idx = entry.key;
                final q = entry.value;
                final active = handler.quality == q;
                return Column(
                  children: [
                    ListTile(
                      onTap: () => _selectQualityTier(q),
                      title: Text(q.label,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(
                        '${q.subtitle} (~${q.approxMbPer3Min.toStringAsFixed(1)} MB / 3 min)',
                        style: const TextStyle(
                            color: Color(0xFF8E8E93), fontSize: 12),
                      ),
                      trailing: active
                          ? const Icon(Icons.check_rounded,
                              color: WavelengthColors.appleBlue)
                          : null,
                    ),
                    if (idx < tierOptions.length - 1)
                      const Divider(
                          height: 1, indent: 16, color: Color(0xFF2C2C2E)),
                  ],
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),
          ListTile(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            tileColor: Theme.of(context).cardColor,
            leading: const Icon(Icons.tune_rounded,
                color: WavelengthColors.emerald),
            title: const Text('10-Band Equalizer & DAC Audio'),
            subtitle: Text(
              'Output: ${handler.outputDevice.friendlySummary} • Crossfade ${handler.crossfadeSeconds}s',
            ),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => showEqualizerAndAudioSheet(context, ref),
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            title: const Text('Normalize Volume'),
            value: handler.normalizeAudio,
            activeTrackColor: WavelengthColors.emerald,
            onChanged: handler.setNormalizeAudio,
          ),
          SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            title: const Text('Autoplay Similar Songs'),
            value: handler.autoplayRadio,
            activeTrackColor: WavelengthColors.emerald,
            onChanged: handler.setAutoplayRadio,
          ),
          SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            title: const Text('Resume when Bluetooth / Earphones reconnect'),
            value: handler.autoResumeOnReconnect,
            activeTrackColor: WavelengthColors.emerald,
            onChanged: handler.setAutoResumeOnReconnect,
          ),

          const Divider(height: 30, color: Colors.white10),

          // Section 3: Display & Dynamic Island (Exact parity with settings/page.tsx)
          const Text(
            'Display & Dynamic Island',
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          const Text(
            'Customize under-camera Dynamic Island, Lumn rim glow, and 25s Canvas',
            style: TextStyle(color: Colors.white60, fontSize: 12),
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            title: const Text('Camera Dynamic Island'),
            subtitle: const Text(
                'Floating under-camera pill popping down on song change'),
            value: effects.dynamicIslandVisible,
            activeTrackColor: WavelengthColors.emerald,
            onChanged: (v) => effectsNotifier.toggleDynamicIsland(v),
          ),
          SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            title: const Text('Lumn Ambient Rim Glow'),
            subtitle: const Text(
                'Adaptive album-color screen rim aura in Verci Studio'),
            value: effects.lumnGlowEnabled,
            activeTrackColor: WavelengthColors.emerald,
            onChanged: (v) => effectsNotifier.toggleLumnGlow(v),
          ),
          SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            title: const Text('25s Climax Video Canvas'),
            subtitle: const Text(
                'Highlight music climax cards inside Now Playing & Verci'),
            value: effects.canvasModeEnabled,
            activeTrackColor: WavelengthColors.emerald,
            onChanged: (v) => effectsNotifier.toggleCanvasMode(v),
          ),
          const SizedBox(height: 8),
          const Text('Theme', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          SegmentedButton<AppThemePreference>(
            segments: const [
              ButtonSegment(value: AppThemePreference.dark, label: Text('Dark')),
              ButtonSegment(value: AppThemePreference.light, label: Text('Light')),
              ButtonSegment(value: AppThemePreference.system, label: Text('Auto')),
            ],
            selected: {themePref},
            onSelectionChanged: (s) =>
                ref.read(themePreferenceProvider.notifier).setPreference(s.first),
          ),

          const Divider(height: 30, color: Colors.white10),

          // Section 4: Playlist Backup & App Updates
          ListTile(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            tileColor: Theme.of(context).cardColor,
            leading: const Icon(Icons.backup_outlined,
                color: WavelengthColors.emerald),
            title: const Text('Backup Playlists & Liked Songs'),
            subtitle: const Text('Export JSON file to share or keep safe'),
            onTap: _exportLibraryBackup,
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF16181E), Colors.black],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'WAVELENGTH NATIVE',
                        style: TextStyle(
                          color: WavelengthColors.emerald,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.1,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'v2.1.1',
                        style: TextStyle(
                            fontSize: 20,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w900),
                      ),
                      Text(
                        'Hi-Res Audio • Verci & Lumn • Dynamic Island',
                        style: TextStyle(color: Colors.white60, fontSize: 11.5),
                      ),
                    ],
                  ),
                ),
                FilledButton.icon(
                  onPressed: () => launchUrl(
                    Uri.parse(
                        'https://github.com/MohamedNavith/Spotify-Craft/releases/latest'),
                    mode: LaunchMode.externalApplication,
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: WavelengthColors.emerald,
                    foregroundColor: Colors.black,
                  ),
                  icon: const Icon(Icons.open_in_new_rounded, size: 16),
                  label: const Text('Releases',
                      style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
