import { apiClient } from "@/service/apiClient";
import type { WarehouseResponseDTO } from "./erpApiTypes";

export const getWarehouseById = async (id: string) => {
  const res = await apiClient.get<WarehouseResponseDTO>(
    `/inventory/warehouses/${id}`
  );
  return res.data;
};
