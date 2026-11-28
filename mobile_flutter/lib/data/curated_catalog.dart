import 'package:flutter/material.dart';
import '../core/models.dart';

class BrowseCategory {
  const BrowseCategory({
    required this.name,
    required this.query,
    required this.colorStart,
    required this.colorEnd,
    required this.coverUrl,
  });

  final String name;
  final String query;
  final Color colorStart;
  final Color colorEnd;
  final String coverUrl;
}

class CanvasClipHighlight {
  const CanvasClipHighlight({
    required this.label,
    required this.youtubeVideoId,
    required this.clipStartSec,
    required this.clipEndSec,
  });

  final String label;
  final String youtubeVideoId;
  final int clipStartSec;
  final int clipEndSec;
}

abstract final class CuratedCatalog {
  static const List<WavelengthTrack> todayTopHits = [
    WavelengthTrack(
      id: 'official:1762744214',
      title: 'Die With A Smile',
      artist: 'Lady Gaga & Bruno Mars',
      album: 'Die With A Smile - Single',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/07/6a/99/076a99ed-b946-431b-6f1f-54fa187ca5bd/mzaf_8102882277995122875.plus.aac.p.m4a',
      durationMs: 251000,
      source: 'curated',
      releaseYear: '2024',
      genre: 'Pop',
      credits: 'Interscope / Atlantic Records • 2024',
    ),
    WavelengthTrack(
      id: 'official:1740927708',
      title: 'BIRDS OF A FEATHER',
      artist: 'Billie Eilish',
      album: 'HIT ME HARD AND SOFT',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/34/31/d3/3431d34e-847f-5d66-df83-0bce688d997e/mzaf_18106743962423782018.plus.aac.p.m4a',
      durationMs: 196000,
      source: 'curated',
      releaseYear: '2024',
      genre: 'Alternative',
      credits: 'Darkroom / Interscope Records • Finneas',
    ),
    WavelengthTrack(
      id: 'official:1750247657',
      title: 'Taste',
      artist: 'Sabrina Carpenter',
      album: 'Short n’ Sweet',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f6/15/d0/f615d0ab-e0c4-575d-907e-1cc084642357/24UMGIM61704.rgb.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/26/57/a6/2657a620-c596-e0e4-efa2-e814f3572d1c/mzaf_5475540510703120797.plus.aac.p.m4a',
      durationMs: 157000,
      source: 'curated',
      releaseYear: '2024',
      genre: 'Pop',
      credits: 'Island Records • 2024',
    ),
    WavelengthTrack(
      id: 'official:1499378108',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a',
      durationMs: 200000,
      source: 'curated',
      releaseYear: '2020',
      genre: 'Synth-Pop',
      credits: 'XO / Republic Records • Max Martin',
    ),
    WavelengthTrack(
      id: 'official:1468058456',
      title: 'Cruel Summer',
      artist: 'Taylor Swift',
      album: 'Lover',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/af/81/44af8168-9609-1b85-5048-ada08dceacf3/mzaf_1341699644335558812.plus.aac.p.m4a',
      durationMs: 178000,
      source: 'curated',
      releaseYear: '2019',
      genre: 'Pop',
      credits: 'Republic Records • Jack Antonoff',
    ),
    WavelengthTrack(
      id: 'official:1193701401',
      title: 'Shape of You',
      artist: 'Ed Sheeran',
      album: '÷ (Divide)',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/c7/4f/44c74f0d-72dc-6143-d4d0-ba14d661ca0d/mzaf_9566898362556366703.plus.aac.p.m4a',
      durationMs: 233000,
      source: 'curated',
      releaseYear: '2017',
      genre: 'Pop',
      credits: 'Asylum Records UK • Steve Mac',
    ),
    WavelengthTrack(
      id: 'official:1440854488',
      title: 'Believer',
      artist: 'Imagine Dragons',
      album: 'Evolve',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/11/7a/b8/117ab805-6811-8929-18b9-0fad7baf0c25/17UMGIM98210.rgb.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c0/3f/36/c03f367a-b66b-fd0a-a54c-30f8250c4410/mzaf_12768434238801682952.plus.aac.p.m4a',
      durationMs: 204000,
      source: 'curated',
      releaseYear: '2017',
      genre: 'Alternative Rock',
      credits: 'KIDinaKORNER / Interscope Records',
    ),
  ];

  static const List<WavelengthTrack> bollywoodHits = [
    WavelengthTrack(
      id: 'official:1634798725',
      title: 'Kesariya',
      artist: 'Pritam, Arijit Singh & Amitabh Bhattacharya',
      album: 'Brahmastra',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/38/4c/5c/384c5c8f-3ff8-e457-b2f7-3158ce108649/mzaf_12389299033886433185.plus.aac.p.m4a',
      durationMs: 268000,
      source: 'curated',
      releaseYear: '2022',
      genre: 'Bollywood',
      credits: 'Sony Music India • Composer: Pritam',
    ),
    WavelengthTrack(
      id: 'official:1756543210',
      title: 'Tauba Tauba',
      artist: 'Karan Aujla',
      album: 'Bad Newz',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/79/d2/01/79d201d2-e54d-5604-81fb-313f30db7219/198588533581.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/34/8d/63/348d6342-2c35-bf31-8131-2c8b3cfe3c09/mzaf_15374551219149804677.plus.aac.p.m4a',
      durationMs: 207000,
      source: 'curated',
      releaseYear: '2024',
      genre: 'Punjabi Pop',
      credits: 'Saregama India Ltd. • 2024',
    ),
    WavelengthTrack(
      id: 'official:1697204561',
      title: 'Hukum - Thalaivar Alappara',
      artist: 'Anirudh Ravichander & Super Subu',
      album: 'Jailer',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2c/df/14/2cdf140e-6d11-a98d-bfbf-bc5e30c3c4a1/197189528187.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8e/92/8d/8e928d01-421f-b5fd-e550-6f78f65c0946/mzaf_12861274908972800573.plus.aac.p.m4a',
      durationMs: 207000,
      source: 'curated',
      releaseYear: '2023',
      genre: 'Tamil',
      credits: 'Sun Pictures / Sony Music • Anirudh',
    ),
    WavelengthTrack(
      id: 'official:1652758914',
      title: 'Apna Bana Le',
      artist: 'Arijit Singh & Sachin-Jigar',
      album: 'Bhediya',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/2e/0b/c0/2e0bc070-112f-a827-6ad8-6bc64f7caaff/840214460180.png/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/eb/27/61/eb2761c7-d606-0912-dff0-2dc6b69974bd/mzaf_2023722930851223219.plus.aac.p.m4a',
      durationMs: 261000,
      source: 'curated',
      releaseYear: '2022',
      genre: 'Bollywood',
      credits: 'Zee Music Company • Sachin-Jigar',
    ),
    WavelengthTrack(
      id: 'official:1440838848',
      title: 'Tum Hi Ho',
      artist: 'Mithoon & Arijit Singh',
      album: 'Aashiqui 2',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3a/8c/9b/3a8c9b0b-2def-750a-f615-1555bf941edf/mzaf_17229496441442805917.plus.aac.p.m4a',
      durationMs: 262000,
      source: 'curated',
      releaseYear: '2013',
      genre: 'Bollywood',
      credits: 'T-Series • Composer: Mithoon',
    ),
  ];

  static const List<WavelengthTrack> global50 = [
    WavelengthTrack(
      id: 'official:1744825678',
      title: 'Not Like Us',
      artist: 'Kendrick Lamar',
      album: 'Not Like Us - Single',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/31/3a/3f/313a3fbc-bb8f-80c7-b5a2-e226869a38cd/24UMGIM51924.rgb.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2d/e0/e8/2de0e874-cd0b-e9a9-e876-76be13a86662/mzaf_12385336780649591409.plus.aac.p.m4a',
      durationMs: 274000,
      source: 'curated',
      releaseYear: '2024',
      genre: 'Hip-Hop/Rap',
      credits: 'pgLang / Interscope Records',
    ),
    WavelengthTrack(
      id: 'official:1615585008',
      title: 'As It Was',
      artist: 'Harry Styles',
      album: "Harry's House",
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/67/10/16/67101606-3869-ca44-6c03-e13d6322cb51/mzaf_1135399237022217274.plus.aac.p.m4a',
      durationMs: 167000,
      source: 'curated',
      releaseYear: '2022',
      genre: 'Indie Pop',
      credits: 'Columbia Records • Kid Harpoon',
    ),
    WavelengthTrack(
      id: 'official:1440857781',
      title: 'Viva La Vida',
      artist: 'Coldplay',
      album: 'Viva La Vida or Death and All His Friends',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/52/aa/85/52aa851f-15b7-6322-f91f-df84b15b7b19/190295978044.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a3/30/8e/a3308eed-d8b7-e0b3-f09d-5e1b0f4d660a/mzaf_8517946447501075134.plus.aac.p.m4a',
      durationMs: 242000,
      source: 'curated',
      releaseYear: '2008',
      genre: 'Alternative Rock',
      credits: 'Parlophone Records UK • Brian Eno',
    ),
    WavelengthTrack(
      id: 'official:1497275460',
      title: 'Levitating',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a',
      durationMs: 203000,
      source: 'curated',
      releaseYear: '2020',
      genre: 'Nu-Disco',
      credits: 'Warner Records UK • Koz',
    ),
  ];

  static const List<WavelengthTrack> chillLoFi = [
    WavelengthTrack(
      id: 'official:1509172458',
      title: 'Snowman',
      artist: 'WYS',
      album: '1 Am. Study Session',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/09/42/7c/09427c6d-462f-a256-58af-f710743d4684/859735893612.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a9/59/03/a9590347-e24a-e915-0940-2a0689e6999d/mzaf_14889967159280434949.plus.aac.p.m4a',
      durationMs: 174000,
      source: 'curated',
      releaseYear: '2020',
      genre: 'Lo-Fi Beats',
      credits: 'Lofi Records / ChilledCow',
    ),
    WavelengthTrack(
      id: 'official:1493012948',
      title: 'Controlla',
      artist: 'Idealism',
      album: 'Rainy Thoughts',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b8/b5/26/b8b526e2-956e-bb51-dd2a-f24961a34820/artwork.jpg/600x600bb.jpg',
      audioUrl:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/35/45/98/3545986a-4e35-473f-2fc6-784cc06a8aa6/mzaf_1484411353781049225.plus.aac.p.m4a',
      durationMs: 144000,
      source: 'curated',
      releaseYear: '2019',
      genre: 'Lo-Fi Beats',
      credits: 'Lofi Records',
    ),
  ];

  static List<WavelengthTrack> get allTracks => [
        ...todayTopHits,
        ...bollywoodHits,
        ...global50,
        ...chillLoFi,
      ];

  static const Map<String, CanvasClipHighlight> curatedCanvasHighlights = {
    'die with a smile': CanvasClipHighlight(
      label: 'Chorus • "If the world was ending"',
      youtubeVideoId: 'kPa7bsKwL-c',
      clipStartSec: 70,
      clipEndSec: 98,
    ),
    'tum hi ho': CanvasClipHighlight(
      label: 'Chorus • "Kyunki tum hi ho"',
      youtubeVideoId: 'Umqb9KENgmk',
      clipStartSec: 62,
      clipEndSec: 92,
    ),
    'kesariya': CanvasClipHighlight(
      label: 'Chorus • "Kesariya tera ishq hai piya"',
      youtubeVideoId: 'BddP6PYo2gs',
      clipStartSec: 60,
      clipEndSec: 90,
    ),
    'blinding lights': CanvasClipHighlight(
      label: 'Chorus • "Blinded by the lights"',
      youtubeVideoId: '4NRXx6U8ABQ',
      clipStartSec: 50,
      clipEndSec: 78,
    ),
    'birds of a feather': CanvasClipHighlight(
      label: 'Chorus • "I want you to stay"',
      youtubeVideoId: 'V9PVRfjEBTI',
      clipStartSec: 42,
      clipEndSec: 70,
    ),
    'taste': CanvasClipHighlight(
      label: 'Chorus • "I leave quite an impression"',
      youtubeVideoId: 'T94PHkuydcw',
      clipStartSec: 48,
      clipEndSec: 76,
    ),
    'cruel summer': CanvasClipHighlight(
      label: 'Bridge • "Drunk in the back of the car"',
      youtubeVideoId: 'ic8j13piAhQ',
      clipStartSec: 85,
      clipEndSec: 115,
    ),
    'hukum': CanvasClipHighlight(
      label: 'Hook • "Alappara kelapparom"',
      youtubeVideoId: '1F3HM635S0k',
      clipStartSec: 60,
      clipEndSec: 88,
    ),
    'as it was': CanvasClipHighlight(
      label: 'Chorus • "Not the same as it was"',
      youtubeVideoId: 'H5v3kku4y6Q',
      clipStartSec: 45,
      clipEndSec: 72,
    ),
    'levitating': CanvasClipHighlight(
      label: 'Chorus • "I got you, moonlight"',
      youtubeVideoId: 'TUVcZfQe-Kw',
      clipStartSec: 38,
      clipEndSec: 66,
    ),
    'believer': CanvasClipHighlight(
      label: 'Chorus • "Pain! You make me a believer"',
      youtubeVideoId: '7wtfhZwyrcc',
      clipStartSec: 42,
      clipEndSec: 72,
    ),
  };

  static CanvasClipHighlight? resolveHighlightForTrack(WavelengthTrack track) {
    final normTitle = track.title
        .toLowerCase()
        .replaceAll(RegExp(r'\(.*?\)'), '')
        .replaceAll(RegExp(r'\[.*?\]'), '')
        .trim();
    for (final entry in curatedCanvasHighlights.entries) {
      if (normTitle == entry.key ||
          normTitle.contains(entry.key) ||
          entry.key.contains(normTitle)) {
        return entry.value;
      }
    }
    return null;
  }

  static const List<PodcastShow> samplePodcasts = [
    PodcastShow(
      id: 'pod_1',
      title: 'The Sound Design Podcast',
      host: 'Audio Architects',
      description:
          'Deep dives into synthesizer history, DAC engineering, and acoustic design.',
      colorStart: 0xFF6B21A8,
      colorEnd: 0xFF312E81,
      episodes: [
        PodcastEpisode(
          id: 'ep_1',
          title: 'Analog vs Digital: The Synthesizer Revolution',
          durationSec: 2150,
          publishedLabel: '2 days ago',
          resumeSec: 420,
        ),
        PodcastEpisode(
          id: 'ep_2',
          title: 'The Art of Spatial Audio and Binaural Beats',
          durationSec: 1840,
          publishedLabel: '1 week ago',
        ),
      ],
    ),
    PodcastShow(
      id: 'pod_2',
      title: 'Open Source Waves',
      host: 'Open Audio Collective',
      description:
          'Exploring lossless codecs, USB Audio Class 2.0 DACs, and independent soundscapes.',
      colorStart: 0xFF065F46,
      colorEnd: 0xFF134E4A,
      episodes: [
        PodcastEpisode(
          id: 'ep_3',
          title: 'Democratizing Hi-Res Lossless Streaming',
          durationSec: 2400,
          publishedLabel: '3 days ago',
          resumeSec: 1200,
        ),
        PodcastEpisode(
          id: 'ep_4',
          title: 'The Legal Frontier: Open Audio Licenses',
          durationSec: 1980,
          publishedLabel: '2 weeks ago',
        ),
      ],
    ),
  ];

  static const List<WavelengthArtist> featuredArtists = [
    WavelengthArtist(
      id: 'anirudh',
      name: 'Anirudh Ravichander',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2c/df/14/2cdf140e-6d11-a98d-bfbf-bc5e30c3c4a1/197189528187.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/anirudh-ravichander.webp',
      bio: 'High-voltage anthems & Tamil/Bollywood stadium bassdrops.',
      monthlyListenersLabel: '28.4M monthly listeners',
      genres: ['Tamil & Bollywood Rock'],
    ),
    WavelengthArtist(
      id: 'a-r-rahman',
      name: 'A.R. Rahman',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2c/df/14/2cdf140e-6d11-a98d-bfbf-bc5e30c3c4a1/197189528187.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/a-r-rahman.webp',
      bio: 'Academy Award winning composer spanning Tamil, Hindi & world music.',
      monthlyListenersLabel: '32.1M monthly listeners',
      genres: ['Composer & Master'],
    ),
    WavelengthArtist(
      id: 'arijit-singh',
      name: 'Arijit Singh',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/arijit-singh.webp',
      bio: 'Playback icon behind Kesariya, Tum Hi Ho, and Apna Bana Le.',
      monthlyListenersLabel: '44.8M monthly listeners',
      genres: ['Soulful & Melodic'],
    ),
    WavelengthArtist(
      id: 'taylor-swift',
      name: 'Taylor Swift',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/taylor-swift.webp',
      bio: 'Pop, synth-pop, and storytelling across decades.',
      monthlyListenersLabel: '104.2M monthly listeners',
      genres: ['Pop & Singer-Songwriter'],
    ),
    WavelengthArtist(
      id: 'billie-eilish',
      name: 'Billie Eilish',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/billie-eilish.webp',
      bio: 'Intimate sub-bass vocals mastered for wired & DAC listening.',
      monthlyListenersLabel: '98.5M monthly listeners',
      genres: ['Alternative Pop'],
    ),
    WavelengthArtist(
      id: 'bruno-mars',
      name: 'Bruno Mars',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/bruno-mars.webp',
      bio: 'Silk funk, brass arrangements, and arena ballads.',
      monthlyListenersLabel: '110.3M monthly listeners',
      genres: ['R&B & Funk'],
    ),
    WavelengthArtist(
      id: 'sabrina-carpenter',
      name: 'Sabrina Carpenter',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f6/15/d0/f615d0ab-e0c4-575d-907e-1cc084642357/24UMGIM61704.rgb.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/sabrina-carpenter.webp',
      bio: 'Crisp hook-driven pop hits from Short n’ Sweet.',
      monthlyListenersLabel: '86.7M monthly listeners',
      genres: ['Pop & Dance'],
    ),
    WavelengthArtist(
      id: 'the-weeknd',
      name: 'The Weeknd',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/the-weeknd.webp',
      bio: 'Synthwave, dark R&B, and arena-sized spatial mixes.',
      monthlyListenersLabel: '118.0M monthly listeners',
      genres: ['Synthwave & R&B'],
    ),
    WavelengthArtist(
      id: 'pritam',
      name: 'Pritam',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/pritam.webp',
      bio: 'Composer & arranger defining modern Hindi film soundtracks.',
      monthlyListenersLabel: '41.6M monthly listeners',
      genres: ['Bollywood Hits'],
    ),
    WavelengthArtist(
      id: 'diljit-dosanjh',
      name: 'Diljit Dosanjh',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/79/d2/01/79d201d2-e54d-5604-81fb-313f30db7219/198588533581.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/diljit-dosanjh.webp',
      bio: 'Punjabi & global crossover superstar.',
      monthlyListenersLabel: '24.9M monthly listeners',
      genres: ['Punjabi & Global Fusion'],
    ),
    WavelengthArtist(
      id: 'karan-aujla',
      name: 'Karan Aujla',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/79/d2/01/79d201d2-e54d-5604-81fb-313f30db7219/198588533581.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/karan-aujla.webp',
      bio: 'Chart-topping Punjabi lyricist and producer.',
      monthlyListenersLabel: '18.2M monthly listeners',
      genres: ['Desi Hip-Hop'],
    ),
    WavelengthArtist(
      id: 'sidhu-moose-wala',
      name: 'Sidhu Moose Wala',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/37/ca/50/37ca5028-a2dc-975b-6366-6427c2b81761/5064089945930_cover.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/sidhu-moose-wala.webp',
      bio: 'Legendary Punjabi hip-hop storytelling.',
      monthlyListenersLabel: '14.3M monthly listeners',
      genres: ['Punjabi Legend'],
    ),
    WavelengthArtist(
      id: 'badshah',
      name: 'Badshah',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/fb/11/bffb111e-b834-c360-1e5b-b98a0033faea/8902894358899.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/badshah-rapper.webp',
      bio: 'Indian hip-hop & club anthems.',
      monthlyListenersLabel: '17.1M monthly listeners',
      genres: ['Hip-Hop'],
    ),
    WavelengthArtist(
      id: 'honey-singh',
      name: 'Yo Yo Honey Singh',
      artworkUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f7/6d/78/f76d78c5-cc9c-f2d6-8603-ba690eaa5c7d/5064089826918_cover.jpg/600x600bb.jpg',
      localAssetPath: 'assets/artists/yo-yo-honey-singh.webp',
      bio: 'Pioneer of Indian hip-hop and Desi dance beats.',
      monthlyListenersLabel: '16.8M monthly listeners',
      genres: ['Desi Rap'],
    ),
  ];

  static const List<BrowseCategory> browseCategories = [
    BrowseCategory(
      name: 'Bollywood & Desi',
      query: 'Bollywood',
      colorStart: Color(0xFFC2410C),
      colorEnd: Color(0xFF7C2D12),
      coverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/fb/11/bffb111e-b834-c360-1e5b-b98a0033faea/8902894358899.jpg/300x300bb.jpg',
    ),
    BrowseCategory(
      name: 'Pop Hits',
      query: 'Pop',
      colorStart: Color(0xFFDB2777),
      colorEnd: Color(0xFF9F1239),
      coverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f6/15/d0/f615d0ab-e0c4-575d-907e-1cc084642357/24UMGIM61704.rgb.jpg/300x300bb.jpg',
    ),
    BrowseCategory(
      name: 'Punjabi Hits',
      query: 'Punjabi',
      colorStart: Color(0xFF059669),
      colorEnd: Color(0xFF065F46),
      coverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/97/86/86/97868694-9413-a543-514a-a6374469ff97/859736427250_cover.jpg/300x300bb.jpg',
    ),
    BrowseCategory(
      name: 'Hip-Hop & Rap',
      query: 'Hip Hop',
      colorStart: Color(0xFFEA580C),
      colorEnd: Color(0xFF9A3412),
      coverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f7/6d/78/f76d78c5-cc9c-f2d6-8603-ba690eaa5c7d/5064089826918_cover.jpg/300x300bb.jpg',
    ),
    BrowseCategory(
      name: 'Tamil & South Beats',
      query: 'Tamil',
      colorStart: Color(0xFFDC2626),
      colorEnd: Color(0xFF7F1D1D),
      coverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/47/61/88/476188e2-5cd5-2320-8f0b-f9cd978560fd/885288695823.jpg/300x300bb.jpg',
    ),
    BrowseCategory(
      name: 'Chill & Lo-Fi',
      query: 'Chill',
      colorStart: Color(0xFF4F46E5),
      colorEnd: Color(0xFF1E3A8A),
      coverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/300x300bb.jpg',
    ),
    BrowseCategory(
      name: 'Rock Classics',
      query: 'Rock',
      colorStart: Color(0xFF44403C),
      colorEnd: Color(0xFF1C1917),
      coverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/70/c2/f2/70c2f254-1eb5-2c77-f21c-55d953a65483/1200220383139.jpg/300x300bb.jpg',
    ),
    BrowseCategory(
      name: 'R&B & Soul',
      query: 'Soul',
      colorStart: Color(0xFF9333EA),
      colorEnd: Color(0xFF5B21B6),
      coverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/46/bf/ed46bf4e-7cb9-965a-54f3-03059977fe6c/075679589293.jpg/300x300bb.jpg',
    ),
  ];

  static List<WavelengthPlaylist> get curatedPlaylists => [
        WavelengthPlaylist(
          id: 'collection-todayTopHits',
          name: "Today's Top Hits",
          description: 'Pop essentials',
          artworkUrl: todayTopHits.first.artworkUrl,
          isSystem: true,
          trackCount: todayTopHits.length,
          tracks: todayTopHits,
        ),
        WavelengthPlaylist(
          id: 'collection-bollywoodHits',
          name: 'Hot Hits India',
          description: 'Bollywood and Hindi favorites',
          artworkUrl: bollywoodHits.first.artworkUrl,
          isSystem: true,
          trackCount: bollywoodHits.length,
          tracks: bollywoodHits,
        ),
        WavelengthPlaylist(
          id: 'collection-global50',
          name: 'Global Top 50',
          description: 'Global pop and chart favorites',
          artworkUrl: global50.first.artworkUrl,
          isSystem: true,
          trackCount: global50.length,
          tracks: global50,
        ),
        WavelengthPlaylist(
          id: 'collection-chillLoFi',
          name: 'Chill Waves & Lo-Fi',
          description: 'Laid-back music for study and focus',
          artworkUrl: chillLoFi.first.artworkUrl,
          isSystem: true,
          trackCount: chillLoFi.length,
          tracks: chillLoFi,
        ),
      ];

  static List<WavelengthPlaylist> generatePersonalizedMixes(
    List<WavelengthTrack> historyTracks,
    List<WavelengthTrack> likedTracks,
  ) {
    final seedPool = <WavelengthTrack>[
      ...likedTracks,
      ...historyTracks,
      ...allTracks,
    ];
    final unique = <String, WavelengthTrack>{};
    for (final t in seedPool) {
      unique.putIfAbsent(t.id, () => t);
    }
    final list = unique.values.toList();

    List<WavelengthTrack> slice(int offset, int count) {
      if (list.isEmpty) return const [];
      final out = <WavelengthTrack>[];
      for (var i = 0; i < count && i < list.length; i++) {
        out.add(list[(offset + i) % list.length]);
      }
      return out;
    }

    final mix1 = slice(0, 8);
    final mix2 = slice(3, 8);
    final discover = slice(6, 10);

    return [
      WavelengthPlaylist(
        id: 'mix-daily-1',
        name: 'Daily Mix 1',
        description: mix1.isNotEmpty
            ? '${mix1.first.artist} and similar favorites'
            : 'Personalized for you',
        artworkUrl: mix1.isNotEmpty ? mix1.first.artworkUrl : '',
        isSystem: true,
        trackCount: mix1.length,
        tracks: mix1,
      ),
      WavelengthPlaylist(
        id: 'mix-daily-2',
        name: 'Daily Mix 2',
        description: mix2.isNotEmpty
            ? '${mix2.first.artist} & evening vibes'
            : 'Late night mix',
        artworkUrl: mix2.isNotEmpty ? mix2.first.artworkUrl : '',
        isSystem: true,
        trackCount: mix2.length,
        tracks: mix2,
      ),
      WavelengthPlaylist(
        id: 'mix-discover-weekly',
        name: 'Discover Weekly',
        description: 'Fresh picks tuned around your recent listening',
        artworkUrl: discover.isNotEmpty ? discover.first.artworkUrl : '',
        isSystem: true,
        trackCount: discover.length,
        tracks: discover,
      ),
    ];
  }

  static List<WavelengthAlbum> get curatedAlbums => [
        WavelengthAlbum(
          id: 'album-aashiqui-2',
          title: 'Aashiqui 2',
          artist: 'Mithoon, Arijit Singh',
          artworkUrl:
              'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/fb/11/bffb111e-b834-c360-1e5b-b98a0033faea/8902894358899.jpg/600x600bb.jpg',
          year: '2013',
          tracks: bollywoodHits.where((t) => t.album == 'Aashiqui 2').toList(),
        ),
        WavelengthAlbum(
          id: 'album-after-hours',
          title: 'After Hours',
          artist: 'The Weeknd',
          artworkUrl:
              'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/600x600bb.jpg',
          year: '2020',
          tracks: todayTopHits.where((t) => t.album == 'After Hours').toList(),
        ),
        WavelengthAlbum(
          id: 'album-short-n-sweet',
          title: "Short n' Sweet",
          artist: 'Sabrina Carpenter',
          artworkUrl:
              'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f6/15/d0/f615d0ab-e0c4-575d-907e-1cc084642357/24UMGIM61704.rgb.jpg/600x600bb.jpg',
          year: '2024',
          tracks: todayTopHits.where((t) => t.title == 'Taste').toList(),
        ),
        WavelengthAlbum(
          id: 'album-24k-magic',
          title: '24K Magic',
          artist: 'Bruno Mars',
          artworkUrl:
              'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/46/bf/ed46bf4e-7cb9-965a-54f3-03059977fe6c/075679589293.jpg/600x600bb.jpg',
          year: '2016',
          tracks: const [],
        ),
      ];
}
