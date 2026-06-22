import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';
import SmoothScrollbar from './components/shared/SmoothScrollbar';

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <SmoothScrollbar className="h-full w-full">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/genre/:genreSlug" element={<HomePage />} />
            <Route path="/collection" element={<CollectionsPage />} />
          </Route>
        </Routes>
      </SmoothScrollbar>
    </div>
  );
}

export default App;
