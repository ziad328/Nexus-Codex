import { memo } from 'react';
import type { FC } from 'react';
import { Gamepad2, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useGenres from '../../hooks/useGenres';
import type { Genre } from '../../types';
import GenreSkeleton from '../shared/GenreSkeleton';
import useAppSelector from '../../hooks/useAppSelector';

interface Props {
  selectedGenre: Genre | null;
  onSelectGenre: (genre: Genre | null) => void;
}

const Sidebar: FC<Props> = ({ selectedGenre, onSelectGenre }) => {
  const { data, isLoading, error } = useGenres();
  const location = useLocation();
  const favCount = useAppSelector((s) => s.favorites.items.length);

  if (error) return null;

  return (
    <aside className="w-full lg:w-64 shrink-0 lg:pr-8">

      <Link
        to="/favorites"
        className={`flex items-center gap-3 w-full p-2 mb-4 rounded-xl transition-all duration-300 hover:bg-background-card group ${
          location.pathname === '/favorites'
            ? 'bg-background-card ring-1 ring-accent text-white shadow-[0_0_15px_rgba(239,68,68,0.1)]'
            : 'text-gray-400'
        }`}
      >
        <div className="w-8 h-8 shrink-0 bg-zinc-800 rounded-lg flex items-center justify-center transition-colors">
          <Heart className={`w-4 h-4 ${location.pathname === '/favorites' ? 'fill-accent text-accent' : 'group-hover:text-accent'}`} />
        </div>
        <span className={`text-left text-lg ${location.pathname === '/favorites' ? 'font-bold' : 'font-normal'}`}>
          Favorites
        </span>
        {favCount > 0 && (
          <span className="ml-auto text-xs font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full">
            {favCount}
          </span>
        )}
      </Link>

      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 px-2">
        Genres
      </h2>
      <div className="flex flex-col gap-0.5">
        {isLoading && Array.from({ length: 15 }).map((_, i) => <GenreSkeleton key={i} />)}

        {!isLoading && (
          <button
            onClick={() => onSelectGenre(null)}
            className={`flex items-center gap-3 w-full p-2 transition-all duration-300 rounded-xl hover:bg-background-card ${selectedGenre === null
                ? 'bg-background-card ring-1 ring-accent text-white shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'text-gray-400 border border-transparent'
              }`}
          >
            <div className="w-8 h-8 shrink-0 bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span className={`text-left text-lg ${selectedGenre === null ? 'font-bold' : 'font-normal'}`}>
              All Games
            </span>
          </button>
        )}

        {data.map(genre => (
          <button
            key={genre.id}
            onClick={() => onSelectGenre(genre)}
            className={`flex items-center gap-3 w-full p-2 transition-all duration-300 rounded-xl hover:bg-background-card ${selectedGenre?.id === genre.id
                ? 'bg-background-card ring-1 ring-accent text-white shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'text-gray-400 border border-transparent'
              }`}
          >
            <div className="w-8 h-8 shrink-0 bg-background-card rounded-lg overflow-hidden">
              <img
                src={genre.image_background}
                className="w-full h-full object-cover filter brightness-75"
                alt={genre.name}
              />
            </div>
            <span className={`text-left text-lg ${selectedGenre?.id === genre.id ? 'font-bold' : 'font-normal'}`}>
              {genre.name}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default memo(Sidebar);
