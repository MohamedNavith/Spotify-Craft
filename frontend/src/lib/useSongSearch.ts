'use client';

import { useEffect, useState } from 'react';
import { UnifiedTrack } from '../types';
import { searchTracks } from './api';
import { localTracks, rankSongs } from './playlistCatalog';

export function useSongSearch(input: string, limit = 20) {
  const query = input.trim();
  const [result, setResult] = useState({
    query: '',
    tracks: [] as UnifiedTrack[],
    loading: false,
    failed: false,
  });
  useEffect(() => {
    let active = true;
    const local = localTracks(query, limit);
    setResult({ query, tracks: local, loading: !!query, failed: false });
    if (!query) return;
    const timer = setTimeout(async () => {
      try {
        const remote = await searchTracks(query, limit, true);
        const tracks = rankSongs(query, [...local, ...remote.tracks], limit);
        if (active) setResult({ query, tracks, loading: false, failed: false });
      } catch {
        if (active) setResult({ query, tracks: local, loading: false, failed: true });
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, limit]);
  return result.query === query ? result : { query, tracks: [], loading: !!query, failed: false };
}
