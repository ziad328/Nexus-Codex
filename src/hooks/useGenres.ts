import { useEffect, useState } from "react";
import type { Genre, FetchResponse } from "../types";
import apiClient, { CanceledError } from "../services/api-client";

// v2: IGDB's genres. The old key held RAWG's list, which must not show again.
const CACHE_KEY = 'nexus-genres-v2';

const useGenres = () => {
  const [data, setData] = useState<Genre[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(!data.length);

  useEffect(() => {

    const controller = new AbortController();

    const fetchGenres = async () => {
      try {
        const res = await apiClient.get<FetchResponse<Genre>>("/genres", {
          signal: controller.signal,
        });
        
        const stringifiedNew = JSON.stringify(res.data.results);
        const stringifiedOld = localStorage.getItem(CACHE_KEY);
        
        if (stringifiedNew !== stringifiedOld) {
          setData(res.data.results);
          localStorage.setItem(CACHE_KEY, stringifiedNew);
        }
        
        setLoading(false);
      } catch (err) {
        if (err instanceof CanceledError) return;
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchGenres();

    return () => controller.abort();
  }, [data.length]);

  return { data, error, isLoading };
};

export default useGenres;
