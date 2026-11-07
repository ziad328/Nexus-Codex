import { Link } from 'react-router-dom';
import SEO from '../components/shared/SEO';

function NotFoundPage() {
  return (
    <div className="grow flex flex-col items-center text-center gap-4 py-16 md:py-24 px-4">
      <SEO title="Page Not Found | Nexus Codex" description="This page doesn't exist on Nexus Codex." />
      <p className="text-accent font-medieval text-6xl font-bold">404</p>
      <h1 className="text-2xl md:text-3xl font-bold text-white">Page not found</h1>
      <p className="text-zinc-500 text-sm max-w-sm">This page doesn't exist. It may have moved, or the link may be wrong.</p>
      <Link to="/" className="mt-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors">
        Back to all games
      </Link>
    </div>
  );
}

export default NotFoundPage;
