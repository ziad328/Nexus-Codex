import { memo } from 'react';
import type { FC } from 'react';
import type { Game } from '../../types';
import PlatformIconList from '../shared/PlatformIconList';
import CriticScore from '../shared/CriticScore';
import getCroppedImageUrl from '../../services/image-url';

interface Props {
  game: Game;
  onClick: (id: number) => void;
}

const GameCard: FC<Props> = ({ game, onClick }) => {
  return (
    <div
      onClick={() => onClick(game.id)}
      className="flex flex-col w-full bg-background-card rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(239,68,68,0.18)] hover:ring-1 hover:ring-accent/40 group cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden h-48 w-full">
        <img
          src={getCroppedImageUrl(game.background_image)}
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Subtle bottom fade so title area doesn't fight the image */}
        <div className="absolute inset-0 bg-linear-to-t from-background-card/80 via-transparent to-transparent" />
      </div>

      {/* Content Container — clean separation, no negative margin overlap */}
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
