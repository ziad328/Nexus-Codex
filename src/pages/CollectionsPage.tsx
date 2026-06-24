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

// ── Filter definitions ────────────────────────────────────────────────────────
type FilterId = 'all' | 'favorites' | CollectionName;

const FILTERS: { id: FilterId; label: string; Icon: React.ElementType }[] = [
  { id: 'all',      label: 'All',         Icon: LayoutGrid },
  { id: 'favorites',label: 'Favorites',   Icon: Heart      },
  { id: 'playing',  label: 'Playing Now', Icon: Clock      },
  { id: 'backlog',  label: 'Backlog',     Icon: Bookmark   },
  { id: 'beaten',   label: 'Beaten',      Icon: Trophy     },
  { id: 'wishlist', label: 'Wishlist',    Icon: Star       },
];

// ── Page ─────────────────────────────────────────────────────────────────────
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

  // ── OverlayScrollbars (matches HomePage) ──────────────────────────────────
  const [initialize] = useOverlayScrollbars({
    defer: true,
    options: { scrollbars: { theme: 'os-theme-dark os-theme-nexus', autoHide: 'scroll', autoHideDelay: 1000 } },
  });
  useEffect(() => { initialize(document.body); }, [initialize]);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = selectedGameId ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedGameId]);

  // ── Build game list for active filter ────────────────────────────────────
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
            <div className="mb-6 p-3 md:p-4 rounded-xl bg-accent/10 border border-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Cloud className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base md:text-lg">Sync your library across devices</h3>
                  <p className="text-zinc-400 text-sm mt-0.5">Please sign in to save your games to the cloud. It's completely free and requires no passwords!</p>
                </div>
              </div>
              <button 
                onClick={() => dispatch(setAuthModalOpen(true))}
                className="px-5 py-2.5 bg-accent hover:bg-red-600 text-white font-bold rounded-xl transition-colors whitespace-nowrap shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] w-full sm:w-auto"
              >
                Sign In
              </button>
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
