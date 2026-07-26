import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";

export function useDashboardQuery<T>(
  fetcher: () => Promise<T>,
  errorFallback: string,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetcherRef.current();
      setData(res);
    } catch (err) {
      const msg = getApiErrorMessage(err, errorFallback);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [errorFallback]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
