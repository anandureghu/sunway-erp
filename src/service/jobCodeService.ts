import { apiClient } from "./apiClient";

export type JobCodeStatus = "VACANT" | "OCCUPIED" | "ON_HOLD";
export type JobCodeHoldReason = "PENDING_APPROVAL" | "RESERVED";

export interface JobCode {
  id: number;
  code: string;
  title: string;
  level: string;
  salaryGrade: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  active: boolean;
  /**
   * Position state: VACANT (new codes) · OCCUPIED (automatic while someone holds it)
   * · ON_HOLD (set by HR, with `holdComment`).
   */
  status?: JobCodeStatus;
  /** Why the position is on hold (only while ON_HOLD). */
  holdComment?: string | null;
  holdSince?: string | null;
  /** Why it is on hold: PENDING_APPROVAL (closed by Approve / Reject) or RESERVED (closed by Release). */
  holdReason?: JobCodeHoldReason | null;
  /** How the last hold was closed: APPROVED | REJECTED | RELEASED. */
  holdDecision?: "APPROVED" | "REJECTED" | "RELEASED" | null;
  holdDecisionNote?: string | null;
  holdDecidedBy?: string | null;
  holdDecidedAt?: string | null;
  /** Who holds the position (only while OCCUPIED). */
  occupiedBy?: string | null;
  // Defaults copied onto the current job when this code is assigned.
  departmentId?: number | null;
  departmentName?: string | null;
  divisionId?: number | null;
  divisionName?: string | null;
  employmentCategory?: string | null;
  employmentType?: string | null;
  workLocation?: string | null;
  workCity?: string | null;
  workCountry?: string | null;
  /** From /assignable: false when held by another active employee (see `assignedTo`). */
  assignable?: boolean;
  assignedTo?: string | null;
}

export interface JobCodePayload {
  code: string;
  title: string;
  level: string;
  salaryGrade: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  active: boolean;
  /** VACANT or ON_HOLD — OCCUPIED is set automatically. */
  status?: JobCodeStatus | null;
  holdComment?: string | null;
  holdReason?: JobCodeHoldReason | null;
  departmentId?: number | null;
  divisionId?: number | null;
  employmentCategory?: string | null;
  employmentType?: string | null;
  workLocation?: string | null;
  workCity?: string | null;
  workCountry?: string | null;
}

async function getAll(): Promise<JobCode[]> {
  const res = await apiClient.get<JobCode[]>("/hr/job-codes");
  return res.data;
}

async function getActive(): Promise<JobCode[]> {
  const res = await apiClient.get<JobCode[]>("/hr/job-codes/active");
  return res.data;
}

/**
 * Active job codes still assignable to this employee — the active list minus codes
 * already held by another still-employed person (a code frees up when its holder
 * exits). The employee's own current code stays in the list so editing works.
 */
async function getAssignable(employeeId?: number): Promise<JobCode[]> {
  const res = await apiClient.get<JobCode[]>("/hr/job-codes/assignable", {
    params: employeeId != null ? { employeeId } : undefined,
  });
  return res.data;
}

async function getById(id: number): Promise<JobCode> {
  const res = await apiClient.get<JobCode>(`/hr/job-codes/${id}`);
  return res.data;
}

async function create(payload: JobCodePayload): Promise<JobCode> {
  const res = await apiClient.post<JobCode>("/hr/job-codes", payload);
  return res.data;
}

async function update(id: number, payload: JobCodePayload): Promise<JobCode> {
  const res = await apiClient.put<JobCode>(`/hr/job-codes/${id}`, payload);
  return res.data;
}

/** Close a hold: approve / reject (pending approval) or release (reserved). */
async function decideHold(
  id: number,
  action: "approve" | "reject" | "release",
  note?: string | null,
): Promise<JobCode> {
  const res = await apiClient.put<JobCode>(`/hr/job-codes/${id}/hold/${action}`, {
    note: note?.trim() || null,
  });
  return res.data;
}

/** Position Approvals queue: pending-approval holds and the latest decisions. */
async function getHoldQueue(): Promise<{ pending: JobCode[]; recent: JobCode[] }> {
  const res = await apiClient.get<{ pending: JobCode[]; recent: JobCode[] }>(
    "/hr/job-codes/holds",
  );
  return { pending: res.data?.pending ?? [], recent: res.data?.recent ?? [] };
}

async function remove(id: number): Promise<void> {
  await apiClient.delete(`/hr/job-codes/${id}`);
}

export const jobCodeService = {
  getAll,
  getActive,
  getAssignable,
  getById,
  create,
  update,
  decideHold,
  getHoldQueue,
  delete: remove,
};

export const JOB_CODE_CSV_CANONICAL_FIELDS = [
  "code",
  "title",
  "level",
  "salaryGrade",
  "minSalary",
  "maxSalary",
  "active",
  "departmentName",
  "divisionName",
  "employmentCategory",
  "employmentType",
  "workLocation",
  "workCity",
  "workCountry",
] as const;

export type JobCodeCsvPreview = {
  headers: string[];
  fieldMapping: Record<string, string | null>;
  aiMapped: boolean;
  dataRowCount: number;
  sampleRows: Record<string, string>[];
  warnings?: string[];
};

export type JobCodeCsvImportResult = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { row: number; code?: string | null; message: string }[];
};

export async function previewJobCodesCsv(file: File): Promise<JobCodeCsvPreview> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<JobCodeCsvPreview>(
    "/hr/job-codes/import-csv/preview",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function importJobCodesCsv(
  file: File,
  mapping?: Record<string, string | null>,
): Promise<JobCodeCsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (mapping) formData.append("mapping", JSON.stringify(mapping));
  const res = await apiClient.post<JobCodeCsvImportResult>(
    "/hr/job-codes/import-csv",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}
