import { useState, useCallback, useEffect } from 'react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { GameQuery, Genre } from './types';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import GameGrid from './components/game/GameGrid';
import GameDetailsModal from './components/game/GameDetailsModal';
import SmoothScrollbar from './components/shared/SmoothScrollbar';

function App() {
  const [gameQuery, setGameQuery] = useState<GameQuery>({} as GameQuery);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [initialize, instance] = useOverlayScrollbars({
    defer: true,
    options: {
      scrollbars: {
        theme: 'os-theme-dark os-theme-nexus',
        autoHide: 'scroll',
        autoHideDelay: 1000,
      }
    }
  });

  useEffect(() => {
    const osInstance = instance();
    const shouldLock = isMobileMenuOpen || selectedGameId !== null;

    if (shouldLock) {
      document.body.style.overflow = 'hidden';
      if (osInstance) osInstance.options({ overflow: { y: 'hidden' } });
    } else {
      document.body.style.overflow = '';
      if (osInstance) osInstance.options({ overflow: { y: 'scroll' } });
    }

    return () => {
      document.body.style.overflow = '';
      if (osInstance) osInstance.options({ overflow: { y: 'scroll' } });
    };
  }, [isMobileMenuOpen, selectedGameId, instance]);

  useEffect(() => {
    initialize(document.body);
  }, [initialize]);

  const handleSearch = useCallback((searchText: string) => {
    setGameQuery((prev) => ({ ...prev, searchText }));
  }, []);

  const handleSelectGenre = useCallback((genre: Genre | null) => {
    setGameQuery((prev) => ({ ...prev, genre }));
    setIsMobileMenuOpen(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedGameId(null);
  }, []);

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans selection:bg-accent selection:text-white">
      <GameDetailsModal 
        gameId={selectedGameId} 
        onClose={handleCloseModal} 
      />

      <Header onSearch={handleSearch} onMenuToggle={handleMenuToggle} />
      
      <main className="flex flex-col lg:flex-row p-4 md:px-8 md:py-6 max-w-[1920px] mx-auto w-full grow relative">
        
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className={`
          fixed inset-y-0 left-0 z-50 w-70 bg-background-card/95 backdrop-blur-xl border-r border-zinc-800/50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-0 lg:w-auto lg:bg-transparent lg:border-none lg:backdrop-blur-none lg:shadow-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          
          <div className="h-full w-full lg:hidden">
            <SmoothScrollbar className="h-full">
              <div className="p-5 pb-24">
                <Sidebar 
                  selectedGenre={gameQuery.genre || null} 
                  onSelectGenre={handleSelectGenre} 
                />
              </div>
            </SmoothScrollbar>
          </div>

          <div className="hidden lg:block h-full">
            <Sidebar 
              selectedGenre={gameQuery.genre || null} 
              onSelectGenre={handleSelectGenre} 
            />
          </div>
        </div>
        
        <div className="grow flex flex-col w-full min-w-0">
          
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-medieval font-bold text-white leading-tight">
              {gameQuery.genre?.name || 'All Games'}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">{gameQuery.searchText ? `Results for "${gameQuery.searchText}"` : 'Discover your next obsession'}</p>
          </div>
          
          <GameGrid gameQuery={gameQuery} onSelectGame={setSelectedGameId} />
        </div>
      </main>

      <div 
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-3 lg:translate-x-0 z-10 bg-background-card/95 backdrop-blur-md border border-zinc-800/80 shadow-[0_0_30px_rgba(0,0,0,0.6)] rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-2.5 transition-all duration-500 ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <span className="text-zinc-400 font-sans text-xs whitespace-nowrap">
          Viewing <span className="font-medieval text-accent tracking-widest uppercase font-bold ml-1">{gameQuery.genre?.name || 'All Games'}</span>
        </span>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-zinc-800 hover:bg-zinc-700 hover:text-white hover:ring-1 hover:ring-accent text-zinc-300 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 group whitespace-nowrap"
        >
          Scroll to top
          <span className="text-[14px] group-hover:-translate-y-0.5 transition-transform">↑</span>
        </button>
      </div>
    </div>
  );
}

export default App;
