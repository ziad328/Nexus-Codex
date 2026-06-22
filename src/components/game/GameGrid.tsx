import { memo, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import useGames from '../../hooks/useGames';
import type { GameQuery } from '../../types';
import GameCard from './GameCard';
import GameCardSkeleton from '../shared/GameCardSkeleton';

interface Props {
  gameQuery: GameQuery;
  onSelectGame: (id: number, game: { name: string; slug: string; background_image: string; metacritic: number | null }) => void;
  viewMode?: 'grid' | 'list';
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.04,
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const GameGrid: FC<Props> = ({ gameQuery, onSelectGame, viewMode = 'grid' }) => {
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
      <div className={viewMode === 'list' ? 'flex flex-col gap-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'}>
        {isLoading && skeletons.map((_, index) => <GameCardSkeleton key={`skeleton-${index}`} />)}
        
        <AnimatePresence mode="popLayout">
          {!isLoading && data.map((game, index) => (
            <motion.div
              key={game.id}
              custom={index % 20}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              <GameCard game={game} onClick={onSelectGame} viewMode={viewMode} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {!isLoading && data.length === 0 && (
          <div className="col-span-full text-center text-gray-500 mt-10 text-xl font-bold tracking-widest uppercase">
            No games found in the abyss.
          </div>
        )}

        {isFetchingNextPage && (
          skeletons.slice(0, 5).map((_, index) => <GameCardSkeleton key={`next-page-skeleton-${index}`} />)
        )}
      </div>

      {hasNextPage && !isLoading && data.length > 0 && (
        <div ref={loadMoreRef} className="h-10 w-full mt-4" />
      )}
    </div>
  );
};

export default memo(GameGrid);
