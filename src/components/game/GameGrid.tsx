import type { FC } from 'react';
import useGames from '../../hooks/useGames';
import type { GameQuery } from '../../types';
import GameCard from './GameCard';
import GameCardSkeleton from '../shared/GameCardSkeleton';

interface Props {
  gameQuery: GameQuery;
  onSelectGame: (id: number) => void;
}

const GameGrid: FC<Props> = ({ gameQuery, onSelectGame }) => {
  const { data, error, isLoading } = useGames(gameQuery);
  const skeletons = Array.from({ length: 12 });

  if (error) return (
    <div className="text-red-500 font-bold p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
      {error}
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full pb-10">
      {isLoading && skeletons.map((_, index) => <GameCardSkeleton key={index} />)}
      
      {!isLoading && data.map((game) => (
        <GameCard key={game.id} game={game} onClick={onSelectGame} />
      ))}
      
      {!isLoading && data.length === 0 && (
        <div className="col-span-full text-center text-gray-500 mt-10 text-xl font-bold tracking-widest uppercase">
          No games found in the abyss.
        </div>
      )}
    </div>
  );
};

export default GameGrid;
