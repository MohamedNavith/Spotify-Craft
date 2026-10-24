import playdl from 'play-dl';
import { Requester, Track } from '../types';
import { searchMasterAudio } from './masterResolver';
import { formatSeconds } from './spotifyResolver';

export function isYouTubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);
}

export function isDirectAudioUrl(url: string): boolean {
  return /^https?:\/\/.+\.(mp3|aac|ogg|flac|m4a|wav)(\?.*)?$/i.test(url);
}

export async function resolveYouTubeOrSearch(query: string, requester: Requester): Promise<Track[]> {
  const tracks: Track[] = [];

  // 1. Direct Audio File Link (e.g. mp3, aac, radio stream)
  if (isDirectAudioUrl(query)) {
    const filename = query.split('/').pop()?.split('?')[0] || 'Direct Audio Stream';
    return [
      {
        title: decodeURIComponent(filename),
        author: 'Direct Stream',
        url: query,
        streamUrl: query,
        duration: 0,
        formattedDuration: 'LIVE / Stream',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        requester,
        source: 'direct',
      },
    ];
  }

  // 2. YouTube URL
  if (isYouTubeUrl(query)) {
    try {
      const ytType = playdl.yt_validate(query);

      if (ytType === 'playlist') {
        const playlist = await playdl.playlist_info(query, { incomplete: true });
        const allVideos = await playlist.all_videos();
        for (const video of allVideos.slice(0, 100)) {
          tracks.push({
            title: video.title || 'Untitled Track',
            author: video.channel?.name || 'YouTube',
            url: video.url,
            streamUrl: null, // lazily resolved
            duration: video.durationInSec,
            formattedDuration: video.durationRaw || formatSeconds(video.durationInSec),
            thumbnail: video.thumbnails[video.thumbnails.length - 1]?.url || 'https://www.youtube.com/favicon.ico',
            requester,
            source: 'youtube',
          });
        }
        return tracks;
      }

      if (ytType === 'video') {
        const info = await playdl.video_basic_info(query);
        const details = info.video_details;
        const title = details.title || 'YouTube Video';
        const author = details.channel?.name || 'YouTube';
        const duration = details.durationInSec;

        // Try direct master CDN for studio 320kbps quality
        const master = await searchMasterAudio(`${title} ${author}`);

        return [
          {
            title: master ? master.title : title,
            author: master ? master.artist : author,
            url: query,
            streamUrl: master ? master.streamUrl : null,
            duration: master ? master.duration : duration,
            formattedDuration: formatSeconds(master ? master.duration : duration),
            thumbnail: master ? master.thumbnail : (details.thumbnails[details.thumbnails.length - 1]?.url || ''),
            requester,
            source: master ? 'wavelength' : 'youtube',
          },
        ];
      }
    } catch (err) {
      console.warn('YouTube URL direct resolution error:', err);
    }
  }

  // 3. Plain Search Query
  // Check Master CDN first for lightning-fast 320kbps master studio audio!
  const master = await searchMasterAudio(query);
  if (master) {
    return [
      {
        title: master.title,
        author: master.artist,
        url: master.streamUrl,
        streamUrl: master.streamUrl,
        duration: master.duration,
        formattedDuration: formatSeconds(master.duration),
        thumbnail: master.thumbnail,
        requester,
        source: 'wavelength',
      },
    ];
  }

  // If not found in master CDN, search YouTube via play-dl
  try {
    const searchResults = await playdl.search(query, { limit: 1, source: { youtube: 'video' } });
    if (searchResults && searchResults.length > 0) {
      const top = searchResults[0];
      return [
        {
          title: top.title || query,
          author: top.channel?.name || 'YouTube Artist',
          url: top.url,
          streamUrl: null,
          duration: top.durationInSec,
          formattedDuration: top.durationRaw || formatSeconds(top.durationInSec),
          thumbnail: top.thumbnails[top.thumbnails.length - 1]?.url || 'https://www.youtube.com/favicon.ico',
          requester,
          source: 'youtube',
        },
      ];
    }
  } catch (err) {
    console.warn('YouTube search fallback error:', err);
  }

  return [];
}
