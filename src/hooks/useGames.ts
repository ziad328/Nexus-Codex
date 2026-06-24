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

        const nsfwKeywords = /\b(hentai|nsfw|erotic|nudity|porn|pornograph|sexual|sex|nude|uncensored|lewd|smut|bdsm|fetish|18\+|18 plus|adults? only|ecchi|eroge|futanari|yaoi|yuri|bara|incest|tentacles?|netorare|netori|ntr)\b/i;
        
        const nsfwTags = [
          'nsfw', 'hentai', 'erotic', 'nudity', 'full-nudity', 'partial-nudity',
          'sexual-content', 'sexual-themes', 'explicit-sexual-content', 
          'adult', 'adult-only', 'adults-only', '18', 'ao18', 'porn', 
          'pornographic', 'pornography', 'nsfw-game', 'ecchi', 'eroge', 
          'explicit', 'smut', 'lewd', 'bdsm', 'fetish', 'futanari', 
          'yaoi', 'yuri', 'bara', 'incest', 'tentacle', 'netorare', 'ntr'
        ];
        
        const safeResults = res.data.results.filter(game => {
          if (nsfwKeywords.test(game.name) || nsfwKeywords.test(game.slug)) return false;
          if (game.tags && game.tags.some(tag => nsfwTags.includes(tag.slug.toLowerCase()))) return false;
          return true;
        });

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


  useEffect(() => {
    setPage(1);
    setHasNextPage(true);
    setData([]);
    setFetchingNextPage(false);
  }, [
    gameQuery.genreSlug, 
    gameQuery.platform?.id, 
    gameQuery.sortOrder, 
    gameQuery.searchText,
    gameQuery.developers,
    gameQuery.publishers,
    gameQuery.storeId,
    gameQuery.tagSlug
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
