import { useState } from 'react';
import type { FC } from 'react';
import { Play } from 'lucide-react';

interface Trailer {
  id: number;
  name: string;
  youtube_id: string;
}

interface Props {
  trailers: Trailer[];
}

// A YouTube id is short and URL-safe; anything else is skipped rather than put into a URL.
const VALID_ID = /^[\w-]{6,20}$/;

// Some games have 20 or more trailers; the rest wait behind "Show all".
const SHOWN = 5;

/**
 * Trailers come from YouTube. Until a visitor presses play, only a thumbnail image loads: no player,
 * no cookies. Then YouTube's privacy-enhanced player (youtube-nocookie.com) plays it.
 */
const YouTubeTrailer: FC<Props> = ({ trailers }) => {
  const playable = trailers.filter((trailer) => VALID_ID.test(trailer.youtube_id));
  const [chosen, setChosen] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (playable.length === 0) return null;
  const trailer = playable[Math.min(chosen, playable.length - 1)];

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-100 mb-3">Trailers</h2>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${trailer.youtube_id}?autoplay=1&rel=0`}
            title={trailer.name}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            aria-label={`Play trailer: ${trailer.name}`}
            className="absolute inset-0 w-full h-full group cursor-pointer"
          >
            <img
              src={`https://i.ytimg.com/vi/${trailer.youtube_id}/hqdefault.jpg`}
              alt=""
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-16 h-16 rounded-full bg-accent/90 group-hover:bg-accent flex items-center justify-center shadow-lg transition-colors">
                <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>

      {playable.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {(showAll ? playable : playable.slice(0, SHOWN)).map((item, index) => (
            <button
              key={item.id}
              onClick={() => { setChosen(index); setPlaying(false); }}
              aria-pressed={item === trailer}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                item === trailer ? 'bg-accent text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {item.name}
            </button>
          ))}
          {!showAll && playable.length > SHOWN && (
            <button
              onClick={() => setShowAll(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer text-accent ring-1 ring-accent/40 hover:bg-accent/10"
            >
              Show all ({playable.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default YouTubeTrailer;
