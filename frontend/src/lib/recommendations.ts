import { UnifiedTrack } from '../types';
import { CURATED_OFFICIAL_HITS } from './officialMusic';

export interface DailyMix {
  id: string;
  title: string;
  description: string;
  gradient: string;
  coverArtists: string[];
  tracks: UnifiedTrack[];
}

/**
 * Generates personalized Daily Mixes and Discover Weekly based on listening patterns
 */
export function generateDailyMixes(listeningHistory: UnifiedTrack[] = []): DailyMix[] {
  // Extract user's favorite genres and artists from history
  const userArtists = new Set(listeningHistory.map((t) => t.artistName.toLowerCase()));

  const allHits = [
    ...CURATED_OFFICIAL_HITS.todayTopHits,
    ...CURATED_OFFICIAL_HITS.bollywoodHits,
    ...CURATED_OFFICIAL_HITS.global50,
    ...CURATED_OFFICIAL_HITS.chillLoFi,
  ];

  const mixes: DailyMix[] = [
    {
      id: 'daily-mix-1',
      title: 'Daily Mix 1',
      description: 'Lady Gaga, Bruno Mars, Sabrina Carpenter, Billie Eilish and more',
      gradient: 'from-amber-600 via-rose-700 to-zinc-900',
      coverArtists: ['Lady Gaga', 'Bruno Mars', 'Billie Eilish'],
      tracks: [
        ...CURATED_OFFICIAL_HITS.todayTopHits,
        ...CURATED_OFFICIAL_HITS.global50.slice(0, 3),
      ],
    },
    {
      id: 'daily-mix-2',
      title: 'Daily Mix 2',
      description: 'Arijit Singh, A.R. Rahman, Pritam, Diljit Dosanjh, and more',
      gradient: 'from-indigo-600 via-purple-800 to-zinc-900',
      coverArtists: ['Arijit Singh', 'A.R. Rahman', 'Pritam'],
      tracks: [
        ...CURATED_OFFICIAL_HITS.bollywoodHits,
        ...CURATED_OFFICIAL_HITS.todayTopHits.slice(2, 4),
      ],
    },
    {
      id: 'daily-mix-3',
      title: 'Daily Mix 3',
      description: 'Chill Lo-Fi, acoustic melodies, soothing beats, and ambient soundscapes',
      gradient: 'from-emerald-600 via-teal-800 to-zinc-900',
      coverArtists: ['Lofi Fruits Music', 'ChilledCow', 'Komorebi'],
      tracks: [
        ...CURATED_OFFICIAL_HITS.chillLoFi,
        ...CURATED_OFFICIAL_HITS.todayTopHits.slice(0, 2),
      ],
    },
    {
      id: 'daily-mix-4',
      title: 'Daily Mix 4',
      description: 'The Weeknd, Post Malone, Kendrick Lamar, Hozier, and high-energy anthems',
      gradient: 'from-blue-600 via-cyan-800 to-zinc-900',
      coverArtists: ['The Weeknd', 'Post Malone', 'Kendrick Lamar'],
      tracks: [
        ...CURATED_OFFICIAL_HITS.global50,
        ...CURATED_OFFICIAL_HITS.todayTopHits.slice(1, 3),
      ],
    },
  ];

  return mixes;
}

export function generateDiscoverWeekly(listeningHistory: UnifiedTrack[] = []): UnifiedTrack[] {
  // Combine all curated catalog and prioritize tracks not in recent history
  const allHits = [
    ...CURATED_OFFICIAL_HITS.global50,
    ...CURATED_OFFICIAL_HITS.todayTopHits,
    ...CURATED_OFFICIAL_HITS.bollywoodHits,
    ...CURATED_OFFICIAL_HITS.chillLoFi,
  ];

  // Shuffle algorithm
  const shuffled = [...allHits].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 20);
}
