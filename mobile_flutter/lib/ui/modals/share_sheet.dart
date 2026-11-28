import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/models.dart';
import '../../core/palette_extractor.dart';
import '../../core/theme.dart';
import '../../platform/native_bridge.dart';
import '../../state/app_providers.dart';
import '../widgets/artwork_image.dart';

Future<void> showShareSheet(
  BuildContext context,
  WidgetRef ref, {
  WavelengthTrack? track,
  WavelengthPlaylist? playlist,
  String? highlightedLyric,
}) async {
  await showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    builder: (_) => _ShareStudioSheet(
      track: track,
      playlist: playlist,
      highlightedLyric: highlightedLyric,
    ),
  );
}

class _ShareStudioSheet extends ConsumerStatefulWidget {
  const _ShareStudioSheet({
    this.track,
    this.playlist,
    this.highlightedLyric,
  });

  final WavelengthTrack? track;
  final WavelengthPlaylist? playlist;
  final String? highlightedLyric;

  @override
  ConsumerState<_ShareStudioSheet> createState() => _ShareStudioSheetState();
}

class _ShareStudioSheetState extends ConsumerState<_ShareStudioSheet> {
  final GlobalKey _cardBoundaryKey = GlobalKey();
  StoryCardTemplate _template = StoryCardTemplate.classicDark;
  bool _squareFormat = false;
  bool _busy = false;
  String? _statusMessage;
  Map<String, bool> _installedApps = {};
  ExtractedPalette _palette = ArtworkPaletteExtractor.fallbackFor('wavelength');

  String get _title =>
      widget.track?.title ?? widget.playlist?.name ?? 'Wavelength';
  String get _subtitle =>
      widget.track?.artist ??
      (widget.playlist != null
          ? '${widget.playlist!.trackCount} songs on Wavelength'
          : 'Hi-Res Lossless Music');
  String get _artworkUrl =>
      widget.track?.artworkUrl ?? widget.playlist?.artworkUrl ?? '';
  String get _sharePayloadUri {
    if (widget.track != null) {
      return 'wavelength://track/${Uri.encodeComponent(widget.track!.id)}?title=${Uri.encodeQueryComponent(widget.track!.title)}&artist=${Uri.encodeQueryComponent(widget.track!.artist)}';
    }
    if (widget.playlist != null) {
      return 'wavelength-playlist:${base64UrlEncode(utf8.encode(jsonEncode(widget.playlist!.toJson())))}';
    }
    return 'wavelength://player';
  }

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final apps = await NativeBridge.getInstalledShareApps();
    final pal = await ArtworkPaletteExtractor.fromUrl(
      _artworkUrl,
      fallbackSeed: _title,
    );
    if (mounted) {
      setState(() {
        _installedApps = apps;
        _palette = pal;
      });
    }
  }

  Future<File> _captureStoryPng() async {
    final boundary = _cardBoundaryKey.currentContext?.findRenderObject()
        as RenderRepaintBoundary?;
    if (boundary == null) {
      throw StateError('Story preview card is not ready yet.');
    }
    // Render crisp high-resolution bitmap (~1080px wide)
    final width = boundary.size.width;
    final pixelRatio = width > 0 ? (1080.0 / width).clamp(2.5, 4.5) : 3.5;
    final img = await boundary.toImage(pixelRatio: pixelRatio);
    final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
    img.dispose();
    if (byteData == null) throw StateError('PNG encoding failed');

    final cacheDir = await getTemporaryDirectory();
    final file = File(p.join(
      cacheDir.path,
      'wavelength_story_${DateTime.now().millisecondsSinceEpoch}.png',
    ));
    await file.writeAsBytes(byteData.buffer.asUint8List());
    return file;
  }

  Future<void> _runShareAction(Future<void> Function() action) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _statusMessage = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => _statusMessage = 'Share failed: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _shareToInstagram() => _runShareAction(() async {
        final png = await _captureStoryPng();
        final creds = ref.read(integrationCredsProvider);
        final topHex = '#${_palette.backgroundTop.toARGB32().toRadixString(16).substring(2)}';
        final bottomHex = '#${_palette.accent.toARGB32().toRadixString(16).substring(2)}';
        final res = await NativeBridge.shareToInstagramStory(
          backgroundPath: png.path,
          topColor: topHex,
          bottomColor: bottomHex,
          metaAppId: creds.metaAppId,
          attributionUrl: 'https://open.wavelength.fm',
        );
        if (!mounted) return;
        if (res['launched'] != true) {
          setState(() => _statusMessage =
              'Instagram not installed (${res['reason'] ?? 'unavailable'}). Use Save or Share Sheet.');
        } else if (res['needsMetaAppId'] == true) {
          setState(() => _statusMessage =
              'Opened Instagram direct share. Add a free Meta App ID in Settings > Integrations for direct ADD_TO_STORY sticker mode.');
        }
      });

  Future<void> _shareToSnapchat() => _runShareAction(() async {
        final png = await _captureStoryPng();
        final creds = ref.read(integrationCredsProvider);
        final res = await NativeBridge.shareToSnapchat(
          filePath: png.path,
          caption: 'Listening to $_title by $_subtitle on Wavelength',
          snapClientId: creds.snapClientId,
        );
        if (!mounted) return;
        if (res['launched'] != true) {
          setState(() => _statusMessage =
              'Snapchat not installed. Use Save or System Share Sheet.');
        } else if (res['needsSnapClientId'] == true) {
          setState(() => _statusMessage =
              'Opened Snapchat direct media share. Add a free Snap Kit Client ID in Settings > Integrations for full Creative Kit stickers.');
        }
      });

  Future<void> _shareVideoClip() => _runShareAction(() async {
        setState(() => _statusMessage = 'Rendering 15s waveform MP4 clip...');
        final cacheDir = await getTemporaryDirectory();
        final outMp4 = p.join(
          cacheDir.path,
          'wavelength_clip_${DateTime.now().millisecondsSinceEpoch}.mp4',
        );
        final videoPath = await NativeBridge.renderWaveformVideo(
          artworkPath: null,
          title: _title,
          artist: _subtitle,
          accentColor: _palette.accent.toARGB32(),
          durationSeconds: 15,
          outputPath: outMp4,
        );
        await NativeBridge.shareMediaToPackage(
          packageName: null,
          filePath: videoPath,
          mimeType: 'video/mp4',
          text: 'Listening to $_title by $_subtitle on Wavelength',
        );
        if (mounted) {
          setState(() => _statusMessage = 'Rendered 15s animated waveform MP4 clip!');
        }
      });

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.55,
      maxChildSize: 0.96,
      expand: false,
      builder: (_, scrollCtrl) {
        return ListView(
          controller: scrollCtrl,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Share Story Card',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                ),
                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment(value: false, label: Text('9:16')),
                    ButtonSegment(value: true, label: Text('1:1')),
                  ],
                  selected: {_squareFormat},
                  onSelectionChanged: (s) => setState(() => _squareFormat = s.first),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Center(
              child: RepaintBoundary(
                key: _cardBoundaryKey,
                child: _StoryCardPreview(
                  template: _template,
                  square: _squareFormat,
                  title: _title,
                  subtitle: _subtitle,
                  artworkUrl: _artworkUrl,
                  lyric: widget.highlightedLyric,
                  palette: _palette,
                  qrData: _sharePayloadUri.length > 260
                      ? 'wavelength://playlist/${widget.playlist?.id ?? 'mix'}'
                      : _sharePayloadUri,
                  qualityLabel:
                      widget.track?.qualityDetails?.badgeLabel ?? 'WAVELENGTH HI-RES',
                ),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: StoryCardTemplate.values.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (_, idx) {
                  final tmpl = StoryCardTemplate.values[idx];
                  return ChoiceChip(
                    label: Text(tmpl.label),
                    selected: _template == tmpl,
                    onSelected: (_) => setState(() => _template = tmpl),
                  );
                },
              ),
            ),
            if (_statusMessage != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: WavelengthColors.elevatedDark,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(_statusMessage!, style: const TextStyle(fontSize: 12)),
              ),
            ],
            const SizedBox(height: 16),
            if (_busy)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Center(child: CircularProgressIndicator()),
              ),
            Wrap(
              spacing: 10,
              runSpacing: 12,
              children: [
                if (_installedApps['instagram'] == true)
                  _ShareActionChip(
                    icon: Icons.camera_alt_rounded,
                    label: 'IG Story',
                    color: const Color(0xFFE1306C),
                    onTap: _shareToInstagram,
                  ),
                if (_installedApps['snapchat'] == true)
                  _ShareActionChip(
                    icon: Icons.snapchat_rounded,
                    label: 'Snapchat',
                    color: const Color(0xFFFFFC00),
                    textColor: Colors.black,
                    onTap: _shareToSnapchat,
                  ),
                if (_installedApps['whatsapp'] == true)
                  _ShareActionChip(
                    icon: Icons.chat_rounded,
                    label: 'WhatsApp',
                    color: const Color(0xFF25D366),
                    textColor: Colors.black,
                    onTap: () => _runShareAction(() async {
                      final png = await _captureStoryPng();
                      await NativeBridge.shareMediaToPackage(
                        packageName: 'com.whatsapp',
                        filePath: png.path,
                        text: 'Listen to $_title — $_subtitle\n$_sharePayloadUri',
                      );
                    }),
                  ),
                if (_installedApps['telegram'] == true)
                  _ShareActionChip(
                    icon: Icons.send_rounded,
                    label: 'Telegram',
                    color: const Color(0xFF229ED9),
                    onTap: () => _runShareAction(() async {
                      final png = await _captureStoryPng();
                      await NativeBridge.shareMediaToPackage(
                        packageName: 'org.telegram.messenger',
                        filePath: png.path,
                        text: '$_title — $_subtitle',
                      );
                    }),
                  ),
                _ShareActionChip(
                  icon: Icons.movie_creation_outlined,
                  label: '15s MP4 Clip',
                  color: WavelengthColors.emerald,
                  textColor: Colors.black,
                  onTap: _shareVideoClip,
                ),
                _ShareActionChip(
                  icon: Icons.download_rounded,
                  label: 'Save Image',
                  color: WavelengthColors.elevatedDark,
                  onTap: () => _runShareAction(() async {
                    final png = await _captureStoryPng();
                    final saved = await NativeBridge.saveImageToGallery(
                      filePath: png.path,
                      displayName: 'wavelength_${DateTime.now().millisecondsSinceEpoch}.png',
                    );
                    if (mounted) {
                      setState(() => _statusMessage = saved != null
                          ? 'Saved crisp card to Pictures/Wavelength'
                          : 'Saved image to app cache: ${png.path}');
                    }
                  }),
                ),
                _ShareActionChip(
                  icon: Icons.copy_rounded,
                  label: 'Copy URI',
                  color: WavelengthColors.elevatedDark,
                  onTap: () async {
                    await Clipboard.setData(ClipboardData(text: _sharePayloadUri));
                    if (mounted) {
                      setState(() => _statusMessage =
                          'Copied deep-link / playlist bundle to clipboard!');
                    }
                  },
                ),
                _ShareActionChip(
                  icon: Icons.share_rounded,
                  label: 'More Apps',
                  color: WavelengthColors.elevatedDark,
                  onTap: () => _runShareAction(() async {
                    final png = await _captureStoryPng();
                    await SharePlus.instance.share(
                      ShareParams(
                        files: [XFile(png.path)],
                        text: '$_title by $_subtitle — $_sharePayloadUri',
                      ),
                    );
                  }),
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}

class _ShareActionChip extends StatelessWidget {
  const _ShareActionChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.textColor = Colors.white,
  });

  final IconData icon;
  final String label;
  final Color color;
  final Color textColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: textColor, size: 18),
              const SizedBox(width: 6),
              Text(label,
                  style: TextStyle(
                      color: textColor, fontWeight: FontWeight.w700, fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}

class _StoryCardPreview extends StatelessWidget {
  const _StoryCardPreview({
    required this.template,
    required this.square,
    required this.title,
    required this.subtitle,
    required this.artworkUrl,
    required this.palette,
    required this.qrData,
    required this.qualityLabel,
    this.lyric,
  });

  final StoryCardTemplate template;
  final bool square;
  final String title;
  final String subtitle;
  final String artworkUrl;
  final ExtractedPalette palette;
  final String qrData;
  final String qualityLabel;
  final String? lyric;

  @override
  Widget build(BuildContext context) {
    final width = 260.0;
    final height = square ? 260.0 : 462.0;

    final isSticker = template == StoryCardTemplate.stickerCutout;
    final bgGradient = isSticker
        ? const LinearGradient(colors: [Color(0xFF1A1A1E), Color(0xFF1A1A1E)])
        : LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [palette.backgroundTop, const Color(0xFF0E0E10), palette.accent],
          );

    return Container(
      width: width,
      height: height,
      padding: EdgeInsets.all(square ? 16 : 22),
      decoration: BoxDecoration(
        gradient: bgGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: palette.accent.withValues(alpha: 0.3),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Image.asset('assets/wavelength-icon.png', width: 20, height: 20),
              const SizedBox(width: 6),
              const Text(
                'WAVELENGTH',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.5,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black45,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  qualityLabel,
                  style: const TextStyle(color: Colors.white70, fontSize: 8),
                ),
              ),
            ],
          ),
          WavelengthArtwork(
            imageUrl: artworkUrl,
            size: square ? 120 : 196,
            borderRadius: 16,
          ),
          Column(
            children: [
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
              if (template == StoryCardTemplate.frostedLyrics &&
                  (lyric?.isNotEmpty ?? false)) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '"$lyric"',
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontStyle: FontStyle.italic,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ],
          ),
          if (!square &&
              (template == StoryCardTemplate.minimalQr ||
                  template == StoryCardTemplate.classicDark))
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: QrImageView(
                data: qrData,
                size: 56,
                padding: EdgeInsets.zero,
              ),
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                14,
                (i) => Container(
                  width: 4,
                  height: (6 + ((i * 7) % 16)).toDouble(),
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    color: palette.accent,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
