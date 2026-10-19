import { JamendoProvider } from './jamendo/jamendo.provider';
import { ProviderRegistryService } from './provider-registry.service';
import { UnifiedTrack } from './types';

describe('ProviderRegistryService', () => {
  let registry: ProviderRegistryService;
  let jamendoMock: jest.Mocked<JamendoProvider>;

  beforeEach(() => {
    jamendoMock = {
      id: 'jamendo',
      name: 'Jamendo Music',
      isEnabled: true,
      requiresAuth: false,
      search: jest.fn().mockResolvedValue({
        provider: 'jamendo',
        tracks: [],
        albums: [],
        artists: [],
        totalResults: 0,
      }),
      getTrack: jest.fn(),
      getPlayback: jest.fn(),
      getArtist: jest.fn(),
      getAlbum: jest.fn(),
    } as any;

    registry = new ProviderRegistryService(jamendoMock);
  });

  it('should register and retrieve Jamendo provider', () => {
    const provider = registry.getProvider('jamendo');
    expect(provider).toBeDefined();
    expect(provider.id).toBe('jamendo');
  });

  it('should deduplicate tracks by ISRC and normalized title + artist', () => {
    const sampleTracks: UnifiedTrack[] = [
      {
        id: 'jamendo:1',
        provider: 'jamendo',
        providerTrackId: '1',
        isrc: 'US-XYZ-23-00001',
        title: 'Midnight Sun (Original Mix)',
        artistName: 'Aurora Glow',
        duration: 200,
        streamFormat: 'mp3',
        license: 'CC BY',
        explicit: false,
      },
      {
        id: 'audius:99',
        provider: 'audius',
        providerTrackId: '99',
        isrc: 'US-XYZ-23-00001', // Same ISRC -> should deduplicate
        title: 'Midnight Sun',
        artistName: 'Aurora Glow',
        duration: 200,
        streamFormat: 'mp3',
        license: 'CC BY',
        explicit: false,
      },
      {
        id: 'archive:555',
        provider: 'archive',
        providerTrackId: '555',
        isrc: null,
        title: 'Midnight Sun [Remastered]', // Matches normalized title+artist
        artistName: 'Aurora Glow',
        duration: 200,
        streamFormat: 'mp3',
        license: 'Public Domain',
        explicit: false,
      },
      {
        id: 'jamendo:2',
        provider: 'jamendo',
        providerTrackId: '2',
        isrc: 'US-XYZ-23-00002',
        title: 'Ocean Deep',
        artistName: 'Blue Tide',
        duration: 180,
        streamFormat: 'mp3',
        license: 'CC BY',
        explicit: false,
      },
    ];

    const deduplicated = registry.deduplicateTracks(sampleTracks);

    // Only 'Midnight Sun' (1 copy) and 'Ocean Deep' (1 copy) should remain
    expect(deduplicated.length).toBe(2);
    expect(deduplicated[0].title).toBe('Midnight Sun (Original Mix)');
    expect(deduplicated[1].title).toBe('Ocean Deep');
  });

  it('should fan-out search to registered providers', async () => {
    await registry.search('synthwave');
    expect(jamendoMock.search).toHaveBeenCalledWith('synthwave', undefined);
  });
});
