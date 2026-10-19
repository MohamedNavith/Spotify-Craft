import { JamendoProvider } from './jamendo.provider';

describe('JamendoProvider', () => {
  let provider: JamendoProvider;

  beforeEach(() => {
    provider = new JamendoProvider({
      get: (k: string) => (k === 'JAMENDO_CLIENT_ID' ? 'test_client_id' : 'https://api.jamendo.com/v3.0'),
    } as any);
  });

  it('should initialize with correct metadata and enabled state', () => {
    expect(provider.id).toBe('jamendo');
    expect(provider.name).toBe('Jamendo Music');
    expect(provider.isEnabled).toBe(true);
    expect(provider.requiresAuth).toBe(false);
  });

  it('should map a raw Jamendo track to UnifiedTrack with CC license', () => {
    const rawTrack = {
      id: '12345',
      name: 'Starlight Dream',
      duration: 215,
      artist_id: '888',
      artist_name: 'Cosmic Voyager',
      album_id: '999',
      album_name: 'Galaxies',
      audio: 'https://prod-1.storage.jamendo.com/?trackid=12345&format=mp32',
      image: 'https://usercontent.jamendo.com?type=album&id=999',
      license_ccurl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      releasedate: '2023-05-10',
      audiodownload_allowed: true,
      musicinfo: {
        tags: {
          genres: ['ambient', 'electronic'],
        },
      },
    };

    const unified = provider.mapTrack(rawTrack);

    expect(unified.id).toBe('jamendo:12345');
    expect(unified.provider).toBe('jamendo');
    expect(unified.title).toBe('Starlight Dream');
    expect(unified.artistName).toBe('Cosmic Voyager');
    expect(unified.artistId).toBe('jamendo:888');
    expect(unified.albumName).toBe('Galaxies');
    expect(unified.albumId).toBe('jamendo:999');
    expect(unified.duration).toBe(215);
    expect(unified.streamFormat).toBe('mp3');
    expect(unified.streamUrl).toBe(rawTrack.audio);
    expect(unified.license).toContain('Creative Commons');
    expect(unified.licenseUrl).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
    expect(unified.genres).toEqual(['ambient', 'electronic']);
    expect(unified.audioDownloadAllowed).toBe(true);
    expect(unified.year).toBe(2023);
  });

  it('should map Jamendo artist and albums correctly', () => {
    const rawArtist = {
      id: '888',
      name: 'Cosmic Voyager',
      website: 'https://cosmic.example.com',
      image: 'https://img.jamendo.com/artist.jpg',
    };

    const unifiedArtist = provider.mapArtist(rawArtist);
    expect(unifiedArtist.id).toBe('jamendo:888');
    expect(unifiedArtist.name).toBe('Cosmic Voyager');
    expect(unifiedArtist.website).toBe('https://cosmic.example.com');

    const rawAlbum = {
      id: '999',
      name: 'Galaxies',
      artist_id: '888',
      artist_name: 'Cosmic Voyager',
      image: 'https://img.jamendo.com/album.jpg',
      releasedate: '2023-01-01',
    };

    const unifiedAlbum = provider.mapAlbum(rawAlbum);
    expect(unifiedAlbum.id).toBe('jamendo:999');
    expect(unifiedAlbum.title).toBe('Galaxies');
    expect(unifiedAlbum.artistName).toBe('Cosmic Voyager');
    expect(unifiedAlbum.artistId).toBe('jamendo:888');
  });
});
