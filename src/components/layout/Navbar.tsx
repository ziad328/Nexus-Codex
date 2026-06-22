import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import SearchInput from './SearchInput';

interface Props {
  onMenuToggle?: () => void;
}

const Navbar: FC<Props> = ({ onMenuToggle }) => {
  return (
    <header className="flex items-center justify-between px-4 py-2 md:px-8 md:py-2 gap-3 md:gap-4 border-b border-zinc-800/50 bg-background/80 backdrop-blur-md sticky top-0 z-40 h-15 md:h-18.75">
      {/* Left Column: Mobile Menu Toggle + Logo */}
      <div className="flex items-center gap-3 md:gap-5 md:w-1/4 justify-start shrink-0">
        {onMenuToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Toggle Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <Link
          to="/"
          className="hidden md:flex items-center gap-5 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
        >
          <img
            src="/nexus_logo.png"
            alt="Nexus Logo"
            className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          />
          <span className="text-2xl md:text-3xl font-medieval tracking-widest uppercase text-white hidden lg:block whitespace-nowrap">
            Nexus Codex
          </span>
        </Link>
      </div>

      {/* Center Column: Global Search */}
      <div className="w-full md:w-2/4 flex justify-center grow">
        <SearchInput />
      </div>

      <div className="hidden md:flex md:w-1/4 shrink-0 justify-end items-center">
      </div>
    </header>
  );
};

export default Navbar;
