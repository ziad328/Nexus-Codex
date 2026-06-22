import { useState, useCallback, useEffect } from 'react';
import type { FC } from 'react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { Heart, Bookmark, Trophy, Clock, Star, LayoutGrid } from 'lucide-react';
import GameCard from '../components/game/GameCard';
import GameDetailsModal from '../components/game/GameDetailsModal';
import ViewToggle from '../components/shared/ViewToggle';
import useAppSelector from '../hooks/useAppSelector';
import useAppDispatch from '../hooks/useAppDispatch';
import useSearchContext from '../hooks/useSearchContext';
import { setViewMode } from '../store/uiSlice';
import type { FavoriteGame, CollectionName } from '../types';

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
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

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

  const activeLabel = FILTERS.find(f => f.id === activeFilter)?.label ?? 'All';

  const handleSelectGame = useCallback((id: number) => setSelectedGameId(id), []);
  const handleCloseModal = useCallback(() => setSelectedGameId(null), []);

  return (
    <>
      <GameDetailsModal gameId={selectedGameId} onClose={handleCloseModal} />

      <div className="grow flex flex-col w-full min-w-0">

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
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-600">
              <Bookmark className="w-14 h-14" />
              <p className="text-lg font-semibold">
                {searchQuery ? `No results for "${searchQuery}"` : `Nothing in ${activeLabel} yet`}
              </p>
              <p className="text-sm">
                {!searchQuery && 'Add games using the ♥ or 🔖 buttons on any game card.'}
              </p>
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
