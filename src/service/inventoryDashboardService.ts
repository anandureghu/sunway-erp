import { apiClient } from "@/service/apiClient";
import type { InventoryDashboard } from "@/types/inventoryDashboard";

/** Company inventory operations snapshot for the dashboard. */
export async function getInventoryDashboard(): Promise<InventoryDashboard> {
  const res = await apiClient.get<InventoryDashboard>("/dashboard/inventory");
  return res.data;
}
