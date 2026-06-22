import type { FC } from 'react';
import type { Game } from '../../types';
import PlatformIconList from '../shared/PlatformIconList';
import CriticScore from '../shared/CriticScore';

interface Props {
  game: Game;
}

// Utility to crop RAWG images for better performance
const getCroppedImageUrl = (url: string) => {
  if (!url) return '';
  const target = 'media/';
  const index = url.indexOf(target) + target.length;
  return url.slice(0, index) + 'crop/600/400/' + url.slice(index);
};

const GameCard: FC<Props> = ({ game }) => {
  return (
    <div className="flex flex-col w-full bg-background-card overflow-hidden clip-diagonal border-b-2 border-transparent transition-all duration-200 hover:border-accent hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(229,43,18,0.15)] group cursor-pointer">
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
