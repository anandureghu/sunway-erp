import { apiClient } from "@/service/apiClient";
import type {
  CrmEnquiry,
  CrmEnquiryPage,
  CrmEnquiryPayload,
  CrmPipelineStatus,
  CrmProspectType,
  CrmRelationshipStage,
} from "@/types/crm-enquiry";

const BASE = "/inventory/crm/enquiries";

export async function listCrmEnquiries(params: {
  page?: number;
  size?: number;
  pipeline?: CrmPipelineStatus | "all";
  stage?: CrmRelationshipStage | "all";
  type?: CrmProspectType | "all";
  search?: string;
}): Promise<CrmEnquiryPage> {
  const query: Record<string, string | number> = {
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: "createdAt,desc",
  };
  if (params.pipeline && params.pipeline !== "all") query.pipeline = params.pipeline;
  if (params.stage && params.stage !== "all") query.stage = params.stage;
  if (params.type && params.type !== "all") query.type = params.type;
  if (params.search?.trim()) query.search = params.search.trim();
  const res = await apiClient.get<CrmEnquiryPage>(BASE, { params: query });
  return res.data;
}

export async function getCrmEnquiry(id: number): Promise<CrmEnquiry> {
  const res = await apiClient.get<CrmEnquiry>(`${BASE}/${id}`);
  return res.data;
}

export async function createCrmEnquiry(
  payload: CrmEnquiryPayload,
): Promise<CrmEnquiry> {
  const res = await apiClient.post<CrmEnquiry>(BASE, payload);
  return res.data;
}

export async function updateCrmEnquiry(
  id: number,
  payload: Partial<CrmEnquiryPayload>,
): Promise<CrmEnquiry> {
  const res = await apiClient.put<CrmEnquiry>(`${BASE}/${id}`, payload);
  return res.data;
}

export async function addCrmEnquiryNote(
  id: number,
  body: string,
): Promise<CrmEnquiry> {
  const res = await apiClient.post<CrmEnquiry>(`${BASE}/${id}/notes`, { body });
  return res.data;
}

export async function convertCrmEnquiry(
  id: number,
  target: "CUSTOMER" | "SUPPLIER",
): Promise<CrmEnquiry> {
  const res = await apiClient.post<CrmEnquiry>(`${BASE}/${id}/convert`, {
    target,
  });
  return res.data;
}

export async function deleteCrmEnquiry(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}
