import playdl from 'play-dl';
import { Requester, Track } from '../types';
import { searchMasterAudio } from './masterResolver';
import { formatSeconds } from './spotifyResolver';

export function isYouTubeUrl(url: string): boolean {
  return /^(https?:\/\/)?((www|music)\.)?(youtube\.com|youtu\.be)\/.+/i.test(url);
}

export function isDirectAudioUrl(url: string): boolean {
  return /^https?:\/\/.+\.(mp3|aac|ogg|flac|m4a|wav)(\?.*)?$/i.test(url);
}

/**
 * Fetch YouTube or YouTube Music playlist tracks using official Innertube API
 */
async function fetchYouTubePlaylist(playlistId: string, requester: Requester): Promise<Track[]> {
  const browseId = playlistId.startsWith('VL') ? playlistId : 'VL' + playlistId;

  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20241001.01.00',
            hl: 'en',
            gl: 'US',
          },
        },
        browseId,
      }),
    });

    if (!res.ok) {
      throw new Error(`YouTube API returned status ${res.status}`);
    }

    const data: any = await res.json();

    // Check if YouTube returned a privacy / existence error
    const alerts = JSON.stringify(data.alerts || []);
    if (alerts.includes('The playlist does not exist') || alerts.includes('This playlist is private')) {
      throw new Error('This YouTube playlist is **Private** or unviewable. Please open YouTube / YouTube Music and change the playlist visibility to **"Unlisted"** or **"Public"** so Wavelength can play it!');
    }

    const tracks: Track[] = [];

    // Search for lockupViewModel (modern YouTube layout)
    function searchItems(obj: any) {
      if (!obj || typeof obj !== 'object') return;

      if (obj.lockupViewModel) {
        const lockup = obj.lockupViewModel;
        const videoId = lockup.contentId;
        const accessibility = lockup.rendererContext?.accessibilityContext?.label || '';
        const cleanTitle = accessibility.replace(/\s*\d+\s*(?:hours?|minutes?|seconds?).*$/i, '').trim() || 'YouTube Track';

        let title = cleanTitle;
        let author = 'YouTube Music';
        if (cleanTitle.includes(' - ')) {
          const parts = cleanTitle.split(' - ');
          author = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        let duration = 210;
        let formattedDuration = '03:30';
        const timeMatch = accessibility.match(/(?:(\d+)\s+hours?[,\s]*)?(?:(\d+)\s+minutes?[,\s]*)?(\d+)\s+seconds?/i);
        if (timeMatch) {
          const h = parseInt(timeMatch[1] || '0', 10);
          const m = parseInt(timeMatch[2] || '0', 10);
          const s = parseInt(timeMatch[3] || '0', 10);
          duration = h * 3600 + m * 60 + s;
          formattedDuration = formatSeconds(duration);
        }

        const rawThumb = lockup.contentImage?.thumbnailViewModel?.image?.sources?.slice(-1)[0]?.url;
        const thumbnail = rawThumb || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        if (videoId) {
          tracks.push({
            title,
            author,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            streamUrl: null,
            duration,
            formattedDuration,
            thumbnail,
            requester,
            source: 'youtube',
          });
        }
        return;
      }

      if (obj.playlistVideoRenderer) {
        const v = obj.playlistVideoRenderer;
        if (v.videoId) {
          const title = v.title?.runs?.[0]?.text || v.title?.simpleText || 'YouTube Video';
          const author = v.shortBylineText?.runs?.[0]?.text || 'YouTube';
          const duration = parseInt(v.lengthSeconds || '180', 10);
          const thumbnail = v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

          tracks.push({
            title,
            author,
            url: `https://www.youtube.com/watch?v=${v.videoId}`,
            streamUrl: null,
            duration,
            formattedDuration: formatSeconds(duration),
            thumbnail,
            requester,
            source: 'youtube',
          });
        }
        return;
      }

      for (const key of Object.keys(obj)) {
        searchItems(obj[key]);
      }
    }

    searchItems(data.contents);
    return tracks.slice(0, 100);
  } catch (err: any) {
    console.warn(`[YouTube Playlist] Error resolving playlist ${playlistId}:`, err.message);
    throw err;
  }
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

  // 2. YouTube or YouTube Music URL
  if (isYouTubeUrl(query)) {
    // Check if it's a playlist URL
    const listMatch = query.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
    if (listMatch) {
      const playlistId = listMatch[1];
      const playlistTracks = await fetchYouTubePlaylist(playlistId, requester);
      if (playlistTracks.length > 0) {
        return playlistTracks;
      }
    }

    // Check single video
    try {
      const videoMatch = query.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:\?|&|$)/i);
      const videoId = videoMatch ? videoMatch[1] : null;

      if (videoId) {
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
