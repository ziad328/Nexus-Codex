import { useEffect, useState } from "react";
import apiClient, { CanceledError } from "../services/api-client";
import type { FetchResponse, Game, GameQuery } from "../types";

const useGames = (gameQuery: GameQuery) => {
  const [data, setData] = useState<Game[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isFetchingNextPage, setFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    const fetchGames = async () => {
      const isFirstPage = page === 1;
      
      if (isFirstPage) {
        setLoading(true);
      } else {
        setFetchingNextPage(true);
      }
      
      setError("");

      try {
        const res = await apiClient.get<FetchResponse<Game>>("/games", {
          params: {
            genres: gameQuery.genre?.id,
            parent_platforms: gameQuery.platform?.id,
            ordering: gameQuery.sortOrder,
            search: gameQuery.searchText || undefined,
            page: page,
          },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setData(prev => isFirstPage ? res.data.results : [...prev, ...res.data.results]);
        setHasNextPage(!!res.data.next);
      } catch (err) {
        if (err instanceof CanceledError || controller.signal.aborted) return;
        setError((err as Error).message);
      } finally {
        if (!controller.signal.aborted) {
          if (isFirstPage) {
            setLoading(false);
          } else {
            setFetchingNextPage(false);
          }
        }
      }
    };

    fetchGames();

    return () => controller.abort();
  }, [
    gameQuery.genre?.id, 
    gameQuery.platform?.id, 
    gameQuery.sortOrder, 
    gameQuery.searchText, 
    page
  ]);

  // Reset page to 1 when query properties change
  useEffect(() => {
    setPage(1);
    setHasNextPage(true);
    setData([]);
  }, [
    gameQuery.genre?.id, 
    gameQuery.platform?.id, 
    gameQuery.sortOrder, 
    gameQuery.searchText
  ]);

  return { 
    data, 
    error, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage,
    fetchNextPage: () => setPage(p => p + 1)
  };
};

export default useGames;
