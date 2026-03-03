import { apiClient } from "./apiClient";
import type { EmployeeContract, ContractType, ContractStatus } from "@/types/hr";

/* =======================
   TYPES
======================= */

export interface AllowancePayload {
  allowanceType?: string;
  allowanceTypeId?: number;
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
  noticePeriodDays?: number;
  salaryRateType?: string;
  signatureDate?: string;
  signedBy?: string;
  allowances: AllowancePayload[];
  termsAndConditions?: string;
  attachmentUrl?: string;
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
  allowances: AllowancePayload[];
  termsAndConditions?: string;
  attachmentUrl?: string;
  // Staff name fields - may vary across API responses
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
   API CALLS
======================= */
// GET contract by employee
async function get(employeeId: number) {
  try {
    const res = await apiClient.get<ContractResponse>(
      `/hr/contracts/employee/${employeeId}`
    );
    return res.data ?? null;
  } catch (err: any) {
    // 404 means contract does not exist yet → not an error
    if (err.response?.status === 404) {
      return null;
    }
    throw err; // real error
  }
}

// CREATE contract
async function create(employeeId: number, payload: ContractApiPayload) {
  const res = await apiClient.post<ContractResponse>(`/hr/contracts/employee/${employeeId}`, payload);
  return res.data;
}

// UPDATE contract
async function update(contractId: number, payload: ContractApiPayload) {
  const res = await apiClient.put<ContractResponse>(`/hr/contracts/${contractId}`, payload);
  return res.data;
}

// DELETE contract (soft delete)
async function remove(contractId: number) {
  const res = await apiClient.delete(`/hr/contracts/${contractId}`);
  return res.data;
}

// GET allowance types (for dropdown)
async function getAllowanceTypes() {
  const res = await apiClient.get<AllowanceType[]>(`/hr/allowance-types`);
  return res.data ?? [];
}

function extractErrorMessage(err: any): string {
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
  extractErrorMessage,
};

export type ContractModel = EmployeeContract;

export default contractService;
