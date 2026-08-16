import { apiClient } from "./apiClient";

/** One employee's exit interview. `responses` holds the full questionnaire as JSON. */
export interface ExitInterview {
  // read-only context (server-populated) — pre-fills Section 1
  employeeId?: number;
  employeeNo?: string | null;
  employeeName?: string | null;
  department?: string | null;
  designation?: string | null;
  dateOfJoining?: string | null;
  reportingManager?: string | null;
  nationality?: string | null;
  employeeStatus?: string | null;

  // editable
  separationType?: string | null;
  lastWorkingDay?: string | null;
  primaryReason?: string | null;
  status?: "DRAFT" | "SUBMITTED" | string | null;
  responses?: Record<string, unknown>;

  submittedAt?: string | null;
  updatedAt?: string | null;
  exists?: boolean;
}

/** One row in the company-wide exit / termination interview list. */
export interface ExitInterviewSummary {
  employeeId: number;
  employeeNo?: string | null;
  employeeName?: string | null;
  department?: string | null;
  designation?: string | null;
  employeeStatus?: string | null;
  separationType?: string | null;
  lastWorkingDay?: string | null;
  primaryReason?: string | null;
  status?: "DRAFT" | "SUBMITTED" | string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
}

export const exitInterviewService = {
  list(): Promise<ExitInterviewSummary[]> {
    return apiClient
      .get(`/hr/exit-interviews`)
      .then((r) => (Array.isArray(r.data) ? (r.data as ExitInterviewSummary[]) : []))
      .catch(() => []);
  },

  get(employeeId: number): Promise<ExitInterview> {
    return apiClient
      .get(`/employees/${employeeId}/exit-interview`)
      .then((r) => r.data as ExitInterview);
  },

  save(employeeId: number, payload: ExitInterview): Promise<ExitInterview> {
    return apiClient
      .put(`/employees/${employeeId}/exit-interview`, payload)
      .then((r) => r.data as ExitInterview);
  },
};
