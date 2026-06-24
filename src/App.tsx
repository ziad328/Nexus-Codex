import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import useAppDispatch from './hooks/useAppDispatch';
import type { RootState } from './store';
import { setAuthModalOpen } from './store/uiSlice';
import { setSession } from './store/authSlice';
import { fetchFavorites, clearFavorites } from './store/favoritesSlice';
import { fetchCollections, clearCollections } from './store/collectionsSlice';
import { supabase } from './utils/supabase';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';
import DeveloperPage from './pages/DeveloperPage';
import PublisherPage from './pages/PublisherPage';
import SmoothScrollbar from './components/shared/SmoothScrollbar';
import AuthModal from './components/auth/AuthModal';
import PWAReloadPrompt from './components/shared/PWAReloadPrompt';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nexusScrollToTop'));
  }, [pathname]);

  return null;
}

function App() {
  const dispatch = useAppDispatch();
  const { isAuthModalOpen } = useSelector((state: RootState) => state.ui);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {

    const hash = window.location.hash;
    if (hash && hash.includes('error=access_denied') && hash.includes('error_code=otp_expired')) {
      setAuthError('This magic link has expired. Please try signing in again.');

      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      

      setTimeout(() => {
        setAuthError(null);
      }, 6000);
    }
  }, []);

  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch(setSession({ session, user: session?.user ?? null }));
    });


    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      dispatch(setSession({ session, user: session?.user ?? null }));
      if (session) {
        dispatch(setAuthModalOpen(false));
        dispatch(fetchFavorites());
        dispatch(fetchCollections());
      } else if (event === 'SIGNED_OUT') {
        dispatch(clearFavorites());
        dispatch(clearCollections());
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <PWAReloadPrompt />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => dispatch(setAuthModalOpen(false))} />
      <SmoothScrollbar className="h-full w-full main-scroll-container">
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/genre/:genreSlug" element={<HomePage />} />
            <Route path="/developer/:developerSlug" element={<DeveloperPage />} />
            <Route path="/publisher/:publisherSlug" element={<PublisherPage />} />
            <Route path="/collection" element={<CollectionsPage />} />
          </Route>
        </Routes>
      </SmoothScrollbar>

      {/* Auth Error Toast */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-24 right-4 md:right-8 z-50 px-5 py-4 bg-zinc-900 border border-orange-500/30 rounded-2xl shadow-[0_10px_40px_rgba(249,115,22,0.2)] flex items-start gap-4 w-[calc(100%-2rem)] md:w-auto md:max-w-sm"
          >
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <div className="pt-0.5">
              <h4 className="text-orange-400 font-bold text-sm">Authentication Failed</h4>
              <p className="text-orange-400/80 text-sm mt-1 leading-relaxed">{authError}</p>
            </div>
            <button 
              onClick={() => setAuthError(null)}
              className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-white rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
