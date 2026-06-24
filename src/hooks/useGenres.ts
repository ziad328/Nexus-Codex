import { useEffect, useState } from "react";
import type { Genre, FetchResponse } from "../types";
import apiClient, { CanceledError } from "../services/api-client";

const useGenres = () => {
  const [data, setData] = useState<Genre[]>(() => {
    const cached = localStorage.getItem('nexus-genres');
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
        const stringifiedOld = localStorage.getItem('nexus-genres');
        
        // Only trigger a re-render and local storage write if the data actually changed
        if (stringifiedNew !== stringifiedOld) {
          setData(res.data.results);
          localStorage.setItem('nexus-genres', stringifiedNew);
        }
        
        setLoading(false);
      } catch (err: any) {
        if (err instanceof CanceledError) return;
        setError(err.message);
        setLoading(false);
      }
    };

    fetchGenres();

    return () => controller.abort();
  }, [data.length]);

  return { data, error, isLoading };
};

export default useGenres;
