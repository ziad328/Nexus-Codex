import type { FC } from 'react';
import SearchInput from './SearchInput';

interface Props {
  onSearch: (searchText: string) => void;
}

const Header: FC<Props> = ({ onSearch }) => {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between p-4 md:px-8 md:py-6 gap-6 border-b-2 border-background-card">
      <div className="flex items-center gap-3">
        {/* Simple sharp logo */}
        <div className="w-12 h-12 bg-accent clip-diagonal flex items-center justify-center font-black text-2xl shadow-[0_0_15px_rgba(229,43,18,0.5)]">
          N
        </div>
        <h1 className="text-3xl font-black tracking-widest uppercase text-white">Nexus</h1>
      </div>
      
      <div className="w-full md:w-auto grow flex justify-center md:justify-end">
        <SearchInput onSearch={onSearch} />
      </div>
    </header>
  );
};

export default Header;
