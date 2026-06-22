import { useRef, useState, useCallback } from 'react';
import type { FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useSimilarGames from '../../hooks/useSimilarGames';
import getCroppedImageUrl from '../../services/image-url';
import CriticScore from '../shared/CriticScore';

interface Props {
  gameId: number;
  onSelectGame?: (id: number, game: any) => void;
}

const SimilarGamesCarousel: FC<Props> = ({ gameId, onSelectGame }) => {
  const { data, isLoading, error } = useSimilarGames(gameId);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = (el: HTMLDivElement) => {
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const setRef = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el;
    if (el) updateScrollState(el);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: direction === 'right' ? 296 : -296, behavior: 'smooth' });
  };

  if (error) return null;
  if (isLoading) return (
    <div className="flex justify-center p-8">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (data.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-white/10 relative">
      <h2 className="text-xl font-semibold text-white mb-6 tracking-wide">You Might Also Like</h2>
      
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-[65%] -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-full flex max-md:hidden items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-200 cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div 
        ref={setRef}
        onScroll={(e) => updateScrollState(e.currentTarget)}
        className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {data.map(game => (
          <button 
            key={game.id} 
            onClick={() => onSelectGame?.(game.id, game)}
            className="text-left min-w-70 max-w-70 shrink-0 snap-start bg-zinc-800/50 rounded-2xl overflow-hidden border border-white/5 hover:border-accent/30 transition-colors group cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <div className="aspect-video relative overflow-hidden bg-zinc-900">
              <img 
                src={getCroppedImageUrl(game.background_image)} 
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="text-zinc-100 font-bold text-lg leading-tight line-clamp-2">{game.name}</h3>
                {game.metacritic && <CriticScore score={game.metacritic} />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-[65%] -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-full flex max-md:hidden items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-200 cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SimilarGamesCarousel;
