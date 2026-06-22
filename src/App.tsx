import { useState, useCallback, useEffect } from 'react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import type { GameQuery, Genre } from './types';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import GameGrid from './components/game/GameGrid';
import GameDetailsModal from './components/game/GameDetailsModal';

function App() {
  // Global state for filtering and searching games
  const [gameQuery, setGameQuery] = useState<GameQuery>({} as GameQuery);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [initialize] = useOverlayScrollbars({
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
    initialize(document.body);
  }, [initialize]);

  // Memoize handlers to prevent infinite rerendering loops in child useEffects
  const handleSearch = useCallback((searchText: string) => {
    setGameQuery((prev) => ({ ...prev, searchText }));
  }, []);

  const handleSelectGenre = useCallback((genre: Genre | null) => {
    setGameQuery((prev) => ({ ...prev, genre }));
    setIsMobileMenuOpen(false); // Auto-close drawer on mobile selection
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedGameId(null);
  }, []);

  const handleMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans selection:bg-accent selection:text-white">
      {/* Game Details Modal Overlay */}
      <GameDetailsModal 
        gameId={selectedGameId} 
        onClose={handleCloseModal} 
      />

      {/* Header with Search */}
      <Header onSearch={handleSearch} onMenuToggle={handleMenuToggle} />
      
      {/* Main Layout */}
      <main className="flex flex-col lg:flex-row p-4 md:px-8 md:py-6 max-w-[1920px] mx-auto w-full grow relative">
        
        {/* Mobile Drawer Backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar for Genres (Drawer on Mobile, Static on Desktop) */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 p-6 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-0 lg:w-auto lg:bg-transparent lg:p-0 lg:shadow-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar 
            selectedGenre={gameQuery.genre || null} 
            onSelectGenre={handleSelectGenre} 
          />
        </div>
        
        {/* Content Area */}
        <div className="grow flex flex-col w-full min-w-0">
          
          {/* Dynamic Heading */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              {gameQuery.genre?.name || 'All Games'}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">{gameQuery.searchText ? `Results for "${gameQuery.searchText}"` : 'Discover your next obsession'}</p>
          </div>
          
          {/* Game Grid Component */}
          <GameGrid gameQuery={gameQuery} onSelectGame={setSelectedGameId} />
        </div>
      </main>
    </div>
  );
}

export default App;
