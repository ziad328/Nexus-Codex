import { ChevronDown } from 'lucide-react';
import type { Platform } from '../../types';
import usePlatforms from '../../hooks/usePlatforms';

interface Props {
  selectedPlatform: Platform | null | undefined;
  onSelectPlatform: (platform: Platform | null) => void;
}

const PlatformSelector = ({ selectedPlatform, onSelectPlatform }: Props) => {
  const { data, error } = usePlatforms();

  if (error) return null;

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200">
        {selectedPlatform?.name || 'Platforms'}
        <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
      </button>

      <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-800 rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
        <button
          onClick={() => onSelectPlatform(null)}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors ${!selectedPlatform ? 'text-accent font-bold' : 'text-zinc-300'}`}
        >
          All Platforms
        </button>
        {data.map(platform => (
          <button
            key={platform.id}
            onClick={() => onSelectPlatform(platform)}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors ${selectedPlatform?.id === platform.id ? 'text-accent font-bold' : 'text-zinc-300'}`}
          >
            {platform.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlatformSelector;
