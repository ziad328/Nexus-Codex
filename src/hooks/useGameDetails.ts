import { useEffect, useState } from 'react';
import apiClient from '../services/api-client';
import type { GameDetails } from '../types';

const useGameDetails = (id: number | null) => {
  const [data, setData] = useState<GameDetails | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchGame = async () => {
      setData(null);
      setLoading(true);
      setError('');

      try {
        const res = await apiClient.get<GameDetails>(`/games/${id}`, { signal: controller.signal });
        setData(res.data);
        setLoading(false);
      } catch (err) {
        const error = err as Error & { code?: string };
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
        setError(error.message);
        setLoading(false);
      }
    };

    fetchGame();

    return () => controller.abort();
  }, [id]);

  return { data, isLoading, error };
};

export default useGameDetails;
