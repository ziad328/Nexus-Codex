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
      className="flex flex-col w-full bg-background-card rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:ring-1 hover:ring-accent/50 group cursor-pointer"
    >
      {/* Image Container with overlay */}
      <div className="relative overflow-hidden h-48 w-full">
        <img 
          src={getCroppedImageUrl(game.background_image)} 
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 filter brightness-90 group-hover:brightness-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background-card via-transparent to-transparent opacity-90" />
      </div>
      
      {/* Content Container */}
      <div className="p-4 flex flex-col grow relative z-10 -mt-6">
        <div className="flex justify-between items-center mb-3">
          <PlatformIconList platforms={game.parent_platforms.map(p => p.platform)} />
          <CriticScore score={game.metacritic} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white group-hover:text-accent transition-colors duration-200 leading-tight">
          {game.name}
        </h2>
      </div>
    </div>
  );
};

export default GameCard;
