import { apiClient } from "@/service/apiClient";
import type { FinanceDashboard } from "@/types/financeDashboard";

/** Company finance manager snapshot for the dashboard. */
export async function getFinanceDashboard(): Promise<FinanceDashboard> {
  const res = await apiClient.get<FinanceDashboard>("/dashboard/finance");
  return res.data;
}
