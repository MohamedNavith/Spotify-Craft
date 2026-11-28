import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'audio/wavelength_audio_handler.dart';
import 'core/database.dart';
import 'core/models.dart';
import 'core/theme.dart';
import 'state/app_providers.dart';
import 'ui/screens/app_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final db = await WavelengthDatabase.open();
  final prefs = await SharedPreferences.getInstance();

  final audioHandler = await AudioService.init<WavelengthAudioHandler>(
    builder: () => WavelengthAudioHandler.syncInstance(db, prefs),
    config: const AudioServiceConfig(
      androidNotificationChannelId: 'fm.wavelength.app.playback',
      androidNotificationChannelName: 'Wavelength Playback',
      androidNotificationChannelDescription:
          'Rich lock screen, headset & background music controls',
      androidNotificationIcon: 'drawable/ic_stat_wavelength',
      notificationColor: WavelengthColors.emerald,
      androidNotificationClickStartsActivity: true,
      androidResumeOnClick: true,
      androidNotificationOngoing: false,
      androidStopForegroundOnPause: true,
      preloadArtwork: true,
    ),
  );
  await audioHandler.ensureReady();

  runApp(
    ProviderScope(
      overrides: [
        databaseProvider.overrideWithValue(db),
        sharedPrefsProvider.overrideWithValue(prefs),
        audioHandlerProvider.overrideWithValue(audioHandler),
      ],
      child: const WavelengthApp(),
    ),
  );
}

class WavelengthApp extends ConsumerWidget {
  const WavelengthApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themePref = ref.watch(themePreferenceProvider);
    final mode = switch (themePref) {
      AppThemePreference.dark => ThemeMode.dark,
      AppThemePreference.light => ThemeMode.light,
      AppThemePreference.system => ThemeMode.system,
    };

    return MaterialApp(
      title: 'Wavelength',
      debugShowCheckedModeBanner: false,
      theme: WavelengthTheme.light(),
      darkTheme: WavelengthTheme.dark(),
      themeMode: mode,
      home: const WavelengthAppShell(),
    );
  }
}
