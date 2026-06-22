import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Search } from 'lucide-react';

interface Props {
  onSearch: (searchText: string) => void;
}

const SearchInput: FC<Props> = ({ onSearch }) => {
  const [value, setValue] = useState('');
  const isMounted = useRef(false);

  // Debounce effect
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [value, onSearch]);

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="w-full bg-background-card border border-transparent text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 rounded-full py-2 pl-10 pr-4 transition-all duration-300 shadow-sm focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        placeholder="Search games..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
