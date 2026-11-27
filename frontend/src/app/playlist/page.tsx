'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ListMusic, Pause, Play, Plus, Minus } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { PlaylistSummary, localPlaylists, loadPublicPlaylist } from '../../lib/playlistCatalog';
import {
  createCustomUserPlaylist,
  addTrackToExistingPlaylist,
  getUserPlaylists,
  saveUserPlaylist,
} from '../../lib/userPlaylists';
import { useSongSearch } from '../../lib/useSongSearch';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { notify } from '../../components/InterfaceEffects';
import CatalogSkeleton from '../../components/CatalogSkeleton';

function Collection({ id }: { id: string }) {
  const router = useRouter();
  const [list, setList] = useState<PlaylistSummary>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const result = useSongSearch(query, 8);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const queue = usePlayerStore((state) => state.queue);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  useEffect(() => {
    const abort = new AbortController();
    const refresh = () => setList(localPlaylists().find((p) => p.id === id));
    const remoteId = /^jamendo-list-(\d+)$/.exec(id);
    if (remoteId) {
      setLoading(true);
      setError(false);
      loadPublicPlaylist(remoteId[1], abort.signal)
        .then((value) => {
          if (!abort.signal.aborted) setList(value);
        })
        .catch(() => {
          if (!abort.signal.aborted) setError(true);
        })
        .finally(() => {
          if (!abort.signal.aborted) setLoading(false);
        });
      return () => abort.abort();
    }
    refresh();
    setLoading(false);
    const events = ['storage', 'wavelength_playlists_updated', 'wavelength_liked_tracks_updated'];
    events.forEach((e) => window.addEventListener(e, refresh));
    return () => events.forEach((e) => window.removeEventListener(e, refresh));
  }, [id, attempt]);

  if (loading) return <CatalogSkeleton label="Loading playlist" />;
  if (error)
    return (
      <div role="alert">
        Playlist unavailable. <button onClick={() => setAttempt((n) => n + 1)}>Try again</button>
      </div>
    );
  if (!list)
    return (
      <div>
        <h1 className="wl-heading">Playlist unavailable</h1>
        <Link href="/library">Back to library</Link>
      </div>
    );
  const tracks = list.tracks || [];
  const activeQueue =
    !!currentTrack &&
    tracks.length === queue.length &&
    tracks.every((track, index) => track.id === queue[index].id);
  const playingList = activeQueue && isPlaying;
  const editable = getUserPlaylists().some((p) => p.id === id);
  return (
    <>
      <Link href="/library" className="text-sm text-spotify-subtext">
        Your library
      </Link>
      <header className="wl-collection-header">
        <div className="wl-collection-cover">
          <ListMusic size={48} />
          {(list.coverArt || tracks[0]?.artworkUrl) && (
            <img
              src={list.coverArt || tracks[0]?.artworkUrl || ''}
              alt=""
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          )}
        </div>
        <div className="min-w-0 grid gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-spotify-subtext">
            Playlist
          </span>
          <h1 className="wl-heading break-words font-bold">{list.title}</h1>
          <p className="text-sm text-spotify-subtext">
            {list.description} · {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </p>
          <button
            disabled={!tracks.length}
            onClick={() => (activeQueue ? togglePlay() : setTrack(tracks[0], tracks))}
            className="mt-2 flex w-fit items-center gap-2 rounded-full bg-spotify-green px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {playingList ? <Pause size={16} /> : <Play size={16} />}
            {playingList ? 'Pause playlist' : 'Play playlist'}
          </button>
          {!editable && id !== 'liked' && (
            <button
              className="w-fit text-sm text-spotify-green"
              onClick={() => {
                try {
                  const saved = createCustomUserPlaylist(list.title, tracks, list.description);
                  notify('Saved to your library');
                  router.push('/playlist?id=' + encodeURIComponent(saved.id));
                } catch {
                  notify('Could not save this playlist');
                }
              }}
            >
              Save a copy to library
            </button>
          )}
        </div>
      </header>
      <ol>
        {tracks.map((track, index) => (
          <li key={track.id} className="flex items-center border-b border-spotify-border/40">
            <button
              className="wl-list-row flex-1 text-left"
              onClick={() =>
                activeQueue && currentTrack?.id === track.id
                  ? togglePlay()
                  : setTrack(track, tracks)
              }
              aria-label={
                (playingList && currentTrack?.id === track.id ? 'Pause ' : 'Play ') + track.title
              }
              aria-current={activeQueue && currentTrack?.id === track.id ? 'true' : undefined}
            >
              <span className="w-6 text-xs text-spotify-subtext">{index + 1}</span>
              <span className="min-w-0">
                <strong
                  className={
                    activeQueue && currentTrack?.id === track.id
                      ? 'block truncate text-spotify-green'
                      : 'block truncate'
                  }
                >
                  {track.title}
                </strong>
                <span className="text-xs text-spotify-subtext">{track.artistName}</span>
              </span>
            </button>
            {editable && (
              <button
                className="wl-icon-button"
                aria-label={'Remove ' + track.title}
                onClick={() => {
                  const current = getUserPlaylists().find((p) => p.id === id);
                  if (current) {
                    const remaining = current.tracks.filter((t) => t.id !== track.id);
                    const saved = saveUserPlaylist({
                      ...current,
                      tracks: remaining,
                      coverArt: remaining[0]?.artworkUrl || undefined,
                    });
                    notify(saved.length ? 'Track removed' : 'Could not save this change');
                  }
                }}
              >
                <Minus size={16} />
              </button>
            )}
          </li>
        ))}
      </ol>
      {!tracks.length && (
        <p className="text-spotify-subtext">
          {editable ? 'Add the first song below.' : 'No tracks available in this playlist.'}
        </p>
      )}
      {editable && (
        <section className="grid gap-3">
          <label htmlFor="playlist-song" className="text-xl font-bold">
            Add songs
          </label>
          <input
            id="playlist-song"
            placeholder="Song or artist"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="wl-search-field"
          />
          {result.tracks.map((track) => (
            <button
              key={track.id}
              disabled={tracks.some((t) => t.id === track.id)}
              className="wl-list-row text-left disabled:opacity-60"
              onClick={() => {
                notify(
                  addTrackToExistingPlaylist(id, track)
                    ? 'Added to playlist'
                    : 'Could not save track',
                );
              }}
            >
              <Plus size={16} />
              <span>
                {track.title} · {track.artistName}
              </span>
            </button>
          ))}
          {query && !result.tracks.length && (
            <p role="status">{result.loading ? 'Searching…' : 'No songs found.'}</p>
          )}
        </section>
      )}
    </>
  );
}

function PlaylistRoute() {
  const id = useSearchParams().get('id') || '';
  return <Collection key={id} id={id} />;
}

export default function PlaylistPage() {
  return (
    <div className="grid gap-6 p-4 text-spotify-text md:p-8">
      <Suspense fallback={<CatalogSkeleton label="Loading playlist" />}>
        <PlaylistRoute />
      </Suspense>
    </div>
  );
}
