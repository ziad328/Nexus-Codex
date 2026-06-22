import { memo } from 'react';
import type { FC } from 'react';
import SearchInput from './SearchInput';

interface Props {
  onSearch: (searchText: string) => void;
}

const Header: FC<Props> = ({ onSearch }) => {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between p-4 md:px-8 md:py-6 gap-6 border-b border-zinc-800/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-3 md:w-1/4">
        <img 
          src="/nexus_logo.png" 
          alt="Nexus Logo" 
          className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
        />
        <h1 className="text-3xl font-black tracking-widest uppercase text-white hidden lg:block">Nexus</h1>
      </div>
      
      <div className="w-full md:w-2/4 flex justify-center">
        <SearchInput onSearch={onSearch} />
      </div>

      <div className="hidden md:block md:w-1/4"></div>
    </header>
  );
};

export default memo(Header);
