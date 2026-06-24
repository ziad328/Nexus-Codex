import { useEffect, useState, useTransition } from "react";
import apiClient, { CanceledError } from "../services/api-client";
import type { FetchResponse, GameStore } from "../types";

const useGameStores = (gameId: number | null) => {
  const [data, setData] = useState<GameStore[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!gameId) return;

    const controller = new AbortController();

    startTransition(async () => {
      try {
        const res = await apiClient.get<FetchResponse<GameStore>>(`/games/${gameId}/stores`, { signal: controller.signal });
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

export default useGameStores;
