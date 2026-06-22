import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import useAppSelector from '../hooks/useAppSelector';
import useAppDispatch from '../hooks/useAppDispatch';
import { removeFavorite } from '../store/favoritesSlice';
import getCroppedImageUrl from '../services/image-url';

const FavoritesPage: FC = () => {
  const favorites = useAppSelector((s) => s.favorites.items);
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans selection:bg-accent selection:text-white">
      <header className="flex items-center justify-between px-4 py-2 md:px-8 gap-4 border-b border-zinc-800/50 bg-background/80 backdrop-blur-md sticky top-0 z-40 h-15 md:h-18.75">
        <Link
          to="/"
          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
        >
          <img src="/nexus_logo.png" alt="Nexus Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
          <span className="text-2xl font-medieval tracking-widest uppercase text-white hidden lg:block">Nexus Codex</span>
        </Link>
        <h2 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
          <Heart className="w-5 h-5 text-accent fill-accent" />
          My Favorites
        </h2>
      </header>

      <main className="p-4 md:px-8 md:py-6 max-w-[1920px] mx-auto w-full grow">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4 text-zinc-600">
            <Heart className="w-16 h-16" />
            <p className="text-xl font-semibold">No favorites yet</p>
            <p className="text-sm">Heart a game to save it here.</p>
            <Link to="/" className="mt-2 px-5 py-2 bg-accent hover:bg-red-600 text-white text-sm font-semibold rounded-full transition-colors">
              Browse Games
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-medieval font-bold text-white leading-tight">Favorites</h1>
              <p className="text-zinc-500 text-sm mt-1">{favorites.length} game{favorites.length !== 1 ? 's' : ''} saved</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {favorites.map((game) => (
                <div
                  key={game.id}
                  className="flex flex-col w-full bg-background-card rounded-2xl overflow-hidden ring-1 ring-zinc-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] hover:ring-accent/40 group"
                >
                  <div className="relative overflow-hidden h-48 w-full">
                    <img
                      src={getCroppedImageUrl(game.background_image)}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-background-card/80 via-transparent to-transparent" />
                  </div>
                  <div className="p-4 flex flex-col gap-3 grow">
                    <h2 className="text-base font-semibold text-zinc-100 group-hover:text-accent transition-colors leading-snug grow">
                      {game.name}
                    </h2>
                    <button
                      onClick={() => dispatch(removeFavorite(game.id))}
                      className="flex items-center gap-2 text-xs text-zinc-500 hover:text-red-400 transition-colors self-start"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default FavoritesPage;
