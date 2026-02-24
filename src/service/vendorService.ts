import { apiClient } from "@/service/apiClient";
import type { Vendor } from "@/types/vendor";

export async function listVendors() {
  const res = await apiClient.get("/vendors");
  console.log(res.data);
  return res.data.content;
}

export async function fetchVendors(): Promise<Vendor[]> {
  const res = await apiClient.get("/vendors", {
    params: { active: true, approved: true, rejected: false },
  });
  return res.data.content;
}
