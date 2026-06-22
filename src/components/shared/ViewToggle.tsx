import type { FC } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import type { ViewMode } from '../../types';

interface Props {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

const ViewToggle: FC<Props> = ({ viewMode, onToggle }) => {
  return (
    <div className="flex items-center gap-1 bg-background-card border border-zinc-800 rounded-xl p-1 shrink-0">
      <button
        onClick={() => onToggle('grid')}
        className={`p-2 rounded-lg transition-all duration-200 ${
          viewMode === 'grid'
            ? 'bg-accent text-white shadow-sm'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
        aria-label="Grid view"
        title="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onToggle('list')}
        className={`p-2 rounded-lg transition-all duration-200 ${
          viewMode === 'list'
            ? 'bg-accent text-white shadow-sm'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
        aria-label="List view"
        title="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewToggle;
