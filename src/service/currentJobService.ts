import { apiClient } from "./apiClient";

/* =======================
   TYPES
======================= */

export interface CurrentJobPayload {
  jobCode?: string;
  jobTitle?: string;
  departmentCode?: string;
  departmentName?: string;
  jobLevel?: string;
  grade?: string;
  startDate?: string;
  effectiveFrom?: string;
  expectedEndDate?: string;
}

export interface CurrentJobResponse extends CurrentJobPayload {
  id: number;
  employeeId: number;
}

/* =======================
   API CALLS
======================= */

async function get(employeeId: number) {
  const res = await apiClient.get<CurrentJobResponse>(`/employees/${employeeId}/current-job`);
  return res.data ?? null;
}

async function create(employeeId: number, payload: CurrentJobPayload) {
  const res = await apiClient.post<CurrentJobResponse>(`/employees/${employeeId}/current-job`, payload);
  return res.data;
}

async function update(employeeId: number, payload: CurrentJobPayload) {
  const res = await apiClient.put<CurrentJobResponse>(`/employees/${employeeId}/current-job`, payload);
  return res.data;
}

function extractErrorMessage(err: any): string {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Something went wrong"
  );
}

export const currentJobService = {
  get,
  create,
  update,
  extractErrorMessage,
};

export type CurrentJobModel = {
  id?: number;
  jobCode?: string;
  jobTitle?: string;
  departmentCode?: string;
  departmentName?: string;
  jobLevel?: string;
  grade?: string;
  startDate?: string;
  effectiveFrom?: string;
  expectedEndDate?: string;
};

export default currentJobService;
