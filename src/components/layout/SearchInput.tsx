import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Search } from 'lucide-react';

interface Props {
  onSearch: (searchText: string) => void;
}

const SearchInput: FC<Props> = ({ onSearch }) => {
  const [value, setValue] = useState('');

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [value, onSearch]);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="w-full bg-background-card border-2 border-transparent text-white placeholder-gray-400 focus:outline-none focus:border-accent clip-diagonal-btn py-2 pl-10 pr-4 transition-colors"
        placeholder="Search the abyss..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
