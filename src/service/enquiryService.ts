import { apiClient } from "@/service/apiClient";
import type { Enquiry, EnquiryPage, EnquiryUpdatePayload } from "@/types/enquiry";
import type { EnquiryStatus } from "@/types/enquiry";

export async function listEnquiries(params: {
  page?: number;
  size?: number;
  status?: EnquiryStatus | "all";
  search?: string;
}): Promise<EnquiryPage> {
  const query: Record<string, string | number> = {
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: "createdAt,desc",
  };
  if (params.status && params.status !== "all") {
    query.status = params.status;
  }
  if (params.search?.trim()) {
    query.search = params.search.trim();
  }
  const res = await apiClient.get<EnquiryPage>("/admin/enquiries", { params: query });
  return res.data;
}

export async function getEnquiry(id: number): Promise<Enquiry> {
  const res = await apiClient.get<Enquiry>(`/admin/enquiries/${id}`);
  return res.data;
}

export async function updateEnquiry(id: number, payload: EnquiryUpdatePayload): Promise<Enquiry> {
  const res = await apiClient.patch<Enquiry>(`/admin/enquiries/${id}`, payload);
  return res.data;
}
