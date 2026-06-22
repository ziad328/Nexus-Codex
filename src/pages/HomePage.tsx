import { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { GameQuery } from '../types';
import GameGrid from '../components/game/GameGrid';
import GameDetailsModal from '../components/game/GameDetailsModal';
import ViewToggle from '../components/shared/ViewToggle';
import RecentlyViewed from '../components/shared/RecentlyViewed';
import useAppSelector from '../hooks/useAppSelector';
import useAppDispatch from '../hooks/useAppDispatch';
import useSearchContext from '../hooks/useSearchContext';
import { addRecentlyViewed, setViewMode } from '../store/uiSlice';
import useGenres from '../hooks/useGenres';
import PlatformSelector from '../components/shared/PlatformSelector';

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { genreSlug } = useParams<{ genreSlug?: string }>();
  const [gameQuery, setGameQuery] = useState<GameQuery>({ genreSlug });
  useEffect(() => {
    setGameQuery(prev => ({ ...prev, genreSlug }));
  }, [genreSlug]);

  const [selectedGameId, setSelectedGameId] = useState<number | null>(
    () => {
      const id = searchParams.get('gameId');
      return id ? Number(id) : null;
    }
  );
  const [showScrollButton, setShowScrollButton] = useState(false);

  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((s) => s.ui.viewMode);
  const [searchText] = useSearchContext();
  const { data: genres } = useGenres();

  const genreName = genreSlug ? genres?.find(g => g.slug === genreSlug)?.name || 'Loading...' : 'All Games';

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setShowScrollButton(customEvent.detail > 600);
    };

    window.addEventListener('nexusScroll', handleScroll);
    return () => window.removeEventListener('nexusScroll', handleScroll);
  }, []);



  const handleSelectGame = useCallback((id: number, game: { name: string; slug: string; background_image: string; metacritic: number | null }) => {
    setSelectedGameId(id);
    setSearchParams({ gameId: String(id) }, { replace: true });
    dispatch(addRecentlyViewed({ id, ...game }));
  }, [dispatch, setSearchParams]);

  const handleCloseModal = useCallback(() => {
    setSelectedGameId(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return (
    <>
      <GameDetailsModal gameId={selectedGameId} onClose={handleCloseModal} onSelectGame={handleSelectGame} />

      <div className="grow flex flex-col w-full min-w-0">
        <RecentlyViewed onSelectGame={setSelectedGameId} />

        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-medieval font-bold text-white leading-tight">
              {genreName}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {searchText ? `Results for "${searchText}"` : 'Discover your next obsession'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PlatformSelector 
              selectedPlatform={gameQuery.platform} 
              onSelectPlatform={(platform) => setGameQuery({ ...gameQuery, platform })} 
            />
            <ViewToggle viewMode={viewMode} onToggle={(mode) => dispatch(setViewMode(mode))} />
          </div>
        </div>

        <GameGrid gameQuery={{ ...gameQuery, searchText }} onSelectGame={handleSelectGame} viewMode={viewMode} />
      </div>

      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-3 lg:translate-x-0 z-10 bg-background-card/95 backdrop-blur-md border border-zinc-800/80 shadow-[0_0_30px_rgba(0,0,0,0.6)] rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-2.5 transition-all duration-500 ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <span className="text-zinc-400 font-sans text-xs whitespace-nowrap">
          Viewing <span className="font-medieval text-accent tracking-widest uppercase font-bold ml-1">{genreName}</span>
        </span>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('nexusScrollToTop'))}
          className="bg-zinc-800 hover:bg-zinc-700 hover:text-white hover:ring-1 hover:ring-accent text-zinc-300 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 group whitespace-nowrap"
        >
          Scroll to top
          <span className="text-[14px] group-hover:-translate-y-0.5 transition-transform">↑</span>
        </button>
      </div>
    </>
  );
}

export default HomePage;
