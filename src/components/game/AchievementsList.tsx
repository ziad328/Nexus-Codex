import type { FC } from 'react';
import useGameAchievements from '../../hooks/useGameAchievements';
import { Trophy } from 'lucide-react';

interface Props {
  gameId: number;
}

const AchievementsList: FC<Props> = ({ gameId }) => {
  const { data, isLoading, error } = useGameAchievements(gameId);

  if (error || isLoading || data.length === 0) return null;

  return (
    <div className="pt-4 border-t border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-accent" />
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Top Achievements</p>
      </div>
      <div className="flex flex-col gap-3">
        {data.map(achievement => (
          <div key={achievement.id} className="flex gap-3 items-center bg-zinc-800/30 rounded-xl p-2 border border-white/5 hover:bg-zinc-800/80 transition-colors">
            <img 
              src={achievement.image} 
              alt={achievement.name} 
              className="w-10 h-10 rounded-lg bg-zinc-900 object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-zinc-200 truncate">{achievement.name}</h4>
              <p className="text-xs text-zinc-500 line-clamp-1">{achievement.description}</p>
            </div>
            {achievement.percent && (
              <div className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-md shrink-0">
                {achievement.percent}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsList;
