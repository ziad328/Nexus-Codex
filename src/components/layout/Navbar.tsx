import { useState } from 'react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchInput from './SearchInput';

interface Props {
  onMenuToggle?: () => void;
}

const Navbar: FC<Props> = ({ onMenuToggle }) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 py-2 md:px-8 md:py-2 gap-0 md:gap-4 border-b border-zinc-800/50 bg-background/80 backdrop-blur-md sticky top-0 z-40 h-15 md:h-18.75">
      {/* Left Column: Mobile Menu Toggle + Desktop Logo */}
      <motion.div 
        initial={false}
        animate={{
          width: isMobileSearchOpen ? 0 : 'auto',
          opacity: isMobileSearchOpen ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="flex items-center gap-3 md:gap-5 justify-start shrink-0 md:w-auto! md:opacity-100! overflow-hidden md:overflow-visible whitespace-nowrap"
      >
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
            className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          />
          <span className="text-3xl font-medieval tracking-widest uppercase text-white whitespace-nowrap">
            Nexus Codex
          </span>
        </Link>
      </motion.div>

      {/* Perfectly Centered Mobile Logo */}
      <AnimatePresence>
        {!isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto z-10"
          >
            <Link
              to="/"
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            >
              <img
                src="/nexus_logo.png"
                alt="Nexus Logo"
                className="w-8 h-8 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              />
              <span className="text-lg font-medieval tracking-widest uppercase text-white whitespace-nowrap">
                Nexus Codex
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Column: Global Search */}
      <motion.div 
        initial={false}
        animate={{
          width: isMobileSearchOpen ? '100%' : '0%',
          opacity: isMobileSearchOpen ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="flex justify-center items-center gap-2 md:flex-1! md:grow! md:opacity-100! overflow-hidden md:overflow-visible origin-right"
      >
        <div className="w-full min-w-50 md:min-w-0">
          <SearchInput 
            autoFocus={isMobileSearchOpen} 
            onClose={isMobileSearchOpen ? () => setIsMobileSearchOpen(false) : undefined}
          />
        </div>
      </motion.div>

      {/* Mobile Search Icon Toggle */}
      <AnimatePresence>
        {!isMobileSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden flex items-center justify-end grow"
          >
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Open Search"
            >
              <Search className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Column: Empty on mobile, but keeps layout balanced on md */}
      <div className="hidden md:flex md:w-auto shrink-0 justify-end items-center">
      </div>
    </header>
  );
};

export default Navbar;
