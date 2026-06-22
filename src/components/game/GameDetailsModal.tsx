import { useEffect } from 'react';
import type { FC } from 'react';
import useGameDetails from '../../hooks/useGameDetails';
import useScreenshots from '../../hooks/useScreenshots';
import CriticScore from '../shared/CriticScore';
import PlatformIconList from '../shared/PlatformIconList';
import getCroppedImageUrl from '../../services/image-url';
import SmoothScrollbar from '../shared/SmoothScrollbar';

interface Props {
  gameId: number | null;
  onClose: () => void;
}

const GameDetailsModal: FC<Props> = ({ gameId, onClose }) => {
  const { data: game, isLoading, error } = useGameDetails(gameId);
  const { data: screenshots, isLoading: screenshotsLoading } = useScreenshots(gameId);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (gameId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [gameId]);

  if (!gameId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel Container (Fixed boundary, handles border radius) */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-zinc-900 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] ring-1 ring-white/5 flex flex-col z-10">

        {/* Close Button (Fixed to the container, won't scroll away) */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-50 w-9 h-9 bg-zinc-800 hover:bg-accent text-zinc-300 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable Content Area */}
        <SmoothScrollbar className="w-full h-full flex flex-col">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-96 gap-4 text-zinc-500">
              <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm tracking-wide">Loading...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="m-8 p-6 bg-red-500/10 text-red-400 font-medium rounded-2xl border border-red-500/20 text-center">
              {error}
            </div>
          )}

          {/* Content */}
          {game && (
            <div className="flex flex-col">

              {/* Hero Image */}
              <div className="relative w-full h-56 md:h-80 shrink-0">
                <img
                  src={game.background_image}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
                {/* Fade into modal background */}
                <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-zinc-900/50 to-transparent" />

                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 w-full px-6 pb-6 md:px-10 md:pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <PlatformIconList platforms={game.parent_platforms?.map(p => p.platform) || []} />
                    <CriticScore score={game.metacritic} />
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                    {game.name}
                  </h1>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Description + Screenshots */}
                <div className="lg:col-span-2 space-y-8">

                  {/* Description */}
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100 mb-3">About</h2>
                    {/* RAWG's description_raw is plain text with \n newlines */}
                    <p className="text-zinc-400 leading-relaxed text-sm whitespace-pre-line line-clamp-12">
                      {game.description_raw || 'No description available.'}
                    </p>
                  </div>

                  {/* Screenshots */}
                  {!screenshotsLoading && screenshots.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-100 mb-3">Gallery</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {screenshots.map(ss => (
                          <div key={ss.id} className="aspect-video rounded-xl overflow-hidden bg-zinc-800 hover:ring-2 hover:ring-accent/60 transition-all duration-300">
                            <img
                              src={getCroppedImageUrl(ss.image)}
                              alt="Screenshot"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Metadata */}
                <div className="space-y-4">
                  <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/5 space-y-5">
                    <div>
                      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1">Release Date</p>
                      <p className="text-zinc-100 text-sm font-medium">{game.released || '—'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1">Developer</p>
                      <p className="text-zinc-100 text-sm font-medium">{game.developers?.map(d => d.name).join(', ') || '—'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1">Publisher</p>
                      <p className="text-zinc-100 text-sm font-medium">{game.publishers?.map(p => p.name).join(', ') || '—'}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </SmoothScrollbar>
      </div>
    </div>
  );
};

export default GameDetailsModal;
