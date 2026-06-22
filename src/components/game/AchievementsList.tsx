import { useState } from 'react';
import type { FC } from 'react';
import useGameAchievements from '../../hooks/useGameAchievements';
import { Trophy, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Achievement } from '../../types';

interface Props {
  gameId: number;
}

const AchievementItem = ({ achievement }: { achievement: Achievement }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <button 
      onClick={() => setIsExpanded(!isExpanded)}
      className="flex flex-col bg-zinc-800/30 rounded-xl p-2 border border-white/5 hover:bg-zinc-800/80 hover:border-accent/40 transition-colors text-left group w-full cursor-pointer"
    >
      <div className="flex gap-3 items-center w-full">
        <img 
          src={achievement.image} 
          alt={achievement.name} 
          className="w-10 h-10 rounded-lg bg-zinc-900 object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold text-zinc-200 transition-colors group-hover:text-white ${isExpanded ? 'whitespace-normal' : 'truncate'}`}>
            {achievement.name}
          </h4>
          {!isExpanded && (
            <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{achievement.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {achievement.percent && (
            <div className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-md">
              {achievement.percent}%
            </div>
          )}
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-zinc-500 group-hover:text-accent transition-colors">
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden w-full"
          >
            <div className="pt-3 pb-1 pl-13 pr-2">
              <p className="text-xs text-zinc-400 leading-relaxed">
                {achievement.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

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
          <AchievementItem key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
};

export default AchievementsList;
