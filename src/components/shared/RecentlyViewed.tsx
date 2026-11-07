import { useRef, useState, useCallback } from 'react';
import type { FC } from 'react';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import useAppSelector from '../../hooks/useAppSelector';
import useAppDispatch from '../../hooks/useAppDispatch';
import { clearRecentlyViewed } from '../../store/uiSlice';

interface Props {
  onSelectGame: (id: number) => void;
}

const RecentlyViewed: FC<Props> = ({ onSelectGame }) => {
  const recentlyViewed = useAppSelector((s) => s.ui.recentlyViewed);
  const dispatch = useAppDispatch();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = (el: HTMLDivElement) => {
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const setRef = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el;
    if (!el) return;
    updateScrollState(el);

    // The wheel scrolls the strip sideways. React's wheel listeners are passive and can't stop the page
    // scrolling too, so this one is added by hand.
    const turnWheelSideways = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', turnWheelSideways, { passive: false });
    return () => el.removeEventListener('wheel', turnWheelSideways);
  }, []);

  if (recentlyViewed.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: direction === 'right' ? 200 : -200, behavior: 'smooth' });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <History className="w-3.5 h-3.5" />
          Recently Viewed
        </h2>
        <button
          onClick={() => dispatch(clearRecentlyViewed())}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-7 -translate-y-1/2 -translate-x-2 z-10 w-7 h-7 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={setRef}
          onScroll={(e) => updateScrollState(e.currentTarget)}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {recentlyViewed.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="shrink-0 w-16 group cursor-pointer"
              title={game.name}
            >
              <div className="w-16 aspect-3/4 rounded-xl overflow-hidden ring-1 ring-zinc-800 group-hover:ring-accent/50 transition-all duration-200">
                {game.background_image ? (
                  <img
                    src={game.background_image}
                    crossOrigin="anonymous"
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <span className="text-[8px] text-zinc-500">No Img</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 group-hover:text-zinc-300 mt-1 truncate text-left transition-colors">
                {game.name}
              </p>
            </button>
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-7 -translate-y-1/2 translate-x-2 z-10 w-7 h-7 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RecentlyViewed;
