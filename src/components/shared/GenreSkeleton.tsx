import type { FC } from 'react';

const GenreSkeleton: FC = () => {
  return (
    <div className="flex items-center gap-3 p-2 animate-pulse">
      {/* Icon Placeholder */}
      <div className="w-8 h-8 rounded-lg bg-zinc-800/50" />
      
      {/* Text Placeholder */}
      <div className="h-4 w-24 rounded bg-zinc-800/50" />
    </div>
  );
};

export default GenreSkeleton;
