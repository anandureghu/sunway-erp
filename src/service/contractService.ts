import { apiClient } from "./apiClient";
import type { EmployeeContract, ContractType, ContractStatus } from "@/types/hr";

/* =======================
   TYPES
======================= */

export interface AllowancePayload {
  allowanceTypeId?: number;
  customName?: string;
  amount: number;
  effectiveDate: string;
  note?: string;
}

export interface ContractPayload {
  contractType: ContractType;
  status: ContractStatus;
  effectiveDate: string;
  expirationDate?: string;
  noticePeriodDays?: number;
  salaryRateType?: string;
  signatureDate?: string;
  signedBy?: string;
  allowances: AllowancePayload[];
}

export interface ContractApiPayload {
  contractType: ContractType;
  status: ContractStatus;
  effectiveDate: string;
  expirationDate?: string;
  contractPeriodMonths?: number;
  noticePeriodDays?: number;
  salaryRateType?: string;
  signatureDate?: string;
  signedBy?: string;
  termsAndConditions?: string;
  attachmentUrl?: string;
  allowances: AllowancePayload[];
  // Used for multipart upload. Do NOT send `attachmentUrl` for file upload.
  attachment?: File | null;
}

export interface ContractResponse {
  id: number;
  employeeId: number;
  contractCode?: string;
  contractType: ContractType;
  status: ContractStatus;
  effectiveDate: string;
  expirationDate?: string;
  contractPeriodMonths?: number;
  noticePeriodDays?: number;
  salaryRateType?: string;
  signatureDate?: string;
  signedBy?: string;
  allowances: Array<{
    allowanceTypeId?: number;
    allowanceType?: string;
    customName?: string;
    amount: number;
    effectiveDate: string;
    note?: string;
  }>;
  termsAndConditions?: string;
  attachmentUrl?: string;
  staffName?: string;
  employeeName?: string;
  staff?: {
    name?: string;
  };
}

export interface AllowanceType {
  id: number;
  name: string;
  code: string;
}

/* =======================
   HELPERS
======================= */

function cleanObject<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined
    )
  ) as T;
}

function normalizeAllowance(allowance: AllowancePayload) {
  return cleanObject({
    allowanceTypeId: allowance.allowanceTypeId,
    customName: allowance.customName,
    amount: allowance.amount,
    effectiveDate: allowance.effectiveDate,
    note: allowance.note,
  });
}

function normalizePayload(payload: ContractApiPayload) {
  // Always produce a complete object — backend validates required fields.
  return {
    contractType: payload.contractType,
    status: payload.status,
    effectiveDate: payload.effectiveDate,
    expirationDate: payload.expirationDate,
    contractPeriodMonths: payload.contractPeriodMonths,
    noticePeriodDays: payload.noticePeriodDays,
    salaryRateType: payload.salaryRateType,
    signatureDate: payload.signatureDate,
    signedBy: payload.signedBy,
    termsAndConditions: payload.termsAndConditions,
    // Intentionally NOT sending attachmentUrl: the file is managed via the
    // separate uploadAttachment endpoint. Sending the resolved (and expiring)
    // download URL back here would overwrite the stored blob path and break
    // future downloads.
    allowances: (payload.allowances ?? []).map(normalizeAllowance),
  };
}

/* =======================
   API CALLS
======================= */

async function get(employeeId: number) {
  try {
    const res = await apiClient.get<ContractResponse>(
      `/hr/contracts/employee/${employeeId}`
    );
    return res.data ?? null;
  } catch (err: any) {
    if (err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

// JSON-only — attachment is uploaded separately via uploadAttachment
async function create(employeeId: number, payload: ContractApiPayload) {
  const normalized = normalizePayload(payload);

  const res = await apiClient.post<ContractResponse>(
    `/hr/contracts/employee/${employeeId}`,
    normalized
  );

  return res.data;
}

// JSON-only — attachment is uploaded separately via uploadAttachment
async function update(contractId: number, payload: ContractApiPayload) {
  const normalized = normalizePayload(payload);

  const res = await apiClient.put<ContractResponse>(
    `/hr/contracts/${contractId}`,
    normalized
  );

  return res.data;
}

// Upload attachment for an existing contract (multipart)
async function uploadAttachment(contractId: number, file: File) {
  const formData = new FormData();
  formData.append("attachment", file, file.name);

  const res = await apiClient.put<ContractResponse>(
    `/hr/contracts/${contractId}/attachment`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      transformRequest: [(data) => data],
    }
  );

  return res.data;
}

// Legacy: upload attachment by employeeId (used elsewhere if needed)
async function uploadAttachmentByEmployee(employeeId: number, file: File) {
  const formData = new FormData();
  formData.append("attachment", file);

  const res = await apiClient.put<ContractResponse>(
    `/hr/contracts/employee/${employeeId}/attachment`,
    formData
  );

  return res.data;
}

async function remove(contractId: number) {
  const res = await apiClient.delete(`/hr/contracts/${contractId}`);
  return res.data;
}

async function getAllowanceTypes() {
  const res = await apiClient.get<AllowanceType[]>(`/hr/allowance-types`);
  return res.data ?? [];
}

function extractErrorMessage(err: any): string {
  if (err?.response?.data?.errors && typeof err.response.data.errors === "object") {
    const fieldErrors = err.response.data.errors as Record<string, string>;
    return Object.values(fieldErrors).join("\n");
  }

  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Something went wrong"
  );
}

export const contractService = {
  get,
  create,
  update,
  delete: remove,
  getAllowanceTypes,
  uploadAttachment,
  uploadAttachmentByEmployee,
  extractErrorMessage,
};

export type ContractModel = EmployeeContract;

export default contractService;