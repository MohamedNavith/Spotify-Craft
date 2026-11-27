'use client';

import { MoreHorizontal, Pause, Play } from 'lucide-react';
import { useRef, useState } from 'react';
import { addTrackToExistingPlaylist, getUserPlaylists, UserPlaylist } from '../lib/userPlaylists';
import { notify } from './InterfaceEffects';
import { usePlayerStore } from '../stores/usePlayerStore';
import { UnifiedTrack } from '../types';

interface TrackCardProps {
  track: UnifiedTrack;
  queue?: UnifiedTrack[];
}

export default function TrackCard({ track, queue }: TrackCardProps) {
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const setTrack = usePlayerStore(state => state.setTrack);
  const togglePlay = usePlayerStore(state => state.togglePlay);
  const addToQueue = usePlayerStore(state => state.addToQueue);
  const likedTrackIds = usePlayerStore(state => state.likedTrackIds);
  const toggleLike = usePlayerStore(state => state.toggleLike);
  const actions = useRef<HTMLDetailsElement>(null);
  const [destinations,setDestinations] = useState<UserPlaylist[]>([]);
  const isCurrent = currentTrack?.id === track.id;
  const isActive = isCurrent && isPlaying;
  const actionLabel = `${isActive ? 'Pause' : 'Play'} ${track.title}`;
  const isLiked = likedTrackIds.has(track.id);

  function play() {
    if (isCurrent) togglePlay();
    else setTrack(track, queue);
  }

  function dismissActions() {
    if (!actions.current) return;
    actions.current.open = false;
    actions.current.querySelector('summary')?.focus();
  }

  return (
    <article
      className="wl-card group relative grid min-w-0 gap-3 p-3"
      onContextMenu={event => {
        if (!actions.current) return;
        event.preventDefault();
        actions.current.open = true;
        actions.current.querySelector('button')?.focus();
      }}
    >
      <button type="button" onClick={play} aria-label={actionLabel} title={actionLabel} className="grid gap-3 text-left min-w-0">
        <div className="relative aspect-square overflow-hidden rounded-[var(--wl-radius-sm)] bg-spotify-elevated">
          <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-2xl font-bold text-spotify-subtext">W</span>
          {track.artworkUrl && (
            <img src={track.artworkUrl} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }}
              className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span data-current={isCurrent} className="wl-card-play absolute bottom-2 right-2 grid size-11 place-items-center rounded-full bg-spotify-green text-black shadow-lg">
            {isActive ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
          </span>
        </div>
        <span className="grid min-w-0 gap-1">
          <span className={`wl-card-title truncate text-sm font-bold ${isCurrent ? 'text-spotify-green' : 'text-spotify-text'}`}>{track.title}</span>
          <span className="truncate text-xs text-spotify-subtext">{track.artistName}</span>
          {track.license && <span className="truncate text-xs text-spotify-subtext">{track.license}</span>}
        </span>
      </button>
      <details ref={actions} onToggle={event => { if (event.currentTarget.open) setDestinations(getUserPlaylists()); }} className="absolute right-4 top-4 z-10" onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }} onKeyDown={event => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          dismissActions();
        }
      }}>
        <summary aria-label={`More actions for ${track.title}`} title="Track actions"
          className="grid size-8 cursor-pointer list-none place-items-center rounded-full bg-black/75 text-white">
          <MoreHorizontal size={17} />
        </summary>
        <div className="absolute right-0 top-10 grid w-36 rounded-lg border border-spotify-border bg-spotify-card p-1 text-xs text-spotify-text shadow-xl">
          <button type="button" className="rounded p-2 text-left hover:bg-spotify-hover" onClick={() => {
            addToQueue(track);
            dismissActions();
            notify('Added to queue');
          }}>Add to queue</button>
          {destinations.length > 0 && <label className="grid gap-1 p-2">Add to playlist
            <select aria-label="Choose playlist" className="rounded bg-spotify-base p-1" value="" onChange={event=>{
              const saved=addTrackToExistingPlaylist(event.target.value,track);
              dismissActions();
              notify(saved ? 'Saved to '+saved.title : 'Could not save track');
            }}><option value="" disabled>Choose playlist</option>
              {destinations.map(list=><option key={list.id} value={list.id}>{list.title}</option>)}
            </select>
          </label>}
          <button type="button" className="rounded p-2 text-left hover:bg-spotify-hover" onClick={() => {
            toggleLike(track);
            dismissActions();
            notify(isLiked ? 'Removed from Liked Songs' : 'Saved to Liked Songs');
          }}>{isLiked ? 'Unlike track' : 'Like track'}</button>
        </div>
      </details>
    </article>
  );
}
