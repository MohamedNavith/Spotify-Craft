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
import '../../core/theme.dart';
import '../../platform/native_bridge.dart';
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
  StoryCardThemePreset _preset = StoryCardThemePreset.slateNight;
  bool _lyricsMode = false;
  bool _showQr = false;
  bool _busy = false;
  bool _copied = false;
  String? _statusMessage;
  Map<String, bool> _installedApps = {};

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
    _lyricsMode = widget.highlightedLyric?.isNotEmpty == true;
    NativeBridge.getInstalledShareApps().then((apps) {
      if (mounted) setState(() => _installedApps = apps);
    });
  }

  Future<File> _captureStoryPng() async {
    final boundary = _cardBoundaryKey.currentContext?.findRenderObject()
        as RenderRepaintBoundary?;
    if (boundary == null) {
      throw StateError('Photo card is not ready yet.');
    }
    final width = boundary.size.width;
    final pixelRatio = width > 0 ? (1080.0 / width).clamp(2.5, 4.5) : 3.5;
    final img = await boundary.toImage(pixelRatio: pixelRatio);
    final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
    img.dispose();
    if (byteData == null) throw StateError('PNG encoding failed');

    final cacheDir = await getTemporaryDirectory();
    final safeName = _title.replaceAll(RegExp(r'[^a-zA-Z0-9]+'), '_');
    final file = File(p.join(
      cacheDir.path,
      '${safeName}_Wavelength_${DateTime.now().millisecondsSinceEpoch}.png',
    ));
    await file.writeAsBytes(byteData.buffer.asUint8List());
    return file;
  }

  Future<void> _runShare(Future<void> Function() task) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _statusMessage = null;
    });
    try {
      await task();
    } catch (e) {
      if (mounted) setState(() => _statusMessage = 'Share failed: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.6,
      maxChildSize: 0.96,
      expand: false,
      builder: (_, scrollCtrl) {
        return ListView(
          controller: scrollCtrl,
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
          children: [
            Center(
              child: Container(
                width: 44,
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
                    'Share photo card',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.qr_code_2_rounded),
                  tooltip: 'Toggle QR badge',
                  onPressed: () => setState(() => _showQr = !_showQr),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // Exact Wavelength 9:14 Story Photo Card Preview
            Center(
              child: RepaintBoundary(
                key: _cardBoundaryKey,
                child: Container(
                  width: 260,
                  height: 405,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(_preset.topHex),
                        Color(_preset.midHex),
                        Color(_preset.bottomHex),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white12),
                    boxShadow: const [
                      BoxShadow(
                        color: Colors.black54,
                        blurRadius: 24,
                        offset: Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 18,
                                height: 18,
                                decoration: const BoxDecoration(
                                  color: WavelengthColors.emerald,
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: const Text(
                                  'W',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'WAVELENGTH',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.3,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            widget.track?.qualityDetails?.isLossless == true
                                ? 'LOSSLESS'
                                : 'HI-RES',
                            style: const TextStyle(
                              color: Colors.white38,
                              fontFamily: 'monospace',
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                      if (_showQr)
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: QrImageView(
                            data: _sharePayloadUri.length > 260
                                ? 'wavelength://playlist/${widget.playlist?.id ?? 'mix'}'
                                : _sharePayloadUri,
                            size: 160,
                            padding: EdgeInsets.zero,
                          ),
                        )
                      else if (_lyricsMode)
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.black38,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.auto_awesome_rounded,
                                  color: WavelengthColors.emerald, size: 18),
                              const SizedBox(height: 8),
                              Text(
                                '"${widget.highlightedLyric ?? 'Now listening to $_title by $_subtitle'}"',
                                maxLines: 5,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13.5,
                                  height: 1.45,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '— $_subtitle',
                                style: const TextStyle(
                                  color: WavelengthColors.emerald,
                                  fontFamily: 'monospace',
                                  fontSize: 10.5,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        WavelengthArtwork(
                          imageUrl: _artworkUrl,
                          size: 176,
                          borderRadius: 14,
                        ),
                      // Sound wave barcode + metadata footer
                      Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.black45,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white10),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 13,
                                        ),
                                      ),
                                      Text(
                                        _subtitle,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white60,
                                          fontSize: 10.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Row(
                                  children: [8.0, 14.0, 20.0, 11.0, 18.0, 10.0, 15.0]
                                      .map((h) => Container(
                                            width: 2.5,
                                            height: h,
                                            margin: const EdgeInsets.symmetric(
                                                horizontal: 1),
                                            decoration: BoxDecoration(
                                              color: WavelengthColors.emerald,
                                              borderRadius:
                                                  BorderRadius.circular(2),
                                            ),
                                          ))
                                      .toList(),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Primary Share + Download + 15s MP4 Clip row
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _busy
                        ? null
                        : () => _runShare(() async {
                              final png = await _captureStoryPng();
                              await SharePlus.instance.share(
                                ShareParams(
                                  files: [XFile(png.path)],
                                  text:
                                      'Listening to "$_title" by $_subtitle on Wavelength!',
                                ),
                              );
                            }),
                    style: FilledButton.styleFrom(
                      backgroundColor: WavelengthColors.emerald,
                      foregroundColor: Colors.black,
                      minimumSize: const Size(0, 46),
                    ),
                    icon: const Icon(Icons.image_outlined),
                    label: Text(
                      _busy ? 'Generating...' : 'Share Photo Card',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  onPressed: _busy
                      ? null
                      : () => _runShare(() async {
                            final png = await _captureStoryPng();
                            final saved = await NativeBridge.saveImageToGallery(
                              filePath: png.path,
                              displayName:
                                  'Wavelength_${DateTime.now().millisecondsSinceEpoch}.png',
                            );
                            if (mounted) {
                              setState(() => _statusMessage = saved != null
                                  ? 'Saved to Pictures/Wavelength'
                                  : 'Saved card image');
                            }
                          }),
                  icon: const Icon(Icons.download_rounded),
                  tooltip: 'Save Photo Card',
                ),
                const SizedBox(width: 4),
                IconButton.filledTonal(
                  onPressed: _busy
                      ? null
                      : () => _runShare(() async {
                            setState(() => _statusMessage =
                                'Rendering 15s waveform MP4 clip...');
                            final cacheDir = await getTemporaryDirectory();
                            final outMp4 = p.join(
                              cacheDir.path,
                              'wavelength_clip_${DateTime.now().millisecondsSinceEpoch}.mp4',
                            );
                            final path = await NativeBridge.renderWaveformVideo(
                              artworkPath: null,
                              title: _title,
                              artist: _subtitle,
                              accentColor: WavelengthColors.emerald.toARGB32(),
                              durationSeconds: 15,
                              outputPath: outMp4,
                            );
                            await NativeBridge.shareMediaToPackage(
                              packageName: null,
                              filePath: path,
                              mimeType: 'video/mp4',
                              text: 'Listening to $_title by $_subtitle',
                            );
                          }),
                  icon: const Icon(Icons.movie_creation_outlined),
                  tooltip: 'Share 15s MP4 Waveform Clip',
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Song | Lyrics segmented switch
            Center(
              child: SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(value: false, label: Text('Song')),
                  ButtonSegment(value: true, label: Text('Lyrics')),
                ],
                selected: {_lyricsMode},
                onSelectionChanged: (s) => setState(() => _lyricsMode = s.first),
              ),
            ),
            const SizedBox(height: 14),
            // Exact 4 Color Theme Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: StoryCardThemePreset.values.map((preset) {
                final active = _preset == preset;
                return GestureDetector(
                  onTap: () => setState(() => _preset = preset),
                  child: Container(
                    width: 30,
                    height: 30,
                    margin: const EdgeInsets.symmetric(horizontal: 7),
                    decoration: BoxDecoration(
                      color: Color(preset.topHex),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: active ? Colors.white : Colors.white24,
                        width: active ? 2.5 : 1,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            if (_statusMessage != null) ...[
              const SizedBox(height: 10),
              Center(
                child: Text(
                  _statusMessage!,
                  style: const TextStyle(
                    color: WavelengthColors.emerald,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
            const Divider(height: 24),
            // Social grid matching ShareModal.tsx
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _SocialCircleButton(
                  icon: _copied ? Icons.check_rounded : Icons.copy_rounded,
                  label: _copied ? 'Copied!' : 'Copy link',
                  bg: const Color(0xFF282828),
                  fg: _copied ? WavelengthColors.emerald : Colors.white,
                  onTap: () async {
                    await Clipboard.setData(ClipboardData(text: _sharePayloadUri));
                    setState(() => _copied = true);
                  },
                ),
                _SocialCircleButton(
                  icon: Icons.chat_rounded,
                  label: 'WhatsApp',
                  bg: const Color(0xFF25D366),
                  fg: Colors.black,
                  onTap: () => _runShare(() async {
                    final png = await _captureStoryPng();
                    await NativeBridge.shareMediaToPackage(
                      packageName: _installedApps['whatsapp'] == true
                          ? 'com.whatsapp'
                          : null,
                      filePath: png.path,
                      text: 'Listening to "$_title" by $_subtitle on Wavelength!',
                    );
                  }),
                ),
                _SocialCircleButton(
                  icon: Icons.snapchat_rounded,
                  label: 'Snapchat',
                  bg: const Color(0xFFFFFC00),
                  fg: Colors.black,
                  onTap: () => _runShare(() async {
                    final png = await _captureStoryPng();
                    await NativeBridge.shareMediaToPackage(
                      packageName: _installedApps['snapchat'] == true
                          ? 'com.snapchat.android'
                          : null,
                      filePath: png.path,
                    );
                  }),
                ),
                _SocialCircleButton(
                  icon: Icons.camera_alt_rounded,
                  label: 'Stories',
                  bg: const Color(0xFFE1306C),
                  fg: Colors.white,
                  onTap: () => _runShare(() async {
                    final png = await _captureStoryPng();
                    await NativeBridge.shareMediaToPackage(
                      packageName: _installedApps['instagram'] == true
                          ? 'com.instagram.android'
                          : null,
                      filePath: png.path,
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

class _SocialCircleButton extends StatelessWidget {
  const _SocialCircleButton({
    required this.icon,
    required this.label,
    required this.bg,
    required this.fg,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color bg;
  final Color fg;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
            child: Icon(icon, color: fg, size: 22),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
