import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Search, X } from 'lucide-react';
import useSearchContext from '../../hooks/useSearchContext';

const SearchInput: FC = () => {
  const [query, setQuery] = useSearchContext();
  const [value, setValue] = useState(query);
  const isMounted = useRef(false);

  // Sync local input with global query when route changes
  useEffect(() => {
    setValue(query);
  }, [query]);

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
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="w-full bg-background-card border border-transparent text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 rounded-full py-2 pl-10 pr-10 transition-all duration-300 shadow-sm focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        placeholder="Search games..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button
          onClick={() => {
            setValue('');
            setQuery('');
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
