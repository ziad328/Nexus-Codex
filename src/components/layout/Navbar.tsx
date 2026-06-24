import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, LogIn, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setAuthModalOpen } from '../../store/uiSlice';
import { supabase } from '../../utils/supabase';
import SearchInput from './SearchInput';

interface Props {
  onMenuToggle?: () => void;
}

const Navbar: FC<Props> = ({ onMenuToggle }) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isProfileOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 md:px-8 md:py-2 gap-0 border-b border-zinc-800/50 bg-background/80 backdrop-blur-md sticky top-0 z-40 h-15 md:h-18.75">
      {/* Left Column: Mobile Menu Toggle + Desktop Logo */}
      <motion.div
        initial={false}
        animate={{
          width: isMobileSearchOpen ? 0 : 'auto',
          opacity: isMobileSearchOpen ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="flex items-center gap-3 md:gap-5 justify-start shrink-0 md:opacity-100! overflow-hidden md:overflow-visible whitespace-nowrap z-10"
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
        className="flex justify-center items-center md:flex-1 xl:absolute xl:left-1/2 xl:-translate-x-1/2 md:w-full! xl:max-w-2xl md:opacity-100! overflow-hidden md:overflow-visible origin-right md:px-4 lg:px-8 z-10"
      >
        <div className="w-full flex justify-center min-w-50 md:min-w-0">
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

      {/* Right Column: Auth / User Profile */}
      <div className="hidden md:flex shrink-0 justify-end items-center gap-4 z-10">
        {user ? (
          <div className="relative flex items-center" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-zinc-800/80 border border-white/10 hover:border-accent/50 flex items-center justify-center transition-all duration-200 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] group cursor-pointer"
              aria-label="User Menu"
            >
              <User className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 group-hover:text-white transition-colors" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-3 w-56 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/5 bg-white/2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">
                      Signed in as
                    </p>
                    <p className="text-sm font-medium text-white truncate" title={user.email}>
                      {user.email}
                    </p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { setIsProfileOpen(false); handleSignOut(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={() => dispatch(setAuthModalOpen(true))}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
