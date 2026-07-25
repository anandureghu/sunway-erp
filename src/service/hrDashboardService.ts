import { apiClient } from "@/service/apiClient";
import type { HrDashboard } from "@/types/hrDashboard";

/** Company HR operations snapshot for the dashboard. */
export async function getHrDashboard(): Promise<HrDashboard> {
  const res = await apiClient.get<HrDashboard>("/dashboard/hr");
  return res.data;
}
