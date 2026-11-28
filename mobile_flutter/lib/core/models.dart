import 'dart:convert';

enum StreamQuality {
  auto('auto', 'Auto', 'Adapts to connection & DAC', 'AUTO', 6.0),
  highEfficiency('high-efficiency', 'High Efficiency', 'HE-AAC with low data usage', 'HE-AAC', 1.5),
  highQuality('high-quality', 'High Quality', 'AAC 256–320 kbps Master', '320K AAC', 6.0),
  lossless('lossless', 'Lossless', 'ALAC / FLAC up to 24-bit/48 kHz', 'LOSSLESS', 36.0),
  hiResLossless('hi-res-lossless', 'Hi-Res Lossless', 'ALAC / FLAC up to 24-bit/192 kHz', 'HI-RES FLAC', 145.0);

  const StreamQuality(
    this.apiKey,
    this.label,
    this.subtitle,
    this.shortBadge,
    this.approxMbPer3Min,
  );
  final String apiKey;
  final String label;
  final String subtitle;
  final String shortBadge;
  final double approxMbPer3Min;

  static StreamQuality fromKey(String? key) {
    for (final q in StreamQuality.values) {
      if (q.apiKey == key || q.name == key) return q;
    }
    return StreamQuality.hiResLossless;
  }
}

enum RepeatModeSetting { off, all, one }

enum AppThemePreference { dark, light, system }

enum VerciStyle {
  constellation('Constellation', 'Zigzag Star Map'),
  canvas('Video Canvas', '25s Climax & Lyrics'),
  spicetify('Spicetify Studio', 'Fluid Aurora Lyrics'),
  kinetic('Kinetic Pop', 'Lockscreen Clock & Badges'),
  fisheye('Fisheye Focus', 'Magnified Karaoke Roll'),
  minimal('Minimalist HUD', 'Clean OLED Lyric Card');

  const VerciStyle(this.label, this.description);
  final String label;
  final String description;
}

enum VerciFontStyle { figtree, sfPro, serif, monospace }

enum StoryCardThemePreset {
  slateNight('Slate Night', 0xFF2A323D, 0xFF12161A, 0xFF050709),
  emeraldForest('Emerald Forest', 0xFF064E3B, 0xFF022C22, 0xFF01130E),
  oceanTeal('Ocean Teal', 0xFF134E4A, 0xFF042F2E, 0xFF011717),
  purpleVelvet('Purple Velvet', 0xFF4C1D95, 0xFF2E1065, 0xFF100524);

  const StoryCardThemePreset(this.name, this.topHex, this.midHex, this.bottomHex);
  final String name;
  final int topHex;
  final int midHex;
  final int bottomHex;
}

class AudioStreamDetails {
  const AudioStreamDetails({
    required this.codec,
    required this.container,
    this.bitrateKbps,
    this.sampleRateHz,
    this.bitDepth,
    this.sourceProvider = 'Wavelength Direct',
    this.isLossless = false,
    this.isHiRes = false,
    this.note,
  });

  final String codec;
  final String container;
  final int? bitrateKbps;
  final int? sampleRateHz;
  final int? bitDepth;
  final String sourceProvider;
  final bool isLossless;
  final bool isHiRes;
  final String? note;

  String get tierLabel {
    if (isHiRes) return 'HI-RES LOSSLESS';
    if (isLossless) return 'LOSSLESS FLAC';
    if ((bitrateKbps ?? 0) >= 256) return 'STUDIO MASTER AAC';
    return 'HIGH EFFICIENCY';
  }

  String get badgeLabel {
    if (isHiRes && bitDepth != null && sampleRateHz != null) {
      final khz = (sampleRateHz! / 1000).toStringAsFixed(sampleRateHz! % 1000 == 0 ? 0 : 1);
      return 'HI-RES $bitDepth-bit/$khz kHz';
    }
    if (isLossless) {
      final bits = bitDepth ?? 16;
      final sr = sampleRateHz ?? 44100;
      final khz = (sr / 1000).toStringAsFixed(sr % 1000 == 0 ? 0 : 1);
      return 'FLAC $bits-bit/$khz kHz';
    }
    if (bitrateKbps != null && bitrateKbps! > 0) {
      return '$codec $bitrateKbps kbps';
    }
    return codec;
  }

  double estimatedSizeMb(int durationMs) {
    final secs = durationMs > 0 ? durationMs / 1000.0 : 210.0;
    final kbps = bitrateKbps ?? (isHiRes ? 4608 : (isLossless ? 1411 : 320));
    return (kbps * secs) / 8192.0;
  }

  Map<String, dynamic> toJson() => {
        'codec': codec,
        'container': container,
        'bitrateKbps': bitrateKbps,
        'sampleRateHz': sampleRateHz,
        'bitDepth': bitDepth,
        'sourceProvider': sourceProvider,
        'isLossless': isLossless,
        'isHiRes': isHiRes,
        'note': note,
      };

  factory AudioStreamDetails.fromJson(Map<String, dynamic> json) {
    return AudioStreamDetails(
      codec: json['codec'] as String? ?? 'AAC',
      container: json['container'] as String? ?? 'm4a',
      bitrateKbps: (json['bitrateKbps'] as num?)?.toInt(),
      sampleRateHz: (json['sampleRateHz'] as num?)?.toInt(),
      bitDepth: (json['bitDepth'] as num?)?.toInt(),
      sourceProvider: json['sourceProvider'] as String? ?? 'Wavelength Direct',
      isLossless: json['isLossless'] as bool? ?? false,
      isHiRes: json['isHiRes'] as bool? ?? false,
      note: json['note'] as String?,
    );
  }
}

class AudioOutputDeviceInfo {
  const AudioOutputDeviceInfo({
    required this.route,
    required this.name,
    this.sampleRates = const [],
    this.maxSampleRateHz = 48000,
    this.isExternalDac = false,
    this.isLosslessCapable = false,
  });

  final String route;
  final String name;
  final List<int> sampleRates;
  final int maxSampleRateHz;
  final bool isExternalDac;
  final bool isLosslessCapable;

  String get routeLabel {
    switch (route) {
      case 'usb_dac':
        return 'USB-C External DAC';
      case 'wired':
        return 'Wired Headphones';
      case 'bluetooth_le':
        return 'Bluetooth LE Audio';
      case 'bluetooth_a2dp':
        return 'Bluetooth A2DP';
      default:
        return 'Phone Speaker';
    }
  }

  String get friendlySummary {
    final khz = (maxSampleRateHz / 1000).toStringAsFixed(maxSampleRateHz % 1000 == 0 ? 0 : 1);
    return '$name • $khz kHz';
  }

  factory AudioOutputDeviceInfo.fromMap(Map<dynamic, dynamic> map) {
    final ratesRaw = (map['sampleRates'] as List<dynamic>?) ?? const [];
    return AudioOutputDeviceInfo(
      route: map['route'] as String? ?? 'speaker',
      name: map['name'] as String? ?? 'Phone Speaker',
      sampleRates: ratesRaw.map((e) => (e as num).toInt()).toList(),
      maxSampleRateHz: (map['maxSampleRateHz'] as num?)?.toInt() ?? 48000,
      isExternalDac: map['isExternalDac'] as bool? ?? false,
      isLosslessCapable: map['isLosslessCapable'] as bool? ?? false,
    );
  }
}

class WavelengthTrack {
  const WavelengthTrack({
    required this.id,
    required this.title,
    required this.artist,
    this.artistId,
    this.album = 'Single',
    this.albumId,
    this.artworkUrl = '',
    this.audioUrl = '',
    this.durationMs = 0,
    this.source = 'curated',
    this.isrc,
    this.releaseYear,
    this.genre,
    this.credits,
    this.localFilePath,
    this.qualityDetails,
  });

  final String id;
  final String title;
  final String artist;
  final String? artistId;
  final String album;
  final String? albumId;
  final String artworkUrl;
  final String audioUrl;
  final int durationMs;
  final String source;
  final String? isrc;
  final String? releaseYear;
  final String? genre;
  final String? credits;
  final String? localFilePath;
  final AudioStreamDetails? qualityDetails;

  WavelengthTrack copyWith({
    String? id,
    String? title,
    String? artist,
    String? artistId,
    String? album,
    String? albumId,
    String? artworkUrl,
    String? audioUrl,
    int? durationMs,
    String? source,
    String? isrc,
    String? releaseYear,
    String? genre,
    String? credits,
    String? localFilePath,
    AudioStreamDetails? qualityDetails,
  }) {
    return WavelengthTrack(
      id: id ?? this.id,
      title: title ?? this.title,
      artist: artist ?? this.artist,
      artistId: artistId ?? this.artistId,
      album: album ?? this.album,
      albumId: albumId ?? this.albumId,
      artworkUrl: artworkUrl ?? this.artworkUrl,
      audioUrl: audioUrl ?? this.audioUrl,
      durationMs: durationMs ?? this.durationMs,
      source: source ?? this.source,
      isrc: isrc ?? this.isrc,
      releaseYear: releaseYear ?? this.releaseYear,
      genre: genre ?? this.genre,
      credits: credits ?? this.credits,
      localFilePath: localFilePath ?? this.localFilePath,
      qualityDetails: qualityDetails ?? this.qualityDetails,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'artist': artist,
        'artistId': artistId,
        'album': album,
        'albumId': albumId,
        'artworkUrl': artworkUrl,
        'audioUrl': audioUrl,
        'durationMs': durationMs,
        'source': source,
        'isrc': isrc,
        'releaseYear': releaseYear,
        'genre': genre,
        'credits': credits,
        'localFilePath': localFilePath,
        'qualityDetails': qualityDetails?.toJson(),
      };

  factory WavelengthTrack.fromJson(Map<String, dynamic> json) {
    final qMap = json['qualityDetails'];
    return WavelengthTrack(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Unknown Track',
      artist: json['artist']?.toString() ?? 'Unknown Artist',
      artistId: json['artistId']?.toString(),
      album: json['album']?.toString() ?? 'Single',
      albumId: json['albumId']?.toString(),
      artworkUrl: json['artworkUrl']?.toString() ?? '',
      audioUrl: json['audioUrl']?.toString() ?? '',
      durationMs: (json['durationMs'] as num?)?.toInt() ?? 0,
      source: json['source']?.toString() ?? 'curated',
      isrc: json['isrc']?.toString(),
      releaseYear: json['releaseYear']?.toString(),
      genre: json['genre']?.toString(),
      credits: json['credits']?.toString(),
      localFilePath: json['localFilePath']?.toString(),
      qualityDetails: qMap is Map<String, dynamic>
          ? AudioStreamDetails.fromJson(qMap)
          : null,
    );
  }

  String toDbPayload() => jsonEncode(toJson());
}

class WavelengthPlaylist {
  const WavelengthPlaylist({
    required this.id,
    required this.name,
    this.description = '',
    this.artworkUrl = '',
    this.isSystem = false,
    this.isPublic = true,
    this.trackCount = 0,
    this.createdAtMs = 0,
    this.updatedAtMs = 0,
    this.tracks = const [],
  });

  final String id;
  final String name;
  final String description;
  final String artworkUrl;
  final bool isSystem;
  final bool isPublic;
  final int trackCount;
  final int createdAtMs;
  final int updatedAtMs;
  final List<WavelengthTrack> tracks;

  WavelengthPlaylist copyWith({
    String? id,
    String? name,
    String? description,
    String? artworkUrl,
    bool? isSystem,
    bool? isPublic,
    int? trackCount,
    int? createdAtMs,
    int? updatedAtMs,
    List<WavelengthTrack>? tracks,
  }) {
    return WavelengthPlaylist(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      artworkUrl: artworkUrl ?? this.artworkUrl,
      isSystem: isSystem ?? this.isSystem,
      isPublic: isPublic ?? this.isPublic,
      trackCount: trackCount ?? this.trackCount,
      createdAtMs: createdAtMs ?? this.createdAtMs,
      updatedAtMs: updatedAtMs ?? this.updatedAtMs,
      tracks: tracks ?? this.tracks,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'artworkUrl': artworkUrl,
        'isSystem': isSystem,
        'isPublic': isPublic,
        'trackCount': tracks.isNotEmpty ? tracks.length : trackCount,
        'createdAtMs': createdAtMs,
        'updatedAtMs': updatedAtMs,
        'tracks': tracks.map((t) => t.toJson()).toList(),
      };

  factory WavelengthPlaylist.fromJson(Map<String, dynamic> json) {
    final trackList = (json['tracks'] as List<dynamic>?)
            ?.whereType<Map<String, dynamic>>()
            .map(WavelengthTrack.fromJson)
            .toList() ??
        const [];
    return WavelengthPlaylist(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Untitled Playlist',
      description: json['description']?.toString() ?? '',
      artworkUrl: json['artworkUrl']?.toString() ?? '',
      isSystem: json['isSystem'] as bool? ?? false,
      isPublic: json['isPublic'] as bool? ?? true,
      trackCount: (json['trackCount'] as num?)?.toInt() ?? trackList.length,
      createdAtMs: (json['createdAtMs'] as num?)?.toInt() ?? 0,
      updatedAtMs: (json['updatedAtMs'] as num?)?.toInt() ?? 0,
      tracks: trackList,
    );
  }
}

class WavelengthAlbum {
  const WavelengthAlbum({
    required this.id,
    required this.title,
    required this.artist,
    required this.artworkUrl,
    this.year = '2024',
    this.tracks = const [],
  });

  final String id;
  final String title;
  final String artist;
  final String artworkUrl;
  final String year;
  final List<WavelengthTrack> tracks;
}

class WavelengthArtist {
  const WavelengthArtist({
    required this.id,
    required this.name,
    required this.artworkUrl,
    this.localAssetPath,
    this.bio = '',
    this.monthlyListenersLabel = '',
    this.genres = const [],
    this.searchQuery,
  });

  final String id;
  final String name;
  final String artworkUrl;
  final String? localAssetPath;
  final String bio;
  final String monthlyListenersLabel;
  final List<String> genres;
  final String? searchQuery;
}

class PodcastEpisode {
  const PodcastEpisode({
    required this.id,
    required this.title,
    required this.durationSec,
    required this.publishedLabel,
    this.resumeSec = 0,
  });

  final String id;
  final String title;
  final int durationSec;
  final String publishedLabel;
  final int resumeSec;
}

class PodcastShow {
  const PodcastShow({
    required this.id,
    required this.title,
    required this.host,
    required this.description,
    required this.colorStart,
    required this.colorEnd,
    required this.episodes,
  });

  final String id;
  final String title;
  final String host;
  final String description;
  final int colorStart;
  final int colorEnd;
  final List<PodcastEpisode> episodes;
}

class LyricLine {
  const LyricLine({required this.timeMs, required this.text});
  final int timeMs;
  final String text;
}

class LyricsResult {
  const LyricsResult({
    required this.syncedLines,
    this.plainLyrics,
    required this.source,
    this.offsetMs = 0,
  });

  final List<LyricLine> syncedLines;
  final String? plainLyrics;
  final String source;
  final int offsetMs;

  bool get isSynced => syncedLines.isNotEmpty;
  bool get hasAnyLyrics => syncedLines.isNotEmpty || (plainLyrics?.trim().isNotEmpty ?? false);
}

class ListeningHistoryEntry {
  const ListeningHistoryEntry({
    required this.track,
    required this.playedAtMs,
    required this.msListened,
  });

  final WavelengthTrack track;
  final int playedAtMs;
  final int msListened;
}

class OfflineTrackEntry {
  const OfflineTrackEntry({
    required this.track,
    required this.localPath,
    required this.sizeBytes,
    required this.qualityLabel,
    required this.codec,
    required this.downloadedAtMs,
  });

  final WavelengthTrack track;
  final String localPath;
  final int sizeBytes;
  final String qualityLabel;
  final String codec;
  final int downloadedAtMs;
}

enum ImportMatchStatus { matched, lowConfidence, unmatched }

class ImportTrackCandidate {
  const ImportTrackCandidate({
    required this.sourceTitle,
    required this.sourceArtist,
    this.sourceAlbum = '',
    this.matchedTrack,
    this.confidence = 0.0,
    required this.status,
  });

  final String sourceTitle;
  final String sourceArtist;
  final String sourceAlbum;
  final WavelengthTrack? matchedTrack;
  final double confidence;
  final ImportMatchStatus status;

  ImportTrackCandidate copyWith({
    WavelengthTrack? matchedTrack,
    double? confidence,
    ImportMatchStatus? status,
  }) {
    return ImportTrackCandidate(
      sourceTitle: sourceTitle,
      sourceArtist: sourceArtist,
      sourceAlbum: sourceAlbum,
      matchedTrack: matchedTrack ?? this.matchedTrack,
      confidence: confidence ?? this.confidence,
      status: status ?? this.status,
    );
  }
}

class SpotifyImportResult {
  const SpotifyImportResult({
    required this.playlistTitle,
    required this.sourceKind,
    required this.candidates,
    this.artworkUrl,
    this.limitationsNote,
  });

  final String playlistTitle;
  final String sourceKind;
  final List<ImportTrackCandidate> candidates;
  final String? artworkUrl;
  final String? limitationsNote;

  int get matchedCount =>
      candidates.where((c) => c.status == ImportMatchStatus.matched).length;
  int get lowConfidenceCount =>
      candidates.where((c) => c.status == ImportMatchStatus.lowConfidence).length;
  int get unmatchedCount =>
      candidates.where((c) => c.status == ImportMatchStatus.unmatched).length;
}
