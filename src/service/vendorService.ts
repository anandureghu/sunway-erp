import { apiClient } from "@/service/apiClient";
import type { Vendor } from "@/types/vendor";

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
  return pageContent<Vendor>(res.data);
}

export async function fetchVendors(): Promise<Vendor[]> {
  const res = await apiClient.get("/vendors", {
    params: { active: true, approved: true, rejected: false },
  });
  return pageContent<Vendor>(res.data);
}
