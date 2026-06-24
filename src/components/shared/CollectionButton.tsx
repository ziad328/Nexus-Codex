import { useState, useRef, useEffect } from 'react';
import type { FC, ElementType } from 'react';
import { Bookmark, Check, Clock, Trophy, Star, ListPlus } from 'lucide-react';
import useAppSelector from '../../hooks/useAppSelector';
import useAppDispatch from '../../hooks/useAppDispatch';
import { shallowEqual } from 'react-redux';
import { addToCollectionInDb, removeFromCollectionInDb } from '../../store/collectionsSlice';
import type { CollectionName, FavoriteGame } from '../../types';

interface Props {
  game: FavoriteGame;
  className?: string;
  /** 'up' opens dropdown above the button, 'down' opens below (default: 'down') */
  dropDirection?: 'up' | 'down';
}

const COLLECTIONS: { name: CollectionName; label: string; Icon: ElementType }[] = [
  { name: 'playing',  label: 'Playing Now', Icon: Clock },
  { name: 'backlog',  label: 'Backlog',     Icon: Bookmark },
  { name: 'beaten',   label: 'Beaten',      Icon: Trophy },
  { name: 'wishlist', label: 'Wishlist',    Icon: Star },
];

const CollectionButton: FC<Props> = ({ game, className = '', dropDirection = 'down' }) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const memberOf = useAppSelector((s) =>
    s.collections.lists.reduce<CollectionName[]>((acc, list) => {
      if (list.games.some((g) => g.id === game.id)) {
        acc.push(list.name as CollectionName);
      }
      return acc;
    }, []),
    shallowEqual
  );

  const isInAny = memberOf.length > 0;


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
      dispatch(removeFromCollectionInDb({ collectionName: name, gameId: game.id }));
    } else {
      dispatch(addToCollectionInDb({ collectionName: name, game }));
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        title="Add to collection"
        className={`flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded-full transition-all duration-200 ${
          isInAny
            ? 'bg-zinc-700 text-white ring-1 ring-zinc-500'
            : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
        }`}
      >
        <ListPlus className={`w-3.5 h-3.5 transition-all ${isInAny ? 'text-white' : ''}`} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 w-48 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden ${
            dropDirection === 'up'
              ? 'bottom-full mb-2 right-0'
              : 'top-full mt-2 right-0'
          }`}
        >
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Add to list
            </p>
          </div>
          <div className="p-1.5 flex flex-col gap-0.5">
            {COLLECTIONS.map(({ name, label, Icon }) => {
              const active = memberOf.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => toggle(name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    active
                      ? 'text-white bg-white/10 shadow-sm'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${active ? 'text-accent' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <span className="flex-1 text-left">{label}</span>
                  {active && <Check className="w-4 h-4 text-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionButton;
