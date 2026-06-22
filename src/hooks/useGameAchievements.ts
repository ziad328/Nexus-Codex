import useData from "./useData";
import type { Achievement } from "../types";

const useGameAchievements = (gameId: number | null) => {
  return useData<Achievement>(
    gameId ? `/games/${gameId}/achievements` : '',
    { params: { page_size: 5 } },
    [gameId]
  );
};

export default useGameAchievements;
