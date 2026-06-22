import type { FC } from 'react';
import useGameDetails from '../../hooks/useGameDetails';
import useScreenshots from '../../hooks/useScreenshots';
import CriticScore from '../shared/CriticScore';
import PlatformIconList from '../shared/PlatformIconList';
import getCroppedImageUrl from '../../services/image-url';

interface Props {
  gameId: number | null;
  onClose: () => void;
}

const GameDetailsModal: FC<Props> = ({ gameId, onClose }) => {
  const { data: game, isLoading, error } = useGameDetails(gameId);
  const { data: screenshots, isLoading: screenshotsLoading } = useScreenshots(gameId);

  if (!gameId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-background-card rounded-3xl overflow-y-auto shadow-[0_0_50px_rgba(239,68,68,0.15)] ring-1 ring-zinc-800/50 flex flex-col z-10 scrollbar-hide">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-accent text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        {isLoading && (
          <div className="p-12 text-center text-gray-400 animate-pulse flex flex-col items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
            Loading Deep Archives...
          </div>
        )}

        {error && (
          <div className="p-12 text-center text-red-500 font-bold bg-red-500/10 m-6 rounded-2xl border border-red-500/50">
            {error}
          </div>
        )}

        {game && (
          <div className="flex flex-col">
            {/* Hero Banner */}
            <div className="relative w-full h-64 md:h-96 shrink-0">
              <img 
                src={game.background_image} 
                alt={game.name}
                className="w-full h-full object-cover rounded-t-3xl"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background-card via-background-card/60 to-transparent" />
              
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <PlatformIconList platforms={game.parent_platforms?.map(p => p.platform) || []} />
                    <CriticScore score={game.metacritic} />
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">
                    {game.name}
                  </h1>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Main Content (Left) */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-white">About</h2>
                  <div 
                    className="text-gray-300 leading-relaxed space-y-4 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: game.description_raw || 'No description available.' }}
                  />
                </div>

                {/* Screenshots Grid */}
                {!screenshotsLoading && screenshots && screenshots.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-white">Gallery</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {screenshots.map(ss => (
                        <div key={ss.id} className="rounded-2xl overflow-hidden hover:ring-2 hover:ring-accent transition-all duration-300">
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

              {/* Sidebar Info (Right) */}
              <div className="space-y-6">
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
                  <div className="grid grid-cols-2 gap-y-6">
                    <div>
                      <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Release Date</h3>
                      <p className="text-white font-medium">{game.released || 'Unknown'}</p>
                    </div>
                    <div>
                      <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Developer</h3>
                      <p className="text-white font-medium">{game.developers?.map(d => d.name).join(', ') || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Publisher</h3>
                      <p className="text-white font-medium">{game.publishers?.map(p => p.name).join(', ') || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetailsModal;
