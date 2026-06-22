import { useMemo } from "react";
import type { Game, GameQuery } from "../types";
import useData from "./useData";

const useGames = (gameQuery: GameQuery | null) => {
  const requestConfig = useMemo(
    () => ({
      params: {
        genres: gameQuery?.genre?.id,
        parent_platforms: gameQuery?.platform?.id,
        ordering: gameQuery?.sortOrder,
        search: gameQuery?.searchText,
      },
    }),
    [gameQuery]
  );

  return useData<Game>("/games", requestConfig, [gameQuery]);
};

export default useGames;
