import type { FC } from 'react';

const GameCardSkeleton: FC = () => {
  return (
    <div className="flex flex-col w-full bg-background-card overflow-hidden clip-diagonal animate-pulse border-b-2 border-background-card">
      {/* Image Placeholder */}
      <div className="h-48 w-full bg-[#1f1f23]" />
      
      {/* Content Placeholder */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <div className="w-4 h-4 bg-[#1f1f23]" />
            <div className="w-4 h-4 bg-[#1f1f23]" />
            <div className="w-4 h-4 bg-[#1f1f23]" />
          </div>
          <div className="w-8 h-6 bg-[#1f1f23]" />
        </div>
        <div className="w-3/4 h-6 bg-[#1f1f23]" />
      </div>
    </div>
  );
};

export default GameCardSkeleton;
