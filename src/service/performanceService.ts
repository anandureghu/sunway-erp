import { apiClient } from "./apiClient";

/* =======================
   TYPES
======================= */

export interface PerformancePayload {
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
}

export interface PerformanceResponse extends PerformancePayload {
  employeeId: number;
  month: string;
  year: number;
}

/* =======================
   API CALLS
======================= */
async function create(
  employeeId: number,
  month: string,
  year: number,
  payload: PerformancePayload
) {
  const res = await apiClient.post<PerformanceResponse>(
    `/employees/${employeeId}/performance`,
    payload,
    {
      params: {
        month: month.toLowerCase(),
        year,
      },
    }
  );
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

export const performanceService = {
  create,
  extractErrorMessage,
};

export default performanceService;
