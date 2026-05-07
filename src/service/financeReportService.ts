import { apiClient } from "@/service/apiClient";
import type { FinanceReportSummary } from "@/types/financeReport";

/**
 * Fetch the aggregated finance snapshot for the current company.
 * Both `from` and `to` are optional ISO date strings (YYYY-MM-DD).
 * Backend defaults the window to the last 12 months when omitted.
 */
export async function getFinanceSummary(
  from?: string,
  to?: string,
): Promise<FinanceReportSummary> {
  const res = await apiClient.get<FinanceReportSummary>(
    "/finance/reports/summary",
    {
      params: {
        from: from || undefined,
        to: to || undefined,
      },
    },
  );
  return res.data;
}
