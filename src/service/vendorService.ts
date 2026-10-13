import { apiClient } from "@/service/apiClient";
import type { Vendor } from "@/types/vendor";
import {
  isVendorEligibleForPurchase,
  normalizeVendorFromApi,
} from "@/lib/vendor-api";
import type { PageResult } from "@/types/page";
import { normalizePageResult } from "@/types/page";

function pageContent<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data) {
    const c = (data as { content?: T[] }).content;
    return Array.isArray(c) ? c : [];
  }
  return [];
}

/** Legacy full list (capped). Prefer {@link listVendorsPaged} for growing lists. */
export async function listVendors() {
  const res = await apiClient.get("/vendors", { params: { size: 500 } });
  return pageContent<unknown>(res.data).map(normalizeVendorFromApi);
}

/**
 * Server-paged vendors.
 * Name search uses `vendorName` (VendorFilterDTO); `search` is also accepted by the API as an alias.
 */
export async function listVendorsPaged(params: {
  page: number;
  size: number;
  search?: string;
  city?: string;
  approved?: boolean;
  rejected?: boolean;
  isActive?: boolean;
}): Promise<PageResult<Vendor>> {
  const res = await apiClient.get<PageResult<unknown>>("/vendors", {
    params: {
      page: params.page,
      size: params.size,
      // Prefer existing filter field; backend also accepts `search` as alias.
      vendorName: params.search?.trim() || undefined,
      city: params.city || undefined,
      approved: params.approved,
      rejected: params.rejected,
      isActive: params.isActive,
    },
  });
  const page = normalizePageResult(res.data);
  return {
    ...page,
    content: (page.content || []).map((row) =>
      normalizeVendorFromApi(row as Vendor),
    ),
  };
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
  updated: number;
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
