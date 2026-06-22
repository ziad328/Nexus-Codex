import { useState, useCallback } from 'react';
import type { GameQuery, Genre } from './types';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import GameGrid from './components/game/GameGrid';

function App() {
  // Global state for filtering and searching games
  const [gameQuery, setGameQuery] = useState<GameQuery>({} as GameQuery);

  // Memoize handlers to prevent infinite rerendering loops in child useEffects
  const handleSearch = useCallback((searchText: string) => {
    setGameQuery((prev) => ({ ...prev, searchText }));
  }, []);

  const handleSelectGenre = useCallback((genre: Genre) => {
    setGameQuery((prev) => ({ ...prev, genre }));
  }, []);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans selection:bg-accent selection:text-white">
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
          
          {/* Dynamic Heading based on genre selection */}
          <div className="mb-6 border-l-4 border-accent pl-4">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-white leading-none">
              {gameQuery.genre?.name || 'All Games'}
            </h1>
          </div>
          
          {/* Game Grid Component */}
          <GameGrid gameQuery={gameQuery} />
        </div>
      </main>
    </div>
  );
}

export default App;
