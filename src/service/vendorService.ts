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
  const res = await apiClient.get("/vendors");
  return pageContent<unknown>(res.data).map(normalizeVendorFromApi);
}

export async function fetchVendors(): Promise<Vendor[]> {
  const res = await apiClient.get("/vendors", {
    params: { isActive: true, approved: true, rejected: false },
  });
  return pageContent<Vendor>(res.data).map(normalizeVendorFromApi);
}

/** Vendors eligible for purchase order assignment and release. */
export async function fetchPurchaseEligibleVendors(): Promise<Vendor[]> {
  const vendors = await fetchVendors();
  return vendors.filter(isVendorEligibleForPurchase);
}
