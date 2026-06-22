import { useEffect, useState } from "react";
import apiClient, { CanceledError } from "../services/api-client";
import type { FetchResponse } from "../types";
import type { AxiosRequestConfig } from "axios";

const useData = <T>(
  endpoint: string,
  requestConfig?: AxiosRequestConfig,
  deps?: unknown[]
) => {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<FetchResponse<T>>(endpoint, {
          signal: controller.signal,
          ...requestConfig,
        });
        setData(res.data.results);
        setLoading(false);
      } catch (err) {
        if (err instanceof CanceledError) return;
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ? [...deps] : []);

  return { data, error, isLoading };
};

export default useData;
