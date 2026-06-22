import { useEffect, useState, useRef } from "react";
import apiClient, { CanceledError } from "../services/api-client";
import type { FetchResponse, Game, GameQuery } from "../types";

const useGames = (gameQuery: GameQuery) => {
  const [data, setData] = useState<Game[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isFetchingNextPage, setFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(1);

  const lastQueryRef = useRef(gameQuery);

  useEffect(() => {
    let currentPage = page;
    
    // Check if query changed (ignoring page)
    const isNewQuery = 
      lastQueryRef.current.genre?.id !== gameQuery.genre?.id ||
      lastQueryRef.current.platform?.id !== gameQuery.platform?.id ||
      lastQueryRef.current.sortOrder !== gameQuery.sortOrder ||
      lastQueryRef.current.searchText !== gameQuery.searchText;

    if (isNewQuery) {
      setData([]);
      setPage(1);
      currentPage = 1;
      setHasNextPage(true);
      lastQueryRef.current = gameQuery;
    }

    if (!hasNextPage && !isNewQuery) return;

    const controller = new AbortController();

    const fetchGames = async () => {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setFetchingNextPage(true);
      }
      setError("");

      try {
        const res = await apiClient.get<FetchResponse<Game>>("/games", {
          params: {
            genres: gameQuery?.genre?.id,
            parent_platforms: gameQuery?.platform?.id,
            ordering: gameQuery?.sortOrder,
            search: gameQuery?.searchText,
            page: currentPage,
          },
          signal: controller.signal,
        });

        setData(prev => currentPage === 1 ? res.data.results : [...prev, ...res.data.results]);
        setHasNextPage(!!res.data.next);
        
        if (currentPage === 1) {
          setLoading(false);
        } else {
          setFetchingNextPage(false);
        }
      } catch (err) {
        if (err instanceof CanceledError) return;
        setError((err as Error).message);
        setLoading(false);
        setFetchingNextPage(false);
      }
    };

    fetchGames();

    return () => controller.abort();
  }, [
    gameQuery.genre?.id, 
    gameQuery.platform?.id, 
    gameQuery.sortOrder, 
    gameQuery.searchText, 
    page,
    hasNextPage,
    gameQuery
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
