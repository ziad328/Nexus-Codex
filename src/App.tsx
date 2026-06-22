import { useState, useCallback } from 'react';
import type { GameQuery, Genre } from './types';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import GameGrid from './components/game/GameGrid';
import GameDetailsModal from './components/game/GameDetailsModal';

function App() {
  // Global state for filtering and searching games
  const [gameQuery, setGameQuery] = useState<GameQuery>({} as GameQuery);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  // Memoize handlers to prevent infinite rerendering loops in child useEffects
  const handleSearch = useCallback((searchText: string) => {
    setGameQuery((prev) => ({ ...prev, searchText }));
  }, []);

  const handleSelectGenre = useCallback((genre: Genre | null) => {
    setGameQuery((prev) => ({ ...prev, genre }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedGameId(null);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans selection:bg-accent selection:text-white">
      {/* Game Details Modal Overlay */}
      <GameDetailsModal 
        gameId={selectedGameId} 
        onClose={handleCloseModal} 
      />

      {/* Header with Search */}
      <Header onSearch={handleSearch} />
      
      {/* Main Layout */}
      <main className="flex flex-col lg:flex-row p-4 md:px-8 md:py-6 max-w-[1920px] mx-auto w-full grow">
        
        {/* Sidebar for Genres */}
        <Sidebar 
          selectedGenre={gameQuery.genre || null} 
          onSelectGenre={handleSelectGenre} 
        />
        
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
