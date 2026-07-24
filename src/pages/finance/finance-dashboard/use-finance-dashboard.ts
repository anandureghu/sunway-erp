import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { getFinanceDashboard } from "@/service/financeDashboardService";
import type { FinanceDashboard } from "@/types/financeDashboard";

export function useFinanceDashboard() {
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getFinanceDashboard();
      setData(res);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Could not load finance dashboard");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
