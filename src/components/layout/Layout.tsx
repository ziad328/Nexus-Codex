import { useState, useCallback, useEffect } from 'react';
import type { FC } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SmoothScrollbar from '../shared/SmoothScrollbar';

const Layout: FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleMenuToggle = useCallback(() => setIsMobileMenuOpen(p => !p), []);

  // Close mobile menu when navigating to a new route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans selection:bg-accent selection:text-white">
      <Navbar onMenuToggle={handleMenuToggle} />

      <main className="flex flex-col lg:flex-row p-4 md:px-8 md:py-6 max-w-[1920px] mx-auto w-full grow relative">

        {/* Mobile sidebar backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-70 bg-background-card/95 backdrop-blur-xl border-r border-zinc-800/50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-0 lg:w-auto lg:bg-transparent lg:border-none lg:backdrop-blur-none lg:shadow-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full w-full lg:hidden">
            <SmoothScrollbar className="h-full">
              <div className="p-5 pb-24">
                <Sidebar />
              </div>
            </SmoothScrollbar>
          </div>
          <div className="hidden lg:block h-full">
            <Sidebar />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grow flex flex-col w-full min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
