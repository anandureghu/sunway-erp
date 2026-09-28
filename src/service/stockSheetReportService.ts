/**
 * STOCK_SHEET_REPORTS — client for Stock Summary / Item Summary sheets.
 * Delete with those report pages, sidebar entries, and backend StockSheetReportService.
 */
import { apiClient } from "./apiClient";

export interface StockSummaryRow {
  itemId: number;
  sku: string;
  name: string;
  category: string;
  brand?: string | null;
  unitMeasure: string;
  tracking: string;
  onHand: number;
  reorderLevel?: number | null;
  avgCost: number;
  stockValue: number;
  lastIssueDays?: number | null;
  abc: string;
  expiringBatch: boolean;
  status?: string | null;
}

export interface StockSummaryReport {
  companyName?: string | null;
  generatedAt: string;
  rows: StockSummaryRow[];
  byCategory: { category: string; skuCount: number; valueAtCost: number }[];
  byWarehouse: {
    warehouseId: number;
    warehouseName: string;
    warehouseType?: string | null;
    skuCount: number;
    valueAtCost: number;
    share: number;
  }[];
  belowReorderCount: number;
  outOfStockCount: number;
  nonMovingCount: number;
  expiringBatchCount: number;
  totalStockValue: number;
  nonMovingValue: number;
}

export interface ItemSummaryReport {
  itemId: number;
  sku: string;
  name: string;
  description?: string | null;
  category: string;
  subCategory?: string | null;
  brand?: string | null;
  manufacturerPartNumber?: string | null;
  model?: string | null;
  barcode?: string | null;
  serialNo?: string | null;
  type?: string | null;
  status?: string | null;
  unitMeasure: string;
  reorderLevel?: number | null;
  reorderQty?: number | null;
  leadTimeDays?: number | null;
  minimum?: number | null;
  maximum?: number | null;
  hsnCode?: string | null;
  vatApplicable?: boolean | null;
  criticality?: string | null;
  preferredVendorName?: string | null;
  supplierPartNo?: string | null;
  remarks?: string | null;
  companyName?: string | null;
  generatedAt: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  onHand: number;
  reserved: number;
  available: number;
  avgCost: number;
  lastPurchaseCost: number;
  listPrice?: number | null;
  sellingPrice?: number | null;
  stockValue: number;
  abc: string;
  tracking: string;
  lastIssueDays?: number | null;
  expiringBatch: boolean;
  warehouses: {
    warehouseId?: number | null;
    warehouseName: string;
    warehouseType?: string | null;
    onHand: number;
    reserved: number;
    available: number;
    reorderLevel?: number | null;
    maximum?: number | null;
    belowReorder: boolean;
  }[];
  batches: {
    batchNo: string;
    receivedAt?: string | null;
    expiryDate?: string | null;
    quantityOnHand: number;
    unitCost: number;
    warehouseName: string;
    expiryTone: string;
  }[];
  recentMovements: {
    at: string;
    movementType?: string | null;
    quantity: number;
    batchNo?: string | null;
    warehouseName?: string | null;
    referenceType?: string | null;
    referenceId?: number | null;
  }[];
  movementTotals: { label: string; quantity: number; note?: string | null }[];
}

export const stockSheetReportService = {
  async stockSummary(): Promise<StockSummaryReport> {
    const res = await apiClient.get<StockSummaryReport>("/inventory/reports/stock-summary");
    return {
      ...res.data,
      rows: res.data?.rows ?? [],
      byCategory: res.data?.byCategory ?? [],
      byWarehouse: res.data?.byWarehouse ?? [],
    };
  },

  async itemSummary(itemId: number): Promise<ItemSummaryReport> {
    const res = await apiClient.get<ItemSummaryReport>(
      `/inventory/reports/items/${itemId}/summary`,
    );
    return {
      ...res.data,
      warehouses: res.data?.warehouses ?? [],
      batches: res.data?.batches ?? [],
      recentMovements: res.data?.recentMovements ?? [],
      movementTotals: res.data?.movementTotals ?? [],
    };
  },
};

export const money = (n?: number | null) =>
  n == null
    ? "—"
    : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const qty = (n?: number | null) =>
  n == null ? "—" : Number(n).toLocaleString("en-US");

export const fmtReportDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const [y, m, day] = iso.slice(0, 10).split("-").map(Number);
    if (!y || !m || !day) return iso;
    return new Date(y, m - 1, day).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const CAT_COLORS = [
  "#1E6E8C",
  "#1F3A6E",
  "#0E7490",
  "#5B3B8C",
  "#A9631A",
  "#475569",
  "#1E6B4F",
  "#8A1C36",
];
