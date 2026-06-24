import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

const ProgressiveImage: FC<Props> = ({ src, alt, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-zinc-800/50 ${className}`}>
      {/* Skeleton / Placeholder */}
      <div 
        className={`absolute inset-0 bg-linear-to-r from-zinc-800/50 via-zinc-700/50 to-zinc-800/50 bg-size-[200%_100%] animate-pulse transition-opacity duration-500 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      
      {/* Actual Image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default ProgressiveImage;
