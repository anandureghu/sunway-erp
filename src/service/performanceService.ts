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

async function get(employeeId: number, month: string, year: number) {
  const res = await apiClient.get<PerformanceResponse>(
    `/employees/${employeeId}/performance`,
    {
      params: {
        month: month.toLowerCase(), // IMPORTANT
        year,
      },
    }
  );
  return res.data; // may be null
}

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

async function update(
  employeeId: number,
  month: string,
  year: number,
  payload: PerformancePayload
) {
  const res = await apiClient.put<PerformanceResponse>(
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
  get,
  create,
  update,
  extractErrorMessage,
};

export default performanceService;
