import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';
import DeveloperPage from './pages/DeveloperPage';
import PublisherPage from './pages/PublisherPage';
import SmoothScrollbar from './components/shared/SmoothScrollbar';

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <SmoothScrollbar className="h-full w-full main-scroll-container">
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
