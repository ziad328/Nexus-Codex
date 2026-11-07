import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * The open game lives in the URL as `?game=<IGDB id>`, so every page deep-links the same way.
 * Old `?gameId=` links held RAWG ids, which would open the wrong game, so they're ignored.
 * Opening and closing replace the history entry, so Back leaves the page instead of reopening games.
 */
const useGameParam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const gameId = Number(searchParams.get('game')) || null;

  const openGame = useCallback((id: number) => setSearchParams({ game: String(id) }, { replace: true }), [setSearchParams]);
  const closeGame = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  return { gameId, openGame, closeGame };
};

export default useGameParam;
