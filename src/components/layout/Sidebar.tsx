import { memo } from 'react';
import type { FC } from 'react';
import { Gamepad2, BookMarked } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import useGenres from '../../hooks/useGenres';
import GenreSkeleton from '../shared/GenreSkeleton';
import useAppSelector from '../../hooks/useAppSelector';
import { genreIcon } from './genreIcons';

const Sidebar: FC = () => {
  const { data, isLoading, error } = useGenres();
  const location = useLocation();
  const { genreSlug } = useParams<{ genreSlug?: string }>();
  const totalCollected = useAppSelector((s) => {
    const collectionIds = new Set(s.collections.lists.flatMap(l => l.games.map(g => g.id)));
    const favIds = s.favorites.items.map(f => f.id);
    return new Set([...collectionIds, ...favIds]).size;
  });

  return (
    <aside className="w-full lg:w-64 shrink-0 lg:pr-8">

      <Link
        to="/collection"
        className={`flex items-center gap-3 w-full p-2 mb-4 rounded-xl transition-all duration-300 hover:bg-background-card group ${
          location.pathname === '/collection'
            ? 'bg-background-card ring-1 ring-accent text-white shadow-[0_0_15px_rgba(239,68,68,0.1)]'
            : 'text-gray-400'
        }`}
      >
        <div className={`w-8 h-8 shrink-0 rounded-lg overflow-hidden flex items-center justify-center transition-colors ${
          location.pathname === '/collection'
            ? 'bg-accent/20 text-accent'
            : 'bg-zinc-800 text-zinc-400 group-hover:text-white'
        }`}>
          <BookMarked className="w-5 h-5" />
        </div>
        <span className={`text-left text-[15px] ${location.pathname === '/collection' ? 'font-bold' : 'font-medium'}`}>
          My Collection
        </span>
        {totalCollected > 0 && (
          <span className="ml-auto text-xs font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full">
            {totalCollected}
          </span>
        )}
      </Link>

      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 px-2">
        Genres
      </h2>
      <div className="flex flex-col gap-0.5">
        {error && data.length === 0 && (
          <p role="alert" className="px-2 pb-2 text-sm text-zinc-500">Genres couldn't load.</p>
        )}

        {isLoading && Array.from({ length: 15 }).map((_, i) => <GenreSkeleton key={i} />)}

        {!isLoading && (
          <Link
            to="/"
            className={`flex items-center gap-3 w-full p-2 transition-all duration-300 rounded-xl hover:bg-background-card ${
              !genreSlug && location.pathname === '/'
                ? 'bg-background-card ring-1 ring-accent text-white shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'text-gray-400 border border-transparent'
            }`}
          >
            <div className={`w-8 h-8 shrink-0 rounded-lg overflow-hidden flex items-center justify-center transition-colors ${
              !genreSlug && location.pathname === '/'
                ? 'bg-accent/20 text-accent'
                : 'bg-zinc-800 text-zinc-400 group-hover:text-white'
            }`}>
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span className={`text-left text-[15px] ${!genreSlug && location.pathname === '/' ? 'font-bold' : 'font-medium'}`}>
              All Games
            </span>
          </Link>
        )}

        {data.map(genre => {
          const Icon = genreIcon(genre.slug);
          return (
          <Link
            key={genre.id}
            to={`/genre/${genre.slug}`}
            className={`flex items-center gap-3 w-full p-2 transition-all duration-300 rounded-xl hover:bg-background-card ${
                genreSlug === genre.slug
                ? 'bg-background-card ring-1 ring-accent text-white shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'text-gray-400 border border-transparent'
              }`}
          >
            <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
              genreSlug === genre.slug ? 'bg-accent/20 text-accent' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <Icon className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
            <span className={`text-left text-[15px] ${genreSlug === genre.slug ? 'font-bold' : 'font-medium'}`}>
              {genre.name}
            </span>
          </Link>
          );
        })}
      </div>

      <p className="mt-6 px-2 text-xs text-zinc-600">
        Game data from{' '}
        <a href="https://www.igdb.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 underline underline-offset-2">
          IGDB.com
        </a>
      </p>
    </aside>
  );
};

export default memo(Sidebar);
