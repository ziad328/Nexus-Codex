import { useEffect, useState } from "react";
import apiClient, { CanceledError } from "../services/api-client";
import type { FetchResponse, Game, GameQuery } from "../types";

const ADULT_WORDS = /\b(hentai|nsfw|porn|pornographic|erotic|eroge|ecchi|lewd|smut|uncensored|adults? only|futanari|netorare)\b/i;

const useGames = (gameQuery: GameQuery) => {
  const [data, setData] = useState<Game[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isFetchingNextPage, setFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(1);

  const queryKey = JSON.stringify([
    gameQuery.genreSlug,
    gameQuery.platform?.id,
    gameQuery.sortOrder,
    gameQuery.searchText,
    gameQuery.developers,
    gameQuery.publishers,
    gameQuery.storeId,
    gameQuery.tagSlug,
  ]);
  const [lastQueryKey, setLastQueryKey] = useState(queryKey);
  if (queryKey !== lastQueryKey) {
    setLastQueryKey(queryKey);
    setPage(1);
    setHasNextPage(true);
    setData([]);
    setFetchingNextPage(false);
    setLoading(true);
  }

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
            genres: gameQuery.genreSlug,
            parent_platforms: gameQuery.platform?.id,
            ordering: gameQuery.sortOrder,
            search: gameQuery.searchText || undefined,
            developers: gameQuery.developers,
            publishers: gameQuery.publishers,
            stores: gameQuery.storeId,
            tags: gameQuery.tagSlug,
            page: page,
          },
          signal: controller.signal,
        });

        // The proxy already drops games IGDB marks erotic. This only catches untagged ones by name,
        // using words with no innocent meaning ("yuri" or "tentacle" hid Yuri's Revenge and Day of the Tentacle).
        const safeResults = res.data.results.filter((game) => !ADULT_WORDS.test(game.name) && !ADULT_WORDS.test(game.slug));

        setData(prev => isFirstPage ? safeResults : [...prev, ...safeResults]);
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
    gameQuery.genreSlug, 
    gameQuery.platform?.id, 
    gameQuery.sortOrder, 
    gameQuery.searchText, 
    gameQuery.developers,
    gameQuery.publishers,
    gameQuery.storeId,
    gameQuery.tagSlug,
    page
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
