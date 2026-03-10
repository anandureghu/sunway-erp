import { apiClient } from "./apiClient";

/* =========================================================
   TYPES
========================================================= */

export interface EmployeeGoalPayload {
  goalId: number;
  selfRating?: number;
  managerRating?: number;
  selfComment?: string;
  managerComment?: string;
}

export interface AppraisalRequestPayload {
  goals?: EmployeeGoalPayload[];
  employeeComments?: string;
  managerComments?: string;
}

// Alias for backward compatibility
export type AppraisalPayload = AppraisalRequestPayload;

export interface EmployeeGoalResponse {
  goalId: number;
  kpi: string;
  description: string;
  weight: number;
  selfRating?: number | null;
  managerRating?: number | null;
  selfComment?: string | null;
  managerComment?: string | null;
}

export interface AppraisalResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeRole: string;
  year: number;
  month: string; // "JANUARY", "FEBRUARY" ... "DECEMBER"
  status: "DRAFT" | "SELF_SUBMITTED" | "MANAGER_REVIEWED" | "LOCKED";
  overallScore?: number | null;
  employeeComments?: string;
  managerComments?: string;
  createdDate?: string;
  updatedDate?: string;
  goals: EmployeeGoalResponse[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/* =========================================================
   SERVICE
========================================================= */

export const appraisalService = {

  /* -------------------------------
     LIST BY EMPLOYEE (PAGINATED)
  -------------------------------- */
  async listByEmployee(
    employeeId: number,
    page = 0,
    size = 100
  ): Promise<PageResponse<AppraisalResponse>> {
    const res = await apiClient.get<PageResponse<AppraisalResponse>>(
      `/employees/${employeeId}/appraisals`,
      { params: { page, size } }
    );
    return res.data;
  },

  /* -------------------------------
     LIST BY YEAR (GLOBAL / MANAGER)
  -------------------------------- */
  async listByYear(
    year: number,
    page = 0,
    size = 100
  ): Promise<PageResponse<AppraisalResponse>> {
    const res = await apiClient.get<PageResponse<AppraisalResponse>>(
      `/appraisals`,
      { params: { year, page, size } }
    );
    return res.data;
  },

  /* -------------------------------
     CREATE — year + month as params
     POST /api/employees/{id}/appraisals?year=2026&month=MARCH
  -------------------------------- */
  async create(
    employeeId: number,
    year: number,
    month: string  // "JANUARY" ... "DECEMBER"
  ): Promise<AppraisalResponse> {
    const res = await apiClient.post<AppraisalResponse>(
      `/employees/${employeeId}/appraisals`,
      null,                          // no body
      { params: { year, month } }    // both as query params
    );
    return res.data;
  },

  /* -------------------------------
     CREATE LEGACY — create with full payload in one call
     POST /api/employees/{id}/appraisals/legacy
  -------------------------------- */
  async createLegacy(
    employeeId: number,
    payload: AppraisalRequestPayload
  ): Promise<AppraisalResponse> {
    const res = await apiClient.post<AppraisalResponse>(
      `/employees/${employeeId}/appraisals/legacy`,
      payload
    );
    return res.data;
  },

  /* -------------------------------
     UPDATE BY ID — update an existing appraisal
     PUT /api/employees/{id}/appraisals/{appraisalId}
  -------------------------------- */
  async updateById(
    employeeId: number,
    appraisalId: number,
    payload: AppraisalRequestPayload
  ): Promise<AppraisalResponse> {
    const res = await apiClient.put<AppraisalResponse>(
      `/employees/${employeeId}/appraisals/${appraisalId}`,
      payload
    );
    return res.data;
  },

  /* -------------------------------
     SELF SUBMIT  (DRAFT → SELF_SUBMITTED)
  -------------------------------- */
  async submitSelfAssessment(
    employeeId: number,
    appraisalId: number,
    payload: AppraisalRequestPayload
  ): Promise<AppraisalResponse> {
    const res = await apiClient.put<AppraisalResponse>(
      `/employees/${employeeId}/appraisals/${appraisalId}/self-submit`,
      payload
    );
    return res.data;
  },

  /* -------------------------------
     MANAGER REVIEW  (SELF_SUBMITTED → MANAGER_REVIEWED)
  -------------------------------- */
  async submitManagerReview(
    employeeId: number,
    appraisalId: number,
    payload: AppraisalRequestPayload
  ): Promise<AppraisalResponse> {
    const res = await apiClient.put<AppraisalResponse>(
      `/employees/${employeeId}/appraisals/${appraisalId}/manager-review`,
      payload
    );
    return res.data;
  },

  /* -------------------------------
     LOCK  (MANAGER_REVIEWED → LOCKED)
  -------------------------------- */
  async lock(
    employeeId: number,
    appraisalId: number
  ): Promise<AppraisalResponse> {
    const res = await apiClient.put<AppraisalResponse>(
      `/employees/${employeeId}/appraisals/${appraisalId}/lock`
    );
    return res.data;
  },

  /* -------------------------------
     UNLOCK  (LOCKED → MANAGER_REVIEWED)
  -------------------------------- */
  async unlock(
    employeeId: number,
    appraisalId: number
  ): Promise<AppraisalResponse> {
    const res = await apiClient.put<AppraisalResponse>(
      `/employees/${employeeId}/appraisals/${appraisalId}/unlock`
    );
    return res.data;
  },

  /* -------------------------------
     DELETE  (blocked if LOCKED)
  -------------------------------- */
  async removeById(
    employeeId: number,
    appraisalId: number
  ): Promise<void> {
    await apiClient.delete(
      `/employees/${employeeId}/appraisals/${appraisalId}`
    );
  },

  /* -------------------------------
     FORCE DELETE — any status
  -------------------------------- */
  async forceDelete(
    employeeId: number,
    appraisalId: number
  ): Promise<void> {
    await apiClient.delete(
      `/employees/${employeeId}/appraisals/${appraisalId}/force`
    );
  },

  /* -------------------------------
     ERROR HELPER
  -------------------------------- */
  extractErrorMessage(err: any): string {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Something went wrong"
    );
  },
};

