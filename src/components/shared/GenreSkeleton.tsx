import type { FC } from 'react';

const GenreSkeleton: FC = () => {
  return (
    <div className="flex items-center gap-3 p-2 relative overflow-hidden rounded-xl">
      {/* Shimmer Overlay */}
      <div className="absolute inset-0 z-10 -translate-x-full bg-linear-to-r from-transparent via-zinc-700/20 to-transparent animate-shimmer" />

      {/* Icon Placeholder */}
      <div className="w-8 h-8 rounded-lg bg-zinc-800/80 relative z-0" />
      
      {/* Text Placeholder */}
      <div className="h-4 w-24 rounded bg-zinc-800/80 relative z-0" />
    </div>
  );
};

export default GenreSkeleton;
