import { UnifiedTrack } from '../types';
import { CURATED_OFFICIAL_HITS } from './officialMusic';
import { generateDailyMixes } from './recommendations';
import { getLikedTracks, getUserPlaylists, UserPlaylist } from './userPlaylists';

export interface PlaylistSummary {
  id: string;
  title: string;
  description: string;
  tracks?: UnifiedTrack[];
  coverArt?: string;
}

const picks: [keyof typeof CURATED_OFFICIAL_HITS, string, string][] = [
  ['todayTopHits', "Today's Top Hits", 'Pop essentials'],
  ['global50', 'Global Top 50', 'Global pop and chart favorites'],
  ['bollywoodHits', 'Hot Hits India', 'Bollywood and Hindi favorites'],
  ['chillLoFi', 'Chill Waves & Lo-Fi', 'Laid-back music for study and focus'],
];

export const curatedPlaylists: PlaylistSummary[] = picks.map(([id, title, description]) => ({
  id: 'collection-' + id,
  title,
  description,
  tracks: CURATED_OFFICIAL_HITS[id],
  coverArt: CURATED_OFFICIAL_HITS[id][0]?.artworkUrl || undefined,
}));

const rockTracks = [
  ...CURATED_OFFICIAL_HITS.global50,
  ...CURATED_OFFICIAL_HITS.todayTopHits,
].filter((track) => track.genres?.some((genre) => genre.includes('Rock') || genre === 'Indie Pop'));
export const rockAndPop = {
  id: 'collection-rock-pop',
  title: 'Rock & Pop Legends',
  description: 'Guitar anthems and indie pop',
  tracks: rockTracks,
  coverArt: rockTracks[0]?.artworkUrl,
};

export const playlistUrl = (id: string) => '/playlist?id=' + encodeURIComponent(id);

export function normalizeQuery(text: string) {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// One missing, extra or mistyped letter in a longer prefix (e.g. "arjit" for "arijit").
function nearPrefix(token: string, word: string) {
  if (token.length < 4 || word.length < token.length - 1) return false;
  let i = 0;
  while (i < token.length && token[i] === word[i]) i++;
  return (
    word.slice(i).startsWith(token.slice(i + 1)) ||
    word.slice(i + 1).startsWith(token.slice(i)) ||
    word.slice(i + 1).startsWith(token.slice(i + 1))
  );
}

function matchScore(query: string, title: string, keywords: string) {
  if (!query) return 1;
  const name = normalizeQuery(title);
  if (name === query) return 9;
  if (name.startsWith(query)) return 8;
  const tokens = query.split(' ');
  const titleWords = name.split(' ');
  if (tokens.every((token) => titleWords.some((word) => word.startsWith(token)))) return 7;
  if (name.replaceAll(' ', '').startsWith(query.replaceAll(' ', ''))) return 6;
  const words = [...titleWords, ...normalizeQuery(keywords).split(' ')];
  if (tokens.every((token) => words.some((word) => word.startsWith(token)))) return 5;
  return tokens.every((token) =>
    words.some((word) => word.startsWith(token) || nearPrefix(token, word)),
  )
    ? 2
    : 0;
}

export function rankSongs(input: string, tracks: UnifiedTrack[], limit: number, localOnly = false) {
  const query = normalizeQuery(input);
  if (!query) return [];
  return [...new Map(tracks.map((track) => [track.id, track])).values()]
    .map((track) => ({
      track,
      score: matchScore(query, track.title, track.artistName + ' ' + (track.albumName || '')),
    }))
    .filter((item) => !localOnly || item.score)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.track);
}

export function localPlaylists(): PlaylistSummary[] {
  const liked = getLikedTracks();
  return [
    ...getUserPlaylists().map((p: UserPlaylist) => ({
      ...p,
      description: p.description || 'Your playlist',
    })),
    {
      id: 'liked',
      title: 'Liked Songs',
      description: 'Your favorites',
      tracks: liked,
      coverArt: liked[0]?.artworkUrl || undefined,
    },
    ...curatedPlaylists,
    rockAndPop,
    ...generateDailyMixes().map((mix) => ({
      id: mix.id,
      title: mix.title,
      description: mix.description,
      tracks: [...new Map(mix.tracks.map((t) => [t.id, t])).values()],
      coverArt: mix.tracks[0]?.artworkUrl || undefined,
    })),
  ];
}

export function findPlaylists(input: string) {
  const query = normalizeQuery(input);
  return localPlaylists()
    .map((playlist) => ({
      playlist,
      score: matchScore(
        query,
        playlist.title,
        [
          playlist.description,
          ...(playlist.tracks || []).map((t) => t.artistName + ' ' + t.title),
        ].join(' '),
      ),
    }))
    .filter((item) => item.score)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.playlist);
}

export function localTracks(input: string, limit: number) {
  if (!input.trim()) return [];
  return rankSongs(
    input,
    localPlaylists().flatMap((list) => list.tracks || []),
    limit,
    true,
  );
}

async function jamendo<T>(
  method: string,
  params: Record<string, string>,
  signal: AbortSignal,
): Promise<T[]> {
  const query = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID || '17ed92bf',
    format: 'json',
    ...params,
  });
  const response = await fetch('https://api.jamendo.com/v3.0/' + method + '/?' + query, { signal });
  if (!response.ok) throw new Error('Playlist catalog unavailable');
  const data = await response.json();
  if (data.headers?.status !== 'success') throw new Error('Playlist catalog unavailable');
  return data.results;
}

interface RemoteList {
  id: string;
  name: string;
}
interface RemoteTrack {
  id: string;
  name: string;
  artist_name: string;
  duration: string;
  image: string;
  audio: string;
  license_ccurl: string;
  audiodownload_allowed: boolean;
}
export async function searchPublicPlaylists(
  query: string,
  signal: AbortSignal,
): Promise<PlaylistSummary[]> {
  const lists = await jamendo<RemoteList>('playlists', { namesearch: query, limit: '8' }, signal);
  return lists.map((p) => ({
    id: 'jamendo-list-' + p.id,
    title: p.name,
    description: 'Jamendo playlist',
  }));
}

export async function loadPublicPlaylist(
  id: string,
  signal: AbortSignal,
): Promise<PlaylistSummary | undefined> {
  const [info] = await jamendo<RemoteList>('playlists', { id }, signal);
  if (!info) return undefined;
  const tracks = new Map<string, UnifiedTrack>();
  for (let offset = 0; ; offset += 200) {
    const [page] = await jamendo<{ tracks: RemoteTrack[] }>(
      'playlists/tracks',
      {
        id,
        offset: String(offset),
        limit: '200',
        track_type: 'single albumtrack',
        order: 'track_position',
        audioformat: 'mp32',
      },
      signal,
    );
    const batch = page?.tracks || [];
    const previous = tracks.size;
    for (const t of batch)
      tracks.set(t.id, {
        id: 'jamendo:' + t.id,
        provider: 'jamendo',
        providerTrackId: t.id,
        title: t.name,
        artistName: t.artist_name,
        duration: Number(t.duration),
        artworkUrl: t.image,
        streamUrl: t.audio,
        streamFormat: 'mp3',
        license: t.license_ccurl,
        licenseUrl: t.license_ccurl,
        explicit: false,
        audioDownloadAllowed: t.audiodownload_allowed,
      });
    if (batch.length < 200 || tracks.size === previous) break;
  }
  return {
    id: 'jamendo-list-' + id,
    title: info.name,
    description: 'Jamendo playlist',
    tracks: [...tracks.values()],
  };
}
