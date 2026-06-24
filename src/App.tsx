import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch(setSession({ session, user: session?.user ?? null }));
    });

    // Listen for auth changes (login/logout/magic link click)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setSession({ session, user: session?.user ?? null }));
      if (session) {
        dispatch(setAuthModalOpen(false));
        // User logged in: fetch their cloud data
        dispatch(fetchFavorites());
        dispatch(fetchCollections());
      } else {
        // User logged out: fresh slate
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
    </div>
  );
}

export default App;
