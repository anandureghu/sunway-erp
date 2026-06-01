import { apiClient } from "@/service/apiClient";

export type StockVariance = {
  id: number;
  status: "pending" | "approved" | "rejected";
  varianceType: string;
  adjustmentMode: string;
  itemId: number;
  itemName?: string;
  itemSku?: string;
  fromWarehouseId: number;
  fromWarehouseName?: string;
  toWarehouseId?: number | null;
  toWarehouseName?: string | null;
  quantityBefore: number;
  quantityAfter?: number | null;
  adjustmentQuantity?: number | null;
  transferQuantity?: number | null;
  reason: string;
  notes?: string | null;
  varianceDate: string;
  financeTransactionId?: number | null;
  createdById?: number;
  createdByName?: string;
  createdAt?: string;
  approvedById?: number | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectedById?: number | null;
  rejectedByName?: string | null;
  rejectedAt?: string | null;
};

export type StockVarianceCreatePayload = {
  itemId: number;
  warehouseId: number;
  toWarehouseId?: number;
  varianceType: string;
  adjustmentMode: string;
  adjustmentQuantity?: number;
  newQuantity?: number;
  transferQuantity?: number;
  reason: string;
  notes?: string;
  varianceDate: string;
};

export async function createStockVariance(
  payload: StockVarianceCreatePayload,
): Promise<StockVariance> {
  const res = await apiClient.post<StockVariance>(
    "/inventory/variances",
    payload,
  );
  return res.data;
}

export async function listPendingStockVariances(): Promise<StockVariance[]> {
  const res = await apiClient.get<StockVariance[]>(
    "/inventory/variances/pending",
  );
  return res.data || [];
}

export async function listStockVarianceHistory(): Promise<StockVariance[]> {
  const res = await apiClient.get<StockVariance[]>("/inventory/variances/history");
  return res.data || [];
}

export async function canApproveStockVariances(): Promise<boolean> {
  const res = await apiClient.get<{ canApprove: boolean }>(
    "/inventory/variances/can-approve",
  );
  return Boolean(res.data?.canApprove);
}

export async function approveStockVariance(id: number): Promise<StockVariance> {
  const res = await apiClient.post<StockVariance>(
    `/inventory/variances/${id}/approve`,
  );
  return res.data;
}

export async function rejectStockVariance(id: number): Promise<StockVariance> {
  const res = await apiClient.post<StockVariance>(
    `/inventory/variances/${id}/reject`,
  );
  return res.data;
}
