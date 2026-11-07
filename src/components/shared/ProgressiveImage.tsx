import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

const ProgressiveImage: FC<Props> = ({ src, alt, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  // A broken image ends the shimmer but stays hidden, leaving the plain box instead of a broken-image icon.
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(Boolean(imgRef.current?.complete));
    setFailed(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-zinc-800/50 ${className}`}>
      {/* Skeleton / Placeholder */}
      <div 
        className={`absolute inset-0 bg-linear-to-r from-zinc-800/50 via-zinc-700/50 to-zinc-800/50 bg-size-[200%_100%] animate-pulse transition-opacity duration-500 ${
          isLoaded || failed ? 'opacity-0' : 'opacity-100'
        }`}
      />
      
      {/* Actual Image */}
      {/* crossorigin: IGDB sends CORS headers, so the offline cache keeps a full copy (see vite.config.ts). */}
      <img
        ref={imgRef}
        src={src}
        crossOrigin="anonymous"
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setFailed(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default ProgressiveImage;
