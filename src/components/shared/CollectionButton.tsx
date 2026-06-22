import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { Bookmark, Check } from 'lucide-react';
import useAppSelector from '../../hooks/useAppSelector';
import useAppDispatch from '../../hooks/useAppDispatch';
import { addToCollection, removeFromCollection } from '../../store/collectionsSlice';
import type { CollectionName, FavoriteGame } from '../../types';

interface Props {
  game: FavoriteGame;
  className?: string;
  /** 'up' opens dropdown above the button, 'down' opens below (default: 'down') */
  dropDirection?: 'up' | 'down';
}

const COLLECTIONS: { name: CollectionName; label: string; emoji: string }[] = [
  { name: 'playing',  label: 'Playing Now', emoji: '🎮' },
  { name: 'backlog',  label: 'Backlog',     emoji: '📋' },
  { name: 'beaten',   label: 'Beaten',      emoji: '🏆' },
  { name: 'wishlist', label: 'Wishlist',    emoji: '⭐' },
];

const CollectionButton: FC<Props> = ({ game, className = '', dropDirection = 'down' }) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const memberOf = useAppSelector((s) =>
    s.collections.lists
      .filter((c) => c.games.some((g) => g.id === game.id))
      .map((c) => c.name)
  );

  const isInAny = memberOf.length > 0;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggle = (name: CollectionName) => {
    if (memberOf.includes(name)) {
      dispatch(removeFromCollection({ collectionName: name, gameId: game.id }));
    } else {
      dispatch(addToCollection({ collectionName: name, game }));
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        title="Add to collection"
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
          isInAny
            ? 'bg-zinc-700 text-white ring-1 ring-zinc-500'
            : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
        }`}
      >
        <Bookmark className={`w-3.5 h-3.5 transition-all ${isInAny ? 'fill-white' : ''}`} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 w-44 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden ${
            dropDirection === 'up'
              ? 'bottom-full mb-2 right-0'
              : 'top-full mt-2 right-0'
          }`}
        >
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Add to list
          </p>
          {COLLECTIONS.map(({ name, label, emoji }) => {
            const active = memberOf.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggle(name)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 ${
                  active
                    ? 'text-white bg-zinc-700/60'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{emoji}</span>
                <span className="flex-1 text-left">{label}</span>
                {active && <Check className="w-3.5 h-3.5 text-zinc-300 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CollectionButton;
