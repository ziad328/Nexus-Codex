import type { FC } from 'react';

const GameCardSkeleton: FC = () => {
  return (
    <div className="flex flex-col w-full bg-background-card rounded-2xl overflow-hidden relative">
      {/* Shimmer Overlay */}
      <div className="absolute inset-0 z-10 -translate-x-full bg-linear-to-r from-transparent via-zinc-700/20 to-transparent animate-shimmer" />

      {/* Image Placeholder */}
      <div className="h-48 w-full bg-zinc-800/80" />
      
      {/* Content Placeholder */}
      <div className="p-4 space-y-4 relative z-0">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <div className="w-4 h-4 rounded bg-zinc-800/80" />
            <div className="w-4 h-4 rounded bg-zinc-800/80" />
            <div className="w-4 h-4 rounded bg-zinc-800/80" />
          </div>
          <div className="w-8 h-6 rounded bg-zinc-800/80" />
        </div>
        <div className="w-3/4 h-6 rounded bg-zinc-800/80" />
      </div>
    </div>
  );
};

export default GameCardSkeleton;
