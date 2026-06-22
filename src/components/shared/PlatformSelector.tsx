import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Gamepad2, Check } from 'lucide-react';
import type { Platform } from '../../types';
import usePlatforms from '../../hooks/usePlatforms';

interface Props {
  selectedPlatform: Platform | null | undefined;
  onSelectPlatform: (platform: Platform | null) => void;
}

const PlatformSelector = ({ selectedPlatform, onSelectPlatform }: Props) => {
  const { data, error } = usePlatforms();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (error) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 h-10 rounded-xl font-semibold text-sm transition-all duration-300 ${
          isOpen || selectedPlatform
            ? 'bg-zinc-800 text-white ring-1 ring-white/10'
            : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-white'
        }`}
      >
        <Gamepad2 className="w-4 h-4" />
        <span className="truncate max-w-30">{selectedPlatform?.name || 'Platform'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : 'text-zinc-500'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <button
              onClick={() => {
                onSelectPlatform(null);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span>All Platforms</span>
              {!selectedPlatform && <Check className="w-4 h-4 text-accent" />}
            </button>
            <div className="h-px bg-white/5 mx-2" />
            {data.map(platform => (
              <button
                key={platform.id}
                onClick={() => {
                  onSelectPlatform(platform);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span className="truncate">{platform.name}</span>
                {selectedPlatform?.id === platform.id && <Check className="w-4 h-4 text-accent" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformSelector;
