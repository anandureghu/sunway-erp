import { apiClient } from "@/service/apiClient";
import type { Vendor } from "@/types/vendor";
import {
  isVendorEligibleForPurchase,
  normalizeVendorFromApi,
} from "@/lib/vendor-api";

function pageContent<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data) {
    const c = (data as { content?: T[] }).content;
    return Array.isArray(c) ? c : [];
  }
  return [];
}

export async function listVendors() {
  const res = await apiClient.get("/vendors", { params: { size: 500 } });
  return pageContent<unknown>(res.data).map(normalizeVendorFromApi);
}

export async function fetchVendors(): Promise<Vendor[]> {
  const res = await apiClient.get("/vendors", {
    params: { isActive: true, approved: true, rejected: false, size: 500 },
  });
  return pageContent<Vendor>(res.data).map(normalizeVendorFromApi);
}

/** Vendors eligible for purchase order assignment and release. */
export async function fetchPurchaseEligibleVendors(): Promise<Vendor[]> {
  const vendors = await fetchVendors();
  return vendors.filter(isVendorEligibleForPurchase);
}

export const VENDOR_CSV_CANONICAL_FIELDS = [
  "vendorCode",
  "vendorName",
  "categoryName",
  "vendorCrNo",
  "taxId",
  "contactPersonName",
  "phoneNo",
  "email",
  "street",
  "city",
  "country",
  "paymentTerms",
  "currencyCode",
  "bankName",
  "iban",
  "creditLimit",
  "status",
] as const;

export type VendorCsvPreview = {
  headers: string[];
  fieldMapping: Record<string, string | null>;
  aiMapped: boolean;
  dataRowCount: number;
  sampleRows: Record<string, string>[];
  warnings?: string[];
};

export type VendorCsvImportResult = {
  created: number;
  skipped: number;
  failed: number;
  fieldMapping?: Record<string, string | null>;
  aiMapped?: boolean;
  errors: { row: number; code?: string | null; message: string }[];
};

export async function previewVendorsCsv(file: File): Promise<VendorCsvPreview> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<VendorCsvPreview>(
    "/vendors/import-csv/preview",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function importVendorsCsv(
  file: File,
  mapping?: Record<string, string | null>,
): Promise<VendorCsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (mapping) {
    formData.append("mapping", JSON.stringify(mapping));
  }
  const res = await apiClient.post<VendorCsvImportResult>(
    "/vendors/import-csv",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}
