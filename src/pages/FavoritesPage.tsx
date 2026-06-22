import { useState } from 'react';
import type { FC } from 'react';
import { Heart, Search } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import useAppSelector from '../hooks/useAppSelector';
import useAppDispatch from '../hooks/useAppDispatch';
import { Link } from 'react-router-dom';
import useSearchContext from '../hooks/useSearchContext';
import GameCard from '../components/game/GameCard';
import GameDetailsModal from '../components/game/GameDetailsModal';
import ViewToggle from '../components/shared/ViewToggle';
import { setViewMode } from '../store/uiSlice';

const FavoritesPage: FC = () => {
  const favorites = useAppSelector((s) => s.favorites.items);
  const dispatch = useAppDispatch();
  const [searchQuery] = useSearchContext();
  const viewMode = useAppSelector((s) => s.ui.viewMode);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const filteredFavorites = favorites.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans selection:bg-accent selection:text-white">
      <GameDetailsModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      <Navbar />

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
        ) : filteredFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4 text-zinc-600">
            <Search className="w-16 h-16" />
            <p className="text-xl font-semibold">No favorites found for "{searchQuery}"</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-medieval font-bold text-white leading-tight">Favorites</h1>
                <p className="text-zinc-500 text-sm mt-1">{filteredFavorites.length} game{filteredFavorites.length !== 1 ? 's' : ''} saved</p>
              </div>
              <ViewToggle viewMode={viewMode} onToggle={(mode) => dispatch(setViewMode(mode))} />
            </div>
            <div className={viewMode === 'list' ? 'flex flex-col gap-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'}>
              {filteredFavorites.map((game) => (
                <GameCard
                  key={game.id}
                  game={game as any}
                  onClick={(id) => setSelectedGameId(id)}
                  viewMode={viewMode}
                  isFavoritePage
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default FavoritesPage;
