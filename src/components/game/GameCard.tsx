import { memo } from 'react';
import type { FC } from 'react';
import type { Game } from '../../types';
import PlatformIconList from '../shared/PlatformIconList';
import CriticScore from '../shared/CriticScore';
import getCroppedImageUrl from '../../services/image-url';
import FavoriteButton from '../shared/FavoriteButton';
import CollectionButton from '../shared/CollectionButton';
import ProgressiveImage from '../shared/ProgressiveImage';
import { Trash2 } from 'lucide-react';
import useAppDispatch from '../../hooks/useAppDispatch';
import { toggleFavoriteInDb } from '../../store/favoritesSlice';

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
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(game.id, favoriteData); } }}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${game.name}`}
        className="flex items-center gap-3 w-full bg-background-card rounded-xl transition-all duration-200 hover:ring-1 hover:ring-accent/40 hover:bg-zinc-800/60 cursor-pointer p-2.5 sm:p-3 group focus:outline-hidden focus:ring-2 focus:ring-accent"
      >
        {/* Thumbnail — smaller on mobile */}
        <div className="relative overflow-hidden h-14 w-20 sm:h-16 sm:w-28 rounded-lg shrink-0">
          <ProgressiveImage
            src={getCroppedImageUrl(game.background_image)}
            alt={game.name}
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-1 grow min-w-0">
          <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-accent transition-colors truncate">
            {game.name}
          </h2>
          {/* Platforms: visible on sm+ only */}
          <div className="hidden sm:block">
            <PlatformIconList platforms={game.parent_platforms?.map(p => p.platform) ?? []} />
          </div>
          {/* Score shown inline under title on mobile */}
          <div className="flex sm:hidden items-center gap-2 mt-0.5">
            <CriticScore score={game.metacritic} />
          </div>
        </div>

        {/* Actions — always visible, score hidden on mobile (shown above) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:block">
            <CriticScore score={game.metacritic} />
          </div>
          <div className="hidden sm:block">
            <CollectionButton game={favoriteData} dropDirection="up" />
          </div>
          {isFavoritePage ? (
            <button
              onClick={(e) => { e.stopPropagation(); dispatch(toggleFavoriteInDb(favoriteData)); }}
              className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded-full transition-all duration-200 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
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
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(game.id, favoriteData); } }}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${game.name}`}
      className="flex flex-col w-full bg-background-card rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(239,68,68,0.18)] hover:ring-1 hover:ring-accent/40 group cursor-pointer relative focus:outline-hidden focus:ring-2 focus:ring-accent"
    >
      {/* Image area */}
      <div className="relative overflow-hidden h-48 w-full rounded-t-2xl shrink-0">
        <ProgressiveImage
          src={getCroppedImageUrl(game.background_image)}
          alt={game.name}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background-card/80 via-transparent to-transparent pointer-events-none" />
        {/* Heart / Trash button only — dropdown-free, safe inside overflow-hidden */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isFavoritePage ? (
            <button
              onClick={(e) => { e.stopPropagation(); dispatch(toggleFavoriteInDb(favoriteData)); }}
              className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded-full transition-all duration-200 bg-black/50 backdrop-blur-md text-white hover:bg-red-500 hover:scale-110 shadow-lg"
              title="Remove from favorites"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <FavoriteButton game={favoriteData} />
          )}
        </div>
      </div>

      {/* Card footer — NOT overflow-hidden, dropdown opens freely here */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <PlatformIconList platforms={game.parent_platforms?.map(p => p.platform) ?? []} />
          <div className="flex items-center gap-2">
            <CollectionButton game={favoriteData} dropDirection="up" />
            <CriticScore score={game.metacritic} />
          </div>
        </div>
        <h2 className="text-base font-semibold text-zinc-100 group-hover:text-accent transition-colors duration-200 leading-snug">
          {game.name}
        </h2>
      </div>
    </div>
  );
};

export default memo(GameCard);
