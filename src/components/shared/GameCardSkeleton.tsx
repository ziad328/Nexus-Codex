import type { FC } from 'react';

const GameCardSkeleton: FC = () => {
  return (
    <div className="flex flex-col w-full bg-background-card rounded-2xl overflow-hidden animate-pulse">
      {/* Image Placeholder */}
      <div className="h-48 w-full bg-zinc-800/50" />
      
      {/* Content Placeholder */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <div className="w-4 h-4 rounded bg-zinc-800/50" />
            <div className="w-4 h-4 rounded bg-zinc-800/50" />
            <div className="w-4 h-4 rounded bg-zinc-800/50" />
          </div>
          <div className="w-8 h-6 rounded bg-zinc-800/50" />
        </div>
        <div className="w-3/4 h-6 rounded bg-zinc-800/50" />
      </div>
    </div>
  );
};

export default GameCardSkeleton;
