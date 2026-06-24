import { useState, useCallback, useEffect } from 'react';
import type { FC } from 'react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { Heart, Bookmark, Trophy, Clock, Star, LayoutGrid, ListPlus } from 'lucide-react';
import GameCard from '../components/game/GameCard';
import GameDetailsModal from '../components/game/GameDetailsModal';
import ViewToggle from '../components/shared/ViewToggle';
import useAppSelector from '../hooks/useAppSelector';
import useAppDispatch from '../hooks/useAppDispatch';
import useSearchContext from '../hooks/useSearchContext';
import { setViewMode, setAuthModalOpen } from '../store/uiSlice';
import type { FavoriteGame, CollectionName } from '../types';
import { Cloud } from 'lucide-react';


type FilterId = 'all' | 'favorites' | CollectionName;

const FILTERS: { id: FilterId; label: string; Icon: React.ElementType }[] = [
  { id: 'all',      label: 'All',         Icon: LayoutGrid },
  { id: 'favorites',label: 'Favorites',   Icon: Heart      },
  { id: 'playing',  label: 'Playing Now', Icon: Clock      },
  { id: 'backlog',  label: 'Backlog',     Icon: Bookmark   },
  { id: 'beaten',   label: 'Beaten',      Icon: Trophy     },
  { id: 'wishlist', label: 'Wishlist',    Icon: Star       },
];


const CollectionsPage: FC = () => {
  const dispatch    = useAppDispatch();
  const [searchQuery] = useSearchContext();
  const viewMode    = useAppSelector((s) => s.ui.viewMode);
  const favorites   = useAppSelector((s) => s.favorites.items);
  const collections = useAppSelector((s) => s.collections.lists);
  const user        = useAppSelector((s) => s.auth.user);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const hasLocalGames = favorites.length > 0 || collections.some(c => c.games.length > 0);


  const [initialize] = useOverlayScrollbars({
    defer: true,
    options: { scrollbars: { theme: 'os-theme-dark os-theme-nexus', autoHide: 'scroll', autoHideDelay: 1000 } },
  });
  useEffect(() => { initialize(document.body); }, [initialize]);


  useEffect(() => {
    document.body.style.overflow = selectedGameId ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedGameId]);


  const getGames = (): FavoriteGame[] => {
    if (activeFilter === 'favorites') return favorites;
    if (activeFilter === 'all') {
      const map = new Map<number, FavoriteGame>();
      favorites.forEach(g => map.set(g.id, g));
      collections.forEach(c => c.games.forEach(g => map.set(g.id, g)));
      return Array.from(map.values());
    }
    return collections.find(c => c.name === activeFilter)?.games ?? [];
  };

  const games = getGames();
  const filtered = games.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFilterData = FILTERS.find(f => f.id === activeFilter) ?? FILTERS[0];
  const activeLabel = activeFilterData.label;
  const ActiveIcon = activeFilterData.Icon;

  const handleSelectGame = useCallback((id: number) => setSelectedGameId(id), []);
  const handleCloseModal = useCallback(() => setSelectedGameId(null), []);

  return (
    <>
      <GameDetailsModal gameId={selectedGameId} onClose={handleCloseModal} />

      <div className="grow flex flex-col w-full min-w-0">

          {!user && hasLocalGames && (
            <div className="relative overflow-hidden mb-8 rounded-2xl p-px">
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 bg-linear-to-r from-accent/0 via-accent/40 to-accent/0 opacity-50"></div>
              
              <div className="relative bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 shadow-xl">
                <div className="flex items-start sm:items-center gap-4 sm:gap-5 w-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <Cloud className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm sm:text-base md:text-lg truncate">Cloud Sync Disabled</h3>
                    <p className="text-zinc-400 text-xs sm:text-sm mt-1 leading-relaxed max-w-xl">
                      Your collections are currently saved locally. Sign in to seamlessly sync your library across all your devices—mobile, tablet, and desktop.
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => dispatch(setAuthModalOpen(true))}
                  className="relative w-full md:w-auto px-6 py-2.5 bg-linear-to-r from-accent to-red-700 text-white text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group overflow-hidden hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] cursor-pointer shrink-0"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                  <span className="relative z-10">Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* Header + filter pills */}
          <div className="mb-5">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-medieval font-bold text-white leading-tight">
                  My Collection
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                  {filtered.length} game{filtered.length !== 1 ? 's' : ''} in {activeLabel}
                </p>
              </div>
              <ViewToggle viewMode={viewMode} onToggle={(mode) => dispatch(setViewMode(mode))} />
            </div>

            {/* Filter pills — horizontally scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {FILTERS.map(({ id, label, Icon }) => {
                const active = activeFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveFilter(id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                      active
                        ? 'bg-accent text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game grid / list */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-zinc-600 px-4 py-8">
              <ActiveIcon className="w-16 h-16 text-zinc-700" />
              <div className="text-center">
                <p className="text-lg md:text-xl font-semibold text-zinc-500 mb-2">
                  {searchQuery ? `No results for "${searchQuery}"` : `Nothing in ${activeLabel} yet`}
                </p>
                {!searchQuery && (
                  <p className="text-sm md:text-base leading-relaxed text-zinc-500 max-w-sm mx-auto">
                    Add games using the <Heart className="inline-block w-4 h-4 align-text-bottom mx-0.5 text-accent" /> or <ListPlus className="inline-block w-4 h-4 align-text-bottom mx-0.5 text-zinc-400" /> buttons on any game card.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className={
              viewMode === 'list'
                ? 'flex flex-col gap-2'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'
            }>
              {filtered.map(game => (
                <GameCard
                  key={game.id}
                  game={game as any}
                  onClick={handleSelectGame}
                  viewMode={viewMode}
                  isFavoritePage={activeFilter === 'favorites'}
                />
              ))}
            </div>
          )}
        </div>
    </>
  );
};

export default CollectionsPage;
