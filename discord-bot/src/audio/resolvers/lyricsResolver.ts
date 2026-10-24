export interface LyricsResult {
  title: string;
  artist: string;
  plainLyrics: string;
  syncedLyrics?: string;
}

export async function fetchLyrics(title: string, artist?: string): Promise<LyricsResult | null> {
  const cleanTitle = title
    .replace(/[([].*?(official|video|audio|lyrics|hd|4k|mv|remastered).*?[)\]]/gi, '')
    .trim();
  const cleanArtist = (artist || '')
    .replace(/[([].*?[)\]]/g, '')
    .split(',')[0]
    .trim();

  // Try exact lookup from LRCLIB
  try {
    const params = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: cleanArtist,
    });
    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: { 'User-Agent': 'Wavelength-Discord-Bot/1.0 (https://github.com/MohamedNavith/Spotify-Craft)' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.plainLyrics || data.syncedLyrics)) {
        return {
          title: data.trackName || cleanTitle,
          artist: data.artistName || cleanArtist,
          plainLyrics: data.plainLyrics || data.syncedLyrics,
          syncedLyrics: data.syncedLyrics,
        };
      }
    }
  } catch (err) {}

  // Fallback to LRCLIB search
  try {
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`, {
      headers: { 'User-Agent': 'Wavelength-Discord-Bot/1.0 (https://github.com/MohamedNavith/Spotify-Craft)' },
    });
    if (res.ok) {
      const hits = await res.json();
      if (Array.isArray(hits) && hits.length > 0) {
        const top = hits[0];
        return {
          title: top.trackName || cleanTitle,
          artist: top.artistName || cleanArtist,
          plainLyrics: top.plainLyrics || top.syncedLyrics,
          syncedLyrics: top.syncedLyrics,
        };
      }
    }
  } catch (err) {}

  return null;
}
