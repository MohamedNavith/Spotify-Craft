import Link from 'next/link';
import { ListMusic } from 'lucide-react';
import { PlaylistSummary, playlistUrl } from '../lib/playlistCatalog';

export default function PlaylistRow({
  list,
  onSelect,
}: {
  list: PlaylistSummary;
  onSelect?: () => void;
}) {
  return (
    <Link href={playlistUrl(list.id)} onClick={onSelect} className="wl-list-row">
      <span className="wl-list-cover">
        <ListMusic size={20} />
        {list.coverArt && (
          <img
            loading="lazy"
            src={list.coverArt}
            alt=""
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}
      </span>
      <span className="min-w-0">
        <strong className="block truncate">{list.title}</strong>
        <span className="text-xs text-spotify-subtext">
          {list.description === 'Jamendo playlist' ? 'Jamendo playlist' : 'Playlist'}
          {list.tracks && ' · ' + list.tracks.length + (list.tracks.length === 1 ? ' track' : ' tracks')}
        </span>
      </span>
    </Link>
  );
}
