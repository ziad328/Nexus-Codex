import type { FC } from 'react';
import { Heart } from 'lucide-react';
import useAppSelector from '../../hooks/useAppSelector';
import useAppDispatch from '../../hooks/useAppDispatch';
import { toggleFavorite } from '../../store/favoritesSlice';
import type { FavoriteGame } from '../../types';

interface Props {
  game: FavoriteGame;
  className?: string;
}

const FavoriteButton: FC<Props> = ({ game, className = '' }) => {
  const dispatch = useAppDispatch();
  const isFavorited = useAppSelector((s) =>
    s.favorites.items.some((f) => f.id === game.id)
  );

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        dispatch(toggleFavorite(game));
      }}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
        isFavorited
          ? 'bg-accent/20 text-accent hover:bg-accent/30'
          : 'bg-zinc-800/80 text-zinc-400 hover:text-accent hover:bg-zinc-700'
      } ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-200 ${isFavorited ? 'fill-accent' : ''}`}
      />
    </button>
  );
};

export default FavoriteButton;
