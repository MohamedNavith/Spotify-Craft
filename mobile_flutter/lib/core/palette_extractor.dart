import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'theme.dart';

class ExtractedPalette {
  const ExtractedPalette({
    required this.accent,
    required this.backgroundTop,
    required this.backgroundBottom,
    required this.onAccentText,
  });

  final Color accent;
  final Color backgroundTop;
  final Color backgroundBottom;
  final Color onAccentText;
}

class ArtworkPaletteExtractor {
  static final Map<String, ExtractedPalette> _cache = {};

  /// Deterministic pleasant fallback derived from track title/artist/id while artwork loads.
  static ExtractedPalette fallbackFor(String seed) {
    const swatches = [
      Color(0xFF1DB954),
      Color(0xFF3B82F6),
      Color(0xFFEC4899),
      Color(0xFFF59E0B),
      Color(0xFF8B5CF6),
      Color(0xFF06B6D4),
      Color(0xFFEF4444),
    ];
    final idx = seed.codeUnits.fold<int>(0, (acc, c) => acc + c) % swatches.length;
    return fromAccentColor(swatches[idx]);
  }

  static ExtractedPalette fromAccentColor(Color accent) {
    final hsl = HSLColor.fromColor(accent);
    final vibrant = hsl
        .withSaturation(hsl.saturation.clamp(0.45, 0.88))
        .withLightness(hsl.lightness.clamp(0.36, 0.58))
        .toColor();
    final bgTop = HSLColor.fromColor(vibrant)
        .withSaturation((hsl.saturation * 0.65).clamp(0.2, 0.7))
        .withLightness(0.18)
        .toColor();
    final onAccent = ensureContrast(
      vibrant.computeLuminance() > 0.35 ? Colors.black : Colors.white,
      vibrant,
    );
    return ExtractedPalette(
      accent: vibrant,
      backgroundTop: bgTop,
      backgroundBottom: WavelengthColors.bgDark,
      onAccentText: onAccent,
    );
  }

  /// Ensures foreground vs background meets WCAG AA 4.5:1 ratio.
  static Color ensureContrast(Color fg, Color bg, {double minRatio = 4.5}) {
    final bgLum = bg.computeLuminance();
    final fgLum = fg.computeLuminance();
    final ratio = (fgLum > bgLum)
        ? (fgLum + 0.05) / (bgLum + 0.05)
        : (bgLum + 0.05) / (fgLum + 0.05);
    if (ratio >= minRatio) return fg;
    final whiteRatio = (1.05) / (bgLum + 0.05);
    final blackRatio = (bgLum + 0.05) / 0.05;
    return whiteRatio >= blackRatio ? Colors.white : Colors.black;
  }

  static Future<ExtractedPalette> fromUrl(String url, {String fallbackSeed = ''}) async {
    if (url.trim().isEmpty) return fallbackFor(fallbackSeed);
    final cached = _cache[url];
    if (cached != null) return cached;

    try {
      final resp = await http
          .get(Uri.parse(url))
          .timeout(const Duration(seconds: 4));
      if (resp.statusCode != 200 || resp.bodyBytes.isEmpty) {
        return fallbackFor(fallbackSeed.isNotEmpty ? fallbackSeed : url);
      }
      final palette = await fromBytes(resp.bodyBytes, fallbackSeed: fallbackSeed);
      _cache[url] = palette;
      return palette;
    } catch (_) {
      return fallbackFor(fallbackSeed.isNotEmpty ? fallbackSeed : url);
    }
  }

  static Future<ExtractedPalette> fromBytes(
    Uint8List bytes, {
    String fallbackSeed = '',
  }) async {
    try {
      final codec = await ui.instantiateImageCodec(
        bytes,
        targetWidth: 24,
        targetHeight: 24,
      );
      final frame = await codec.getNextFrame();
      final byteData = await frame.image.toByteData(
        format: ui.ImageByteFormat.rawRgba,
      );
      frame.image.dispose();
      if (byteData == null) return fallbackFor(fallbackSeed);

      final buckets = <int, int>{};
      final raw = byteData.buffer.asUint8List();
      for (var i = 0; i + 3 < raw.length; i += 4) {
        final r = raw[i];
        final g = raw[i + 1];
        final b = raw[i + 2];
        final a = raw[i + 3];
        if (a < 180) continue;
        final lum = (0.299 * r + 0.587 * g + 0.114 * b);
        if (lum < 25 || lum > 235) continue;
        final key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
        buckets[key] = (buckets[key] ?? 0) + 1;
      }

      if (buckets.isEmpty) return fallbackFor(fallbackSeed);
      final best = buckets.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
      final r = (((best >> 6) & 7) * 32 + 16).clamp(0, 255);
      final g = (((best >> 3) & 7) * 32 + 16).clamp(0, 255);
      final b = ((best & 7) * 32 + 16).clamp(0, 255);
      return fromAccentColor(Color.fromARGB(255, r, g, b));
    } catch (_) {
      return fallbackFor(fallbackSeed);
    }
  }
}
