import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/genre/:genreSlug" element={<HomePage />} />
        <Route path="/collection" element={<CollectionsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
