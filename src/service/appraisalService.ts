import { apiClient } from "./apiClient";

/* =======================
   TYPES
======================= */

export interface AppraisalPayload {
  month: string;
  year: number;

  // KPIs
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

  // Comments
  employeeComments?: string;
  managerComments?: string;

  // Rating
  rating?: number;
  annualIncrement?: number;
}

export interface AppraisalResponse extends AppraisalPayload {
  id: number;
  employeeId: number;
  createdDate: string;
  updatedDate: string;
}

/* =======================
   API CALLS (CLEAN)
======================= */

/* -------- LIST (Loans-style) -------- */
async function list(employeeId: number) {
  const res = await apiClient.get<AppraisalResponse[]>(
    `/employees/${employeeId}/appraisals`
  );
  return res.data;
}

/* -------- CREATE -------- */
async function create(
  employeeId: number,
  payload: AppraisalPayload
) {
  const res = await apiClient.post<AppraisalResponse>(
    `/employees/${employeeId}/appraisals`,
    payload
  );
  return res.data;
}

/* -------- UPDATE BY ID -------- */
async function updateById(
  employeeId: number,
  appraisalId: number,
  payload: AppraisalPayload
) {
  const res = await apiClient.put<AppraisalResponse>(
    `/employees/${employeeId}/appraisals/${appraisalId}`,
    payload
  );
  return res.data;
}

/* -------- DELETE BY ID -------- */
async function removeById(
  employeeId: number,
  appraisalId: number
) {
  await apiClient.delete(
    `/employees/${employeeId}/appraisals/${appraisalId}`
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

/* =======================
   EXPORT
======================= */

export const appraisalService = {
  list,
  create,
  updateById,
  removeById,
  extractErrorMessage,
};

export default appraisalService;
