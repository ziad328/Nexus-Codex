import { useEffect, useState, useRef } from 'react';
import type { FC } from 'react';
import useGameDetails from '../../hooks/useGameDetails';
import useScreenshots from '../../hooks/useScreenshots';
import CriticScore from '../shared/CriticScore';
import PlatformIconList from '../shared/PlatformIconList';
import getCroppedImageUrl from '../../services/image-url';
import SmoothScrollbar from '../shared/SmoothScrollbar';
import FavoriteButton from '../shared/FavoriteButton';
import CollectionButton from '../shared/CollectionButton';
import useShare from '../../hooks/useShare';
import { Share2, Check, X } from 'lucide-react';
import useGameTrailers from '../../hooks/useGameTrailers';
import SimilarGamesCarousel from './SimilarGamesCarousel';
import CustomVideoPlayer from '../shared/CustomVideoPlayer';

interface Props {
  gameId: number | null;
  onClose: () => void;
  onSelectGame?: (id: number, game: any) => void;
}

const GameDetailsModal: FC<Props> = ({ gameId, onClose, onSelectGame }) => {
  const { data: game, isLoading, error } = useGameDetails(gameId);
  const { data: screenshots, isLoading: screenshotsLoading } = useScreenshots(gameId);
  const { data: trailers, isLoading: trailersLoading } = useGameTrailers(gameId);
  const { share, status: shareStatus } = useShare();
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);

  // Reset accent color on game change
  useEffect(() => {
    setAccentColor(null);
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    const handleScrollPrevent = (e: WheelEvent | TouchEvent) => {
      const modal = document.getElementById('game-modal-content');
      // If the scroll target is inside the modal, allow it to scroll
      if (modal && modal.contains(e.target as Node)) {
        return;
      }
      e.preventDefault();
    };

    const handleKeyPrevent = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.code)) {
        const modal = document.getElementById('game-modal-content');
        if (modal && modal.contains(e.target as Node)) {
          return;
        }
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleScrollPrevent, { passive: false });
    window.addEventListener('touchmove', handleScrollPrevent, { passive: false });
    window.addEventListener('keydown', handleKeyPrevent, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleScrollPrevent);
      window.removeEventListener('touchmove', handleScrollPrevent);
      window.removeEventListener('keydown', handleKeyPrevent);
    };
  }, [gameId]);

  const handleHeroLoad = async () => {
    if (!heroImgRef.current) return;
    try {
      const mod = await import('colorthief');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ColorThief = (mod as any).default ?? mod;
      const ct = new ColorThief() as { getColor(img: HTMLImageElement): [number, number, number] };
      const [r, g, b] = ct.getColor(heroImgRef.current);
      setAccentColor(`rgb(${r}, ${g}, ${b})`);
    } catch { /* ignore cross-origin or load errors */ }
  };

  if (!gameId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        id="game-modal-content"
        className="relative w-full max-w-5xl max-h-[92vh] bg-zinc-900 rounded-3xl overflow-hidden ring-1 ring-white/5 flex flex-col z-10 transition-shadow duration-700"
        style={{
          boxShadow: accentColor
            ? `0 0 0 1px rgba(255,255,255,0.05), 0 0 80px -10px ${accentColor}88`
            : '0 0 60px rgba(0,0,0,0.8)',
        }}
      >

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-50 w-9 h-9 bg-zinc-800 hover:bg-accent text-zinc-300 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <SmoothScrollbar className="w-full h-full flex flex-col">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-96 gap-4 text-zinc-500">
              <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm tracking-wide">Loading...</span>
            </div>
          )}

          {error && (
            <div className="m-8 p-6 bg-red-500/10 text-red-400 font-medium rounded-2xl border border-red-500/20 text-center">
              {error}
            </div>
          )}

          {game && (
            <div className="flex flex-col">

              <div className="relative w-full h-56 md:h-80 shrink-0">
                <img
                  ref={heroImgRef}
                  src={game.background_image}
                  alt={game.name}
                  onLoad={handleHeroLoad}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-zinc-900/50 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full px-6 pb-6 md:px-10 md:pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <CriticScore score={game.metacritic} />
                    <div className="ml-auto flex items-center gap-2">
                      {/* Collection button */}
                      <CollectionButton
                        game={{
                          id: game.id,
                          name: game.name,
                          slug: (game as any).slug ?? '',
                          background_image: game.background_image,
                          metacritic: game.metacritic ?? null,
                          parent_platforms: game.parent_platforms,
                        }}
                      />
                      {/* Favorite button */}
                      <FavoriteButton
                        game={{
                          id: game.id,
                          name: game.name,
                          slug: (game as any).slug ?? '',
                          background_image: game.background_image,
                          metacritic: game.metacritic ?? null,
                          parent_platforms: game.parent_platforms,
                        }}
                        className="shadow-lg"
                      />
                      {/* Share button */}
                      <button
                        onClick={() => share({
                          title: game.name,
                          text: `Check out ${game.name} on Nexus Codex!`,
                          url: `${window.location.origin}/?gameId=${gameId}`,
                        })}
                        className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-all duration-300 shadow-lg ${
                          shareStatus === 'copied'
                            ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/40'
                            : shareStatus === 'shared'
                            ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                            : shareStatus === 'error'
                            ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
                            : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700'
                        }`}
                        title="Share this game"
                      >
                        {shareStatus === 'copied' ? (
                          <><Check className="w-3.5 h-3.5" /> Copied!</>
                        ) : shareStatus === 'shared' ? (
                          <><Check className="w-3.5 h-3.5" /> Shared!</>
                        ) : shareStatus === 'error' ? (
                          <><X className="w-3.5 h-3.5" /> Failed</>  
                        ) : (
                          <><Share2 className="w-3.5 h-3.5" /> Share</>
                        )}
                      </button>
                    </div>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                    {game.name}
                  </h1>
                </div>
              </div>

              <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 space-y-8">

                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100 mb-3">About</h2>
                    <p className="text-zinc-400 leading-relaxed text-sm whitespace-pre-line line-clamp-12">
                      {game.description_raw || 'No description available.'}
                    </p>
                  </div>

                  {!screenshotsLoading && screenshots.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-100 mb-3">Gallery</h2>
                      
                      {/* Trailers */}
                      {!trailersLoading && trailers.length > 0 && (
                        <div className="mb-4">
                          <CustomVideoPlayer 
                            src={trailers[0].data[480]} 
                            poster={trailers[0].preview} 
                          />
                        </div>
                      )}

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

                <div className="space-y-4">
                  <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/5 space-y-5">
                    <div>
                      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">Platforms</p>
                      <PlatformIconList platforms={game.parent_platforms?.map(p => p.platform) || []} />
                    </div>
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
              
              <div className="px-6 pb-10 md:px-10">
                <SimilarGamesCarousel gameId={game.id} onSelectGame={onSelectGame} />
              </div>
            </div>
          )}
        </SmoothScrollbar>
      </div>
    </div>
  );
};

export default GameDetailsModal;
