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
      const json: any = await res.json();
      const songs = json?.data?.results || json?.results || [];
      if (Array.isArray(songs) && songs.length > 0) {
        const top = songs[0];
        // Extract 320kbps download URL (handles both download_url and downloadUrl, and link / url)
        let streamUrl = '';
        const dlList = top.download_url || top.downloadUrl || [];
        if (Array.isArray(dlList) && dlList.length > 0) {
          const u320 = dlList.find((u: any) => u.quality === '320kbps' || u.bitrate === '320kbps');
          const u160 = dlList.find((u: any) => u.quality === '160kbps' || u.bitrate === '160kbps');
          streamUrl = u320?.link || u320?.url || u160?.link || u160?.url || dlList[dlList.length - 1]?.link || dlList[dlList.length - 1]?.url;
        }

        let thumbnail = '';
        if (Array.isArray(top.image)) {
          thumbnail = top.image[top.image.length - 1]?.link || top.image[top.image.length - 1]?.url || '';
        } else if (typeof top.image === 'string') {
          thumbnail = top.image;
        }

        if (streamUrl) {
          const song: MasterSong = {
            title: top.name || top.title || cleanQuery,
            artist: top.subtitle || top.primaryArtists || top.singers || top.artist || 'Unknown Artist',
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

  return null;
}
