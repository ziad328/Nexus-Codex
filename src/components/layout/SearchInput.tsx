import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Search, X } from 'lucide-react';
import useSearchContext from '../../hooks/useSearchContext';

interface Props {
  autoFocus?: boolean;
  onClose?: () => void;
}

const SearchInput: FC<Props> = ({ autoFocus, onClose }) => {
  const [query, setQuery] = useSearchContext();
  const [value, setValue] = useState(query);
  const isMounted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local input with global query when route changes
  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small timeout to ensure transition completes before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const timeoutId = setTimeout(() => {
      setQuery(value);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [value, setQuery]);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
        <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
      </div>
      <input
        ref={inputRef}
        type="text"
        className="w-full bg-background-card border border-transparent text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 rounded-full py-2 md:py-2.5 pl-9 md:pl-11 pr-11 md:pr-14 text-sm md:text-base transition-all duration-300 shadow-sm focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        placeholder="Search games..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {(value || onClose) && (
        <button
          onClick={() => {
            setValue('');
            setQuery('');
            if (onClose) onClose();
          }}
          className="absolute inset-y-0 right-0 px-3 md:px-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label={value ? "Clear search" : "Close search"}
        >
          <X className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
