import { apiClient } from "@/service/apiClient";
import type { WarehouseResponseDTO } from "./erpApiTypes";
import { toast } from "sonner";

export const getWarehouseById = async (id: string) => {
  const res = await apiClient.get<WarehouseResponseDTO>(
    `/inventory/warehouses/${id}`,
  );
  return res.data;
};

export const fetchWarehouses = async () => {
  try {
    const res = await apiClient.get(`/inventory/warehouses`);
    return res.data;
  } catch (error) {
    console.error("Error loading warehouses:", error);
    toast.error("Failed to load warehouses. Please try again later.");
  }
};
