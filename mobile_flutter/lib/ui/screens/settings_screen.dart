import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import '../../platform/native_bridge.dart';
import '../../state/app_providers.dart';
import '../modals/equalizer_and_timer_sheets.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  late TextEditingController _backendCtrl;
  late TextEditingController _metaCtrl;
  late TextEditingController _snapCtrl;

  @override
  void initState() {
    super.initState();
    final handler = ref.read(audioHandlerProvider);
    final creds = ref.read(integrationCredsProvider);
    _backendCtrl = TextEditingController(text: handler.customBackendUrl);
    _metaCtrl = TextEditingController(text: creds.metaAppId);
    _snapCtrl = TextEditingController(text: creds.snapClientId);
  }

  @override
  void dispose() {
    _backendCtrl.dispose();
    _metaCtrl.dispose();
    _snapCtrl.dispose();
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
        text: 'Wavelength Library Backup (playlists + likes)',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(audioEngineTickProvider);
    final handler = ref.watch(audioHandlerProvider);
    final themePref = ref.watch(themePreferenceProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings & Zero-Cost Engine')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
        children: [
          _SectionCard(
            title: 'Appearance',
            children: [
              SegmentedButton<AppThemePreference>(
                segments: const [
                  ButtonSegment(
                    value: AppThemePreference.dark,
                    icon: Icon(Icons.dark_mode_outlined),
                    label: Text('Dark'),
                  ),
                  ButtonSegment(
                    value: AppThemePreference.light,
                    icon: Icon(Icons.light_mode_outlined),
                    label: Text('Light'),
                  ),
                  ButtonSegment(
                    value: AppThemePreference.system,
                    icon: Icon(Icons.phone_android_outlined),
                    label: Text('System'),
                  ),
                ],
                selected: {themePref},
                onSelectionChanged: (s) =>
                    ref.read(themePreferenceProvider.notifier).setPreference(s.first),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Audio Engine & Headphone / DAC Output',
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.equalizer_rounded,
                    color: WavelengthColors.emerald),
                title: const Text('Quality & Hardware Equalizer'),
                subtitle: Text(
                  '${handler.quality.label} • Output: ${handler.outputDevice.friendlySummary}',
                ),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => showEqualizerAndAudioSheet(context, ref),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Loudness Normalization'),
                value: handler.normalizeAudio,
                onChanged: handler.setNormalizeAudio,
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Autoplay Radio after Queue'),
                value: handler.autoplayRadio,
                onChanged: handler.setAutoplayRadio,
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Resume when Bluetooth / Headphones reconnect'),
                subtitle: const Text('Optional convenience after unplug auto-pause'),
                value: handler.autoResumeOnReconnect,
                onChanged: handler.setAutoResumeOnReconnect,
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.battery_saver_rounded),
                title: const Text('Background Playback Battery Setting'),
                subtitle: const Text(
                    'Allow unrestricted background audio on ColorOS / FuntouchOS / MIUI'),
                trailing: const Icon(Icons.open_in_new_rounded, size: 18),
                onTap: () => NativeBridge.openBatteryOptimizationSettings(),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Free Direct Architecture (\$0/month)',
            children: [
              const Text(
                'Running standalone at zero server cost using Monochrome FLAC, JioSaavn 320k, iTunes Metadata, Jamendo, LRCLIB synced lyrics, and local SQLite storage — identical to the web app.',
                style: TextStyle(fontSize: 13, color: Colors.white70),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _backendCtrl,
                decoration: const InputDecoration(
                  labelText: 'Optional Custom Backend URL (leave empty for free mode)',
                  hintText: 'https://your-server.example.com',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton(
                  onPressed: () async {
                    await handler.setCustomBackendUrl(_backendCtrl.text);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Backend override saved')),
                      );
                    }
                  },
                  child: const Text('Save Endpoint'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Story Sharing App Keys (Optional Free Tier)',
            children: [
              const Text(
                'Direct file/system share works out of the box. Add your free Meta App ID (for IG interactive stickers) or Snap Kit Client ID (for Snap Creative Kit) here if you register them:',
                style: TextStyle(fontSize: 12, color: Colors.white70),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _metaCtrl,
                decoration: const InputDecoration(
                  labelText: 'Meta / Instagram App ID',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _snapCtrl,
                decoration: const InputDecoration(
                  labelText: 'Snapchat Snap Kit Client ID',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton(
                  onPressed: () async {
                    await ref.read(integrationCredsProvider.notifier).save(
                          metaAppId: _metaCtrl.text,
                          snapClientId: _snapCtrl.text,
                        );
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Saved integration IDs locally')),
                      );
                    }
                  },
                  child: const Text('Save Keys'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Backup & Honest Limitations',
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.backup_outlined),
                title: const Text('Export Library Backup (JSON)'),
                subtitle: const Text('Share or save your playlists and Liked Songs'),
                onTap: _exportLibraryBackup,
              ),
              const Divider(),
              const Text(
                'Platform & No-Server Limits:\n'
                '• Cross-phone live Jam/friend inbox requires a relay server (use QR/JSON share cleanly between friends).\n'
                '• Audio humming/fingerprinting is not available without a keyed service (use Lyrics Snippet Search).\n'
                '• Private Spotify playlists require Exportify CSV/JSON export rather than a public link.',
                style: TextStyle(fontSize: 12, color: Colors.white70, height: 1.45),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }
}
