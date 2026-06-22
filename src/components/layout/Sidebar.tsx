import type { FC } from 'react';
import useGenres from '../../hooks/useGenres';
import type { Genre } from '../../types';
import GenreSkeleton from '../shared/GenreSkeleton';

interface Props {
  selectedGenre: Genre | null;
  onSelectGenre: (genre: Genre) => void;
}

const Sidebar: FC<Props> = ({ selectedGenre, onSelectGenre }) => {
  const { data, isLoading, error } = useGenres();

  if (error) return null; // Or render an error message state

  return (
    <aside className="w-full lg:w-64 shrink-0 lg:pr-8 mb-8 lg:mb-0">
      <h2 className="text-2xl font-black mb-6 tracking-widest uppercase border-b-2 border-background-card pb-2">
        Genres
      </h2>
      <div className="flex flex-col gap-1">
        {isLoading && Array.from({ length: 15 }).map((_, i) => <GenreSkeleton key={i} />)}
        
        {data.map(genre => (
          <button
            key={genre.id}
            onClick={() => onSelectGenre(genre)}
            className={`flex items-center gap-3 w-full p-2 transition-all duration-200 hover:bg-background-card clip-diagonal-btn ${
              selectedGenre?.id === genre.id 
                ? 'bg-background-card border-l-4 border-accent text-white' 
                : 'text-gray-400 border-l-4 border-transparent'
            }`}
          >
            <div className="w-8 h-8 shrink-0 bg-background-card overflow-hidden clip-diagonal-btn">
              <img 
                src={genre.image_background} 
                className="w-full h-full object-cover filter brightness-75"
                alt={genre.name} 
              />
            </div>
            <span className={`text-left text-lg ${selectedGenre?.id === genre.id ? 'font-bold' : 'font-normal'}`}>
              {genre.name}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
