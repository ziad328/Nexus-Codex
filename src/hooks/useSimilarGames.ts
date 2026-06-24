import { useEffect, useState, useTransition } from "react";
import apiClient, { CanceledError } from "../services/api-client";
import type { FetchResponse, Game } from "../types";

const useSimilarGames = (gameId: number | null) => {
  const [data, setData] = useState<Game[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!gameId) return;

    const controller = new AbortController();

    startTransition(async () => {
      try {
        const res = await apiClient.get<FetchResponse<Game>>(`/games/${gameId}/game-series`, { signal: controller.signal });
        setData(res.data.results);
      } catch (err: any) {
        if (err instanceof CanceledError) return;
        setError(err.message);
      }
    });

    return () => controller.abort();
  }, [gameId]);

  return { data, error, isLoading: isPending };
};

export default useSimilarGames;
