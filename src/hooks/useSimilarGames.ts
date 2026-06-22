import { useEffect, useState } from "react";
import apiClient, { CanceledError } from "../services/api-client";
import type { FetchResponse, Game } from "../types";

const useSimilarGames = (gameId: number | null) => {
  const [data, setData] = useState<Game[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    const controller = new AbortController();

    setLoading(true);
    apiClient
      .get<FetchResponse<Game>>(`/games/${gameId}/game-series`, { signal: controller.signal })
      .then((res) => {
        setData(res.data.results);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof CanceledError) return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [gameId]);

  return { data, error, isLoading };
};

export default useSimilarGames;
