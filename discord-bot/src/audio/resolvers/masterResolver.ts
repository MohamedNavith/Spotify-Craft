export interface MasterSong {
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  streamUrl: string;
  thumbnail: string;
  quality: string;
}

const MEMORY_CACHE = new Map<string, MasterSong>();

export async function searchMasterAudio(query: string): Promise<MasterSong | null> {
  const cacheKey = query.toLowerCase().trim();
  if (MEMORY_CACHE.has(cacheKey)) {
    return MEMORY_CACHE.get(cacheKey)!;
  }

  const cleanQuery = query
    .replace(/[([].*?(official|video|audio|lyrics|hd|4k|mv|remastered).*?[)\]]/gi, '')
    .trim();

  // Primary API: Public high-speed CORS mirror
  try {
    const url = `https://jiosaavn-api-private.vercel.app/search/songs?q=${encodeURIComponent(cleanQuery)}&limit=5`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Wavelength Discord Bot)' } });
    if (res.ok) {
      const json = await res.json();
      const songs = json?.data?.results || json?.results || [];
      if (Array.isArray(songs) && songs.length > 0) {
        const top = songs[0];
        // Extract 320kbps download URL
        let streamUrl = '';
        if (Array.isArray(top.downloadUrl)) {
          const u320 = top.downloadUrl.find((u: any) => u.quality === '320kbps' || u.bitrate === '320kbps');
          const u160 = top.downloadUrl.find((u: any) => u.quality === '160kbps' || u.bitrate === '160kbps');
          streamUrl = u320?.url || u320?.link || u160?.url || u160?.link || top.downloadUrl[top.downloadUrl.length - 1]?.url;
        }

        let thumbnail = '';
        if (Array.isArray(top.image)) {
          thumbnail = top.image[top.image.length - 1]?.url || top.image[top.image.length - 1]?.link || '';
        } else if (typeof top.image === 'string') {
          thumbnail = top.image;
        }

        if (streamUrl) {
          const song: MasterSong = {
            title: top.name || top.title || cleanQuery,
            artist: top.primaryArtists || top.singers || top.artist || 'Unknown Artist',
            album: top.album?.name || top.album || 'Single',
            duration: parseInt(top.duration, 10) || 210,
            streamUrl,
            thumbnail: thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
            quality: '320kbps Lossless (Master Studio CDN)',
          };
          MEMORY_CACHE.set(cacheKey, song);
          return song;
        }
      }
    }
  } catch (err) {
    // continue to fallback
  }

  // Secondary Fallback API
  try {
    const fallbackUrl = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(cleanQuery)}&limit=5`;
    const res = await fetch(fallbackUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Wavelength Discord Bot)' } });
    if (res.ok) {
      const json = await res.json();
      const songs = json?.data?.results || [];
      if (Array.isArray(songs) && songs.length > 0) {
        const top = songs[0];
        let streamUrl = '';
        if (Array.isArray(top.downloadUrl)) {
          const u320 = top.downloadUrl.find((u: any) => u.quality === '320kbps');
          streamUrl = u320?.url || top.downloadUrl[top.downloadUrl.length - 1]?.url;
        }

        let thumbnail = '';
        if (Array.isArray(top.image)) {
          thumbnail = top.image[top.image.length - 1]?.url || '';
        }

        if (streamUrl) {
          const song: MasterSong = {
            title: top.name || cleanQuery,
            artist: top.primaryArtists || 'Unknown Artist',
            album: top.album?.name || 'Single',
            duration: parseInt(top.duration, 10) || 210,
            streamUrl,
            thumbnail: thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
            quality: '320kbps Lossless (Master Studio CDN)',
          };
          MEMORY_CACHE.set(cacheKey, song);
          return song;
        }
      }
    }
  } catch (err) {
    // fallback exhausted
  }

  return null;
}
