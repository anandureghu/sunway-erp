import { apiClient } from "./apiClient";

/* =======================
   TYPES
======================= */

export interface AppraisalPayload {
  // Performance
  kpi1?: string;
  review1?: string;
  kpi2?: string;
  review2?: string;
  kpi3?: string;
  review3?: string;
  kpi4?: string;
  review4?: string;
  kpi5?: string;
  review5?: string;

  // Appraisal Form
  jobCode?: string;
  employeeComments?: string;
  managerComments?: string;
}

export interface AppraisalResponse extends AppraisalPayload {
  id: number;
  employeeId: number;
  month: string;
  year: number;
}

/* =======================
   API CALLS
======================= */

async function get(employeeId: number, month: string, year: number) {
  const res = await apiClient.get<AppraisalResponse>(
    `/employees/${employeeId}/appraisal`,
    { params: { month, year } }
  );
  return res.data;
}

async function create(
  employeeId: number,
  month: string,
  year: number,
  payload: AppraisalPayload
) {
  const res = await apiClient.post<AppraisalResponse>(
    `/employees/${employeeId}/appraisal`,
    payload,
    { params: { month, year } }
  );
  return res.data;
}

async function update(
  employeeId: number,
  month: string,
  year: number,
  payload: AppraisalPayload
) {
  const res = await apiClient.put<AppraisalResponse>(
    `/employees/${employeeId}/appraisal`,
    payload,
    { params: { month, year } }
  );
  return res.data;
}

async function remove(employeeId: number, month: string, year: number) {
  await apiClient.delete(
    `/employees/${employeeId}/appraisal`,
    { params: { month, year } }
  );
}

/* =======================
   ERROR HANDLING
======================= */

function extractErrorMessage(err: any): string {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Something went wrong"
  );
}

export const appraisalService = {
  get,
  create,
  update,
  remove,
  extractErrorMessage,
};

export default appraisalService;
