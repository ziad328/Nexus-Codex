import { memo } from 'react';
import type { FC } from 'react';
import type { Game } from '../../types';
import PlatformIconList from '../shared/PlatformIconList';
import CriticScore from '../shared/CriticScore';
import getCroppedImageUrl from '../../services/image-url';
import FavoriteButton from '../shared/FavoriteButton';
import { Trash2 } from 'lucide-react';
import useAppDispatch from '../../hooks/useAppDispatch';
import { removeFavorite } from '../../store/favoritesSlice';

interface Props {
  game: Game;
  onClick: (id: number, game: { name: string; slug: string; background_image: string; metacritic: number | null }) => void;
  viewMode?: 'grid' | 'list';
  isFavoritePage?: boolean;
}

const GameCard: FC<Props> = ({ game, onClick, viewMode = 'grid', isFavoritePage = false }) => {
  const dispatch = useAppDispatch();
  const favoriteData = {
    id: game.id,
    name: game.name,
    slug: (game as any).slug ?? '',
    background_image: game.background_image,
    metacritic: game.metacritic ?? null,
    parent_platforms: game.parent_platforms,
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onClick(game.id, favoriteData)}
        className="flex items-center gap-4 w-full bg-background-card rounded-xl overflow-hidden transition-all duration-200 hover:ring-1 hover:ring-accent/40 hover:bg-zinc-800/60 cursor-pointer p-3 group"
      >
        <div className="relative overflow-hidden h-16 w-28 rounded-lg shrink-0">
          <img
            src={getCroppedImageUrl(game.background_image)}
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col gap-1 grow min-w-0">
          <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-accent transition-colors truncate">
            {game.name}
          </h2>
          <PlatformIconList platforms={game.parent_platforms?.map(p => p.platform) ?? []} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <CriticScore score={game.metacritic} />
          {isFavoritePage ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch(removeFavorite(game.id));
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
              title="Remove from favorites"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <FavoriteButton game={favoriteData} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(game.id, favoriteData)}
      className="flex flex-col w-full bg-background-card rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(239,68,68,0.18)] hover:ring-1 hover:ring-accent/40 group cursor-pointer"
    >
      <div className="relative overflow-hidden h-48 w-full">
        <img
          src={getCroppedImageUrl(game.background_image)}
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background-card/80 via-transparent to-transparent" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isFavoritePage ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch(removeFavorite(game.id));
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 bg-black/50 backdrop-blur-md text-zinc-300 hover:bg-red-500 hover:text-white hover:scale-110 shadow-lg"
              title="Remove from favorites"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <FavoriteButton game={favoriteData} />
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <PlatformIconList platforms={game.parent_platforms?.map(p => p.platform) ?? []} />
          <CriticScore score={game.metacritic} />
        </div>
        <h2 className="text-base font-semibold text-zinc-100 group-hover:text-accent transition-colors duration-200 leading-snug">
          {game.name}
        </h2>
      </div>
    </div>
  );
};

export default memo(GameCard);

