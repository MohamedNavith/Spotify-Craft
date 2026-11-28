import 'package:flutter/material.dart';

abstract final class WavelengthColors {
  static const Color abyss = Color(0xFF0A0A0C);
  static const Color bgDark = Color(0xFF121212);
  static const Color surfaceDark = Color(0xFF181818);
  static const Color elevatedDark = Color(0xFF222226);
  static const Color borderDark = Color(0xFF2D2D33);

  static const Color bgLight = Color(0xFFF6F7F9);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color elevatedLight = Color(0xFFEDEFF2);
  static const Color borderLight = Color(0xFFDADDE3);

  static const Color emerald = Color(0xFF1DB954);
  static const Color emeraldBright = Color(0xFF1ED760);
  static const Color amberHiRes = Color(0xFFF5B749);
  static const Color cyanLossless = Color(0xFF38BDF8);
  static const Color danger = Color(0xFFEF4444);

  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textSecondaryDark = Color(0xFFB3B3BC);
  static const Color textMutedDark = Color(0xFF7D7D87);

  static const Color textPrimaryLight = Color(0xFF111114);
  static const Color textSecondaryLight = Color(0xFF52525E);
  static const Color textMutedLight = Color(0xFF7A7A88);
}

abstract final class WavelengthSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;
  static const double minTouchTarget = 48.0;
  static const double miniPlayerHeight = 64.0;
}

abstract final class WavelengthTheme {
  static ThemeData dark() {
    final scheme = ColorScheme.dark(
      primary: WavelengthColors.emerald,
      onPrimary: Colors.black,
      secondary: WavelengthColors.emeraldBright,
      onSecondary: Colors.black,
      surface: WavelengthColors.surfaceDark,
      onSurface: WavelengthColors.textPrimaryDark,
      surfaceContainerHighest: WavelengthColors.elevatedDark,
      error: WavelengthColors.danger,
      onError: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: WavelengthColors.bgDark,
      cardColor: WavelengthColors.surfaceDark,
      dividerColor: WavelengthColors.borderDark,
      appBarTheme: const AppBarTheme(
        backgroundColor: WavelengthColors.bgDark,
        foregroundColor: WavelengthColors.textPrimaryDark,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: WavelengthColors.surfaceDark,
        modalBackgroundColor: WavelengthColors.surfaceDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: WavelengthColors.elevatedDark,
        contentTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.6),
        titleLarge: TextStyle(fontWeight: FontWeight.w700, letterSpacing: -0.4),
        titleMedium: TextStyle(fontWeight: FontWeight.w600, letterSpacing: -0.2),
        bodyMedium: TextStyle(color: WavelengthColors.textSecondaryDark),
      ),
    );
  }

  static ThemeData light() {
    final scheme = ColorScheme.light(
      primary: const Color(0xFF159943),
      onPrimary: Colors.white,
      secondary: WavelengthColors.emerald,
      onSecondary: Colors.white,
      surface: WavelengthColors.surfaceLight,
      onSurface: WavelengthColors.textPrimaryLight,
      surfaceContainerHighest: WavelengthColors.elevatedLight,
      error: WavelengthColors.danger,
      onError: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: scheme,
      scaffoldBackgroundColor: WavelengthColors.bgLight,
      cardColor: WavelengthColors.surfaceLight,
      dividerColor: WavelengthColors.borderLight,
      appBarTheme: const AppBarTheme(
        backgroundColor: WavelengthColors.bgLight,
        foregroundColor: WavelengthColors.textPrimaryLight,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: WavelengthColors.surfaceLight,
        modalBackgroundColor: WavelengthColors.surfaceLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: WavelengthColors.textPrimaryLight,
        contentTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          color: WavelengthColors.textPrimaryLight,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.6,
        ),
        titleLarge: TextStyle(
          color: WavelengthColors.textPrimaryLight,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.4,
        ),
        titleMedium: TextStyle(
          color: WavelengthColors.textPrimaryLight,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.2,
        ),
        bodyMedium: TextStyle(color: WavelengthColors.textSecondaryLight),
      ),
    );
  }
}
