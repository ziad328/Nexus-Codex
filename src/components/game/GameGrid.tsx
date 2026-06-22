import { memo, useEffect, useRef } from 'react';
import type { FC } from 'react';
import useGames from '../../hooks/useGames';
import type { GameQuery } from '../../types';
import GameCard from './GameCard';
import GameCardSkeleton from '../shared/GameCardSkeleton';

interface Props {
  gameQuery: GameQuery;
  onSelectGame: (id: number) => void;
}

const GameGrid: FC<Props> = ({ gameQuery, onSelectGame }) => {
  const { 
    data, 
    error, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage 
  } = useGames(gameQuery);
  
  const skeletons = Array.from({ length: 12 });
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !isLoading) {
          fetchNextPage();
        }
      },
      { rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  if (error) return (
    <div className="text-red-500 font-bold p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
      {error}
    </div>
  );

  return (
    <div className="w-full pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {isLoading && skeletons.map((_, index) => <GameCardSkeleton key={`skeleton-${index}`} />)}
        
        {!isLoading && data.map((game, index) => (
          <GameCard key={`${game.id}-${index}`} game={game} onClick={onSelectGame} />
        ))}
        
        {!isLoading && data.length === 0 && (
          <div className="col-span-full text-center text-gray-500 mt-10 text-xl font-bold tracking-widest uppercase">
            No games found in the abyss.
          </div>
        )}

        {isFetchingNextPage && (
          skeletons.slice(0, 5).map((_, index) => <GameCardSkeleton key={`next-page-skeleton-${index}`} />)
        )}
      </div>

      {hasNextPage && !isLoading && (
        <div ref={loadMoreRef} className="h-10 w-full mt-4" />
      )}
    </div>
  );
};

export default memo(GameGrid);
