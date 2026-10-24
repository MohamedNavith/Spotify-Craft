import playdl from 'play-dl';
import { Requester, Track } from '../types';
import { searchMasterAudio } from './masterResolver';

export function isSpotifyUrl(url: string): boolean {
  return /^(https?:\/\/)?(open\.)?spotify\.com\/(track|playlist|album|artist)\/[a-zA-Z0-9]+/.test(url);
}

export function formatSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export async function resolveSpotify(url: string, requester: Requester): Promise<Track[]> {
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

        // Try direct master CDN first for instant 320kbps lossless streaming
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
        // limit to 100 per import
        const title = t.name;
        const artist = t.artists ? t.artists.map((a: any) => a.name).join(', ') : 'Unknown Artist';
        const durationSec = Math.floor((t.durationInSec || t.durationInMs / 1000) || 210);
        const thumbnail = t.thumbnail?.url || spData.thumbnail?.url || 'https://open.spotify.com/favicon.ico';

        tracks.push({
          title,
          author: artist,
          url: t.url || url,
          streamUrl: null, // lazily resolved when played
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
    // oEmbed fallback for single track
    try {
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        const rawTitle = data.title || 'Unknown Spotify Track';
        // Format typically "Song Title by Artist"
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
