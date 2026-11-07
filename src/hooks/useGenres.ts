import { useEffect, useState } from "react";
import type { Genre, FetchResponse } from "../types";
import apiClient from "../services/api-client";

// v2: IGDB's genres. The old key held RAWG's list, which must not show again.
const CACHE_KEY = 'nexus-genres-v2';

const readCache = (): Genre[] => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

// One request per page load, shared by every user of the hook (both sidebars and the home page).
// A failed request is forgotten, so the next user tries again.
let request: Promise<Genre[]> | null = null;

const loadGenres = () =>
  request ??= apiClient.get<FetchResponse<Genre>>("/genres").then(
    (res) => {
      const fresh = JSON.stringify(res.data.results);
      if (fresh !== localStorage.getItem(CACHE_KEY)) localStorage.setItem(CACHE_KEY, fresh);
      return res.data.results;
    },
    (err) => {
      request = null;
      throw err;
    },
  );

/** Test helper: start the next test with no shared request. */
export const forgetGenresRequest = () => {
  request = null;
};

const useGenres = () => {
  const [data, setData] = useState<Genre[]>(readCache);
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(!data.length);

  useEffect(() => {
    loadGenres().then(
      (genres) => {
        setData(genres);
        setLoading(false);
      },
      (err: Error) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, []);

  return { data, error, isLoading };
};

export default useGenres;
