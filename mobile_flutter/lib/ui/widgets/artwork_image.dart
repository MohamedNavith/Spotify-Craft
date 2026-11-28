import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

class WavelengthArtwork extends StatelessWidget {
  const WavelengthArtwork({
    super.key,
    required this.imageUrl,
    this.localAssetPath,
    this.size = 52,
    this.borderRadius = 8,
    this.isCircular = false,
  });

  final String imageUrl;
  final String? localAssetPath;
  final double size;
  final double borderRadius;
  final bool isCircular;

  @override
  Widget build(BuildContext context) {
    final fallback = Image.asset(
      'assets/wavelength-icon.png',
      width: size,
      height: size,
      fit: BoxFit.cover,
    );

    Widget child;
    if (localAssetPath != null && localAssetPath!.isNotEmpty) {
      child = Image.asset(
        localAssetPath!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => fallback,
      );
    } else if (imageUrl.trim().isNotEmpty && imageUrl.startsWith('http')) {
      child = CachedNetworkImage(
        imageUrl: imageUrl,
        width: size,
        height: size,
        fit: BoxFit.cover,
        placeholder: (_, _) => Container(
          width: size,
          height: size,
          color: WavelengthColors.elevatedDark,
          child: const Icon(Icons.music_note, color: Colors.white38, size: 22),
        ),
        errorWidget: (_, _, _) => fallback,
      );
    } else {
      child = fallback;
    }

    if (isCircular) {
      return ClipOval(child: SizedBox(width: size, height: size, child: child));
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: SizedBox(width: size, height: size, child: child),
    );
  }
}

class PlaylistCollageArtwork extends StatelessWidget {
  const PlaylistCollageArtwork({
    super.key,
    required this.playlist,
    this.size = 56,
    this.borderRadius = 8,
  });

  final WavelengthPlaylist playlist;
  final double size;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final urls = playlist.tracks
        .map((t) => t.artworkUrl)
        .where((u) => u.isNotEmpty)
        .toSet()
        .take(4)
        .toList();

    if (urls.length < 4) {
      final single = playlist.artworkUrl.isNotEmpty
          ? playlist.artworkUrl
          : (urls.isNotEmpty ? urls.first : '');
      return WavelengthArtwork(
        imageUrl: single,
        size: size,
        borderRadius: borderRadius,
      );
    }

    final half = size / 2;
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: SizedBox(
        width: size,
        height: size,
        child: Column(
          children: [
            Row(
              children: [
                WavelengthArtwork(imageUrl: urls[0], size: half, borderRadius: 0),
                WavelengthArtwork(imageUrl: urls[1], size: half, borderRadius: 0),
              ],
            ),
            Row(
              children: [
                WavelengthArtwork(imageUrl: urls[2], size: half, borderRadius: 0),
                WavelengthArtwork(imageUrl: urls[3], size: half, borderRadius: 0),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class TrackRowTile extends StatelessWidget {
  const TrackRowTile({
    super.key,
    required this.track,
    required this.isActive,
    required this.isPlaying,
    required this.isLiked,
    required this.onTap,
    required this.onToggleLike,
    required this.onAddToPlaylist,
    required this.onMorePressed,
    this.indexBadge,
    this.isDownloaded = false,
  });

  final WavelengthTrack track;
  final bool isActive;
  final bool isPlaying;
  final bool isLiked;
  final int? indexBadge;
  final bool isDownloaded;
  final VoidCallback onTap;
  final VoidCallback onToggleLike;
  final VoidCallback onAddToPlaylist;
  final VoidCallback onMorePressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = WavelengthColors.emerald;
    final titleColor = isActive
        ? accent
        : theme.colorScheme.onSurface;
    final subColor = theme.textTheme.bodyMedium?.color ?? WavelengthColors.textSecondaryDark;

    return InkWell(
      onTap: onTap,
      onLongPress: onMorePressed,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 62),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: WavelengthSpacing.lg,
            vertical: WavelengthSpacing.xs + 2,
          ),
          child: Row(
            children: [
              if (indexBadge != null) ...[
                SizedBox(
                  width: 26,
                  child: isActive && isPlaying
                      ? Icon(Icons.graphic_eq, color: accent, size: 18)
                      : Text(
                          '$indexBadge',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: isActive ? accent : subColor,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                ),
                const SizedBox(width: 8),
              ],
              Stack(
                children: [
                  WavelengthArtwork(imageUrl: track.artworkUrl, size: 50, borderRadius: 6),
                  if (isActive && isPlaying && indexBadge == null)
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Icon(
                          Icons.graphic_eq,
                          color: WavelengthColors.emerald,
                          size: 22,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      track.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: titleColor,
                        fontWeight: isActive ? FontWeight.w700 : FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        if (isDownloaded || track.localFilePath != null) ...[
                          const Icon(
                            Icons.download_done_rounded,
                            size: 13,
                            color: WavelengthColors.emerald,
                          ),
                          const SizedBox(width: 4),
                        ],
                        if (track.qualityDetails?.isLossless == true) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                            margin: const EdgeInsets.only(right: 5),
                            decoration: BoxDecoration(
                              color: WavelengthColors.amberHiRes.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              track.qualityDetails!.isHiRes ? 'HI-RES' : 'FLAC',
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: WavelengthColors.amberHiRes,
                              ),
                            ),
                          ),
                        ],
                        Expanded(
                          child: Text(
                            track.artist,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: subColor, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Semantics(
                button: true,
                label: isLiked ? 'Unlike ${track.title}' : 'Like ${track.title}',
                child: IconButton(
                  constraints: const BoxConstraints(
                    minWidth: WavelengthSpacing.minTouchTarget,
                    minHeight: WavelengthSpacing.minTouchTarget,
                  ),
                  icon: Icon(
                    isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                    color: isLiked ? WavelengthColors.emerald : subColor,
                    size: 20,
                  ),
                  onPressed: onToggleLike,
                ),
              ),
              Semantics(
                button: true,
                label: 'Add ${track.title} to playlist',
                child: IconButton(
                  constraints: const BoxConstraints(
                    minWidth: WavelengthSpacing.minTouchTarget,
                    minHeight: WavelengthSpacing.minTouchTarget,
                  ),
                  icon: Icon(Icons.playlist_add_rounded, color: subColor, size: 22),
                  onPressed: onAddToPlaylist,
                ),
              ),
              Semantics(
                button: true,
                label: 'More options for ${track.title}',
                child: IconButton(
                  constraints: const BoxConstraints(
                    minWidth: WavelengthSpacing.minTouchTarget,
                    minHeight: WavelengthSpacing.minTouchTarget,
                  ),
                  icon: Icon(Icons.more_vert_rounded, color: subColor, size: 20),
                  onPressed: onMorePressed,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
