import { apiClient } from "./apiClient";
import type { EmploymentCategory, EmploymentType } from "@/types/hr";

/* =======================
   TYPES
======================= */

export interface CurrentJobPayload {
  jobCode?: string;
  jobTitle?: string;
  departmentCode?: string;
  departmentName?: string;
  divisionId?: number | null;
  divisionCode?: string;
  divisionName?: string;
  jobLevel?: string;
  salaryGrade?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  startDate?: string;
  effectiveFrom?: string;
  expectedEndDate?: string;
  workLocation?: string;
  workCity?: string;
  workCountry?: string;
  employmentCategory?: EmploymentCategory | "";
  employmentType?: EmploymentType | "";
  reportingManagerId?: number | null;
  reportingManagerName?: string;
  reportingManagerEmployeeNo?: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

export interface CurrentJobApiPayload {
  jobCodeId?: number;
  departmentId?: number;
  divisionId?: number | null;
  workLocation?: string;
  workCity?: string;
  workCountry?: string;
  startDate?: string;
  effectiveFrom?: string;
  expectedEndDate?: string;
  employmentCategory?: EmploymentCategory;
  employmentType?: EmploymentType;
  reportingManagerId?: number | null;
  contractStartDate?: string;
  contractEndDate?: string;
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

async function create(employeeId: number, payload: CurrentJobApiPayload) {
  const res = await apiClient.post<CurrentJobResponse>(`/employees/${employeeId}/current-job`, payload);
  return res.data;
}

async function update(employeeId: number, payload: CurrentJobApiPayload) {
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
  salaryGrade?: string;
  startDate?: string;
  effectiveFrom?: string;
  expectedEndDate?: string;
  workLocation?: string;
  workCity?: string;
  workCountry?: string;
};

export default currentJobService;
