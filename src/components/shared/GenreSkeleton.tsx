import type { FC } from 'react';

const GenreSkeleton: FC = () => {
  return (
    <div className="flex items-center gap-3 py-2 animate-pulse">
      {/* Icon Placeholder */}
      <div className="w-8 h-8 rounded-none bg-[#1f1f23]" />
      
      {/* Text Placeholder */}
      <div className="h-4 w-24 bg-[#1f1f23]" />
    </div>
  );
};

export default GenreSkeleton;
