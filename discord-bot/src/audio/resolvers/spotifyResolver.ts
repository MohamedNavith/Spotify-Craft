import playdl from 'play-dl';
import { Requester, Track } from '../types';
import { searchMasterAudio } from './masterResolver';

export function isSpotifyUrl(url: string): boolean {
  return /^(https?:\/\/)?(open\.)?spotify\.com\/(track|playlist|album|artist)\/[a-zA-Z0-9]+/i.test(url);
}

export function formatSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * High-speed Spotify Embed Scraper
 * Resolves playlists, albums, and tracks directly from Spotify without requiring developer tokens.
 */
async function fetchSpotifyEmbed(
  type: 'track' | 'playlist' | 'album',
  id: string,
  requester: Requester,
): Promise<Track[]> {
  try {
    const res = await fetch(`https://open.spotify.com/embed/${type}/${id}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]+?)<\/script>/);
    if (!match) return [];

    const json = JSON.parse(match[1]);
    const entity = json?.props?.pageProps?.state?.data?.entity;
    if (!entity) return [];

    const tracks: Track[] = [];

    if (type === 'track') {
      const title = entity.name || entity.title || 'Unknown Track';
      const artist =
        entity.artists?.map((a: any) => a.name).join(', ') || entity.subtitle || 'Unknown Artist';
      const durationSec = Math.floor((entity.duration || 210000) / 1000);
      const thumbnail =
        entity.coverArt?.sources?.slice(-1)[0]?.url || 'https://open.spotify.com/favicon.ico';

      // Check master CDN for direct lossless playback
      const master = await searchMasterAudio(`${title} ${artist}`);
      tracks.push({
        title,
        author: artist,
        url: `https://open.spotify.com/track/${id}`,
        streamUrl: master ? master.streamUrl : null,
        duration: master ? master.duration : durationSec,
        formattedDuration: formatSeconds(master ? master.duration : durationSec),
        thumbnail: master ? master.thumbnail : thumbnail,
        requester,
        source: 'spotify',
      });
    } else if (type === 'playlist' || type === 'album') {
      const trackList = entity.trackList || [];
      const coverUrl =
        entity.coverArt?.sources?.slice(-1)[0]?.url || 'https://open.spotify.com/favicon.ico';

      for (const t of trackList.slice(0, 100)) {
        const title = t.title || t.name;
        const artist =
          t.subtitle ||
          (t.artists ? t.artists.map((a: any) => a.name).join(', ') : entity.name) ||
          'Unknown Artist';
        const durationSec = Math.floor((t.duration || 210000) / 1000);
        const trackId = t.uri ? t.uri.replace('spotify:track:', '') : '';
        const trackUrl = trackId
          ? `https://open.spotify.com/track/${trackId}`
          : `https://open.spotify.com/${type}/${id}`;

        tracks.push({
          title,
          author: artist,
          url: trackUrl,
          streamUrl: null, // lazily resolved when played
          duration: durationSec,
          formattedDuration: formatSeconds(durationSec),
          thumbnail: coverUrl,
          requester,
          source: 'spotify',
        });
      }
    }

    return tracks;
  } catch (err: any) {
    console.warn(`[Spotify Embed] Extraction error for ${type}/${id}:`, err?.message || err);
    return [];
  }
}

export async function resolveSpotify(url: string, requester: Requester): Promise<Track[]> {
  // 1. Try Embed Scraper first (fastest, zero API keys required, works for private-safe tracks/playlists/albums)
  const embedMatch = url.match(/open\.spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/i);
  if (embedMatch) {
    const type = embedMatch[1] as 'track' | 'playlist' | 'album';
    const id = embedMatch[2];
    const embedTracks = await fetchSpotifyEmbed(type, id, requester);
    if (embedTracks.length > 0) {
      return embedTracks;
    }
  }

  // 2. Play-DL fallback
  const tracks: Track[] = [];

  try {
    const spType = playdl.sp_validate(url);

    if (spType === 'track') {
      const spData = (await playdl.spotify(url)) as any;
      if (spData) {
        const title = spData.name;
        const artist = spData.artists ? spData.artists.map((a: any) => a.name).join(', ') : 'Unknown Artist';
        const durationSec = Math.floor((spData.durationInSec || spData.durationInMs / 1000) || 210);
        const thumbnail = spData.thumbnail?.url || 'https://open.spotify.com/favicon.ico';

        const master = await searchMasterAudio(`${title} ${artist}`);
        tracks.push({
          title,
          author: artist,
          url: spData.url || url,
          streamUrl: master ? master.streamUrl : null,
          duration: master ? master.duration : durationSec,
          formattedDuration: formatSeconds(master ? master.duration : durationSec),
          thumbnail: master ? master.thumbnail : thumbnail,
          requester,
          source: 'spotify',
        });
      }
    } else if (spType === 'playlist' || spType === 'album') {
      const spData = (await playdl.spotify(url)) as any;
      const allTracks = await spData.all_tracks();
      for (const t of allTracks.slice(0, 100)) {
        const title = t.name;
        const artist = t.artists ? t.artists.map((a: any) => a.name).join(', ') : 'Unknown Artist';
        const durationSec = Math.floor((t.durationInSec || t.durationInMs / 1000) || 210);
        const thumbnail = t.thumbnail?.url || spData.thumbnail?.url || 'https://open.spotify.com/favicon.ico';

        tracks.push({
          title,
          author: artist,
          url: t.url || url,
          streamUrl: null,
          duration: durationSec,
          formattedDuration: formatSeconds(durationSec),
          thumbnail,
          requester,
          source: 'spotify',
        });
      }
    }
  } catch (err) {
    console.warn('play-dl Spotify extraction encountered error, attempting oEmbed fallback:', err);
    try {
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        const rawTitle = data.title || 'Unknown Spotify Track';
        const parts = rawTitle.split(' by ');
        const title = parts[0] || rawTitle;
        const artist = parts[1] || 'Spotify Artist';
        const master = await searchMasterAudio(`${title} ${artist}`);
        tracks.push({
          title,
          author: artist,
          url,
          streamUrl: master ? master.streamUrl : null,
          duration: master ? master.duration : 210,
          formattedDuration: formatSeconds(master ? master.duration : 210),
          thumbnail: data.thumbnail_url || 'https://open.spotify.com/favicon.ico',
          requester,
          source: 'spotify',
        });
      }
    } catch {}
  }

  return tracks;
}
