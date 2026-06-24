import { memo, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import useGames from '../../hooks/useGames';
import type { GameQuery } from '../../types';
import GameCard from './GameCard';
import GameCardSkeleton from '../shared/GameCardSkeleton';
import { Link } from 'react-router-dom';
import { AlertCircle, FolderHeart } from 'lucide-react';

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
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !isLoading && !error) {
          fetchNextPage();
        }
      },
      { rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, error]);

  if (error && data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Failed to connect to Nexus</h3>
      <p className="text-zinc-400 max-w-md mx-auto mb-8 text-sm md:text-base leading-relaxed">
        {error}. Please check your network connection and try again. 
        In the meantime, your previously saved collections are safely cached offline.
      </p>
      <Link 
        to="/collection" 
        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-white font-medium"
      >
        <FolderHeart className="w-5 h-5" />
        View Collections Cache
      </Link>
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
      </div>
      
      {/* Infinite Scroll Trigger / Offline Banner */}
      {!isLoading && data.length > 0 && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
          {error ? (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-full text-sm font-medium border border-red-500/20">
              <AlertCircle className="w-4 h-4" />
              Offline: Cannot load more games
            </div>
          ) : isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-accent">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          ) : hasNextPage ? (
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default memo(GameGrid);
