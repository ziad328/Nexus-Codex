import useData from './useData';
import type { Screenshot } from '../types';

const useScreenshots = (gameId: number | null) => {
  const endpoint = gameId ? `/games/${gameId}/screenshots` : '';
  
  // Return empty/loading state manually if no gameId, or rely on useData's endpoint check
  // useData requires an endpoint string to not be empty, so we handle it gracefully.
  const query = useData<Screenshot>(endpoint, {}, [gameId]);
  
  // If gameId is null, override the hook response to be empty immediately
  if (!gameId) return { data: [], isLoading: false, error: '' };

  return query;
};

export default useScreenshots;
