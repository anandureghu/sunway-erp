import { apiClient } from "@/service/apiClient";
import type { AxiosError } from "axios";

const BASE = "/employees";

export type PayrollGeneratePayload = {
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
};

export type PayrollBatchResponse = {
  generatedCount: number;
  payrollMonth: string;
};

export function parsePayrollApiError(err: unknown): { message: string; details: string[] } {
  const ax = err as AxiosError<{
    message?: string;
    details?: string[];
  }>;
  const data = ax?.response?.data;
  const message = data?.message ?? "Payroll request failed";
  const details = Array.isArray(data?.details) ? data.details : [];
  return { message, details };
}

export const payrollService = {
  generatePayroll(employeeId: number, payload: PayrollGeneratePayload) {
    return apiClient.post(`${BASE}/${employeeId}/salary/payroll/generate`, payload);
  },

  /** All active employees, single transaction; 400 + details if any validation fails. */
  generatePayrollBatch(companyId: string | number, payload: PayrollGeneratePayload) {
    return apiClient.post<PayrollBatchResponse>(
      `/companies/${companyId}/payroll/generate-batch`,
      payload,
    );
  },

  getPayrollHistory(employeeId: number) {
    return apiClient.get(`${BASE}/${employeeId}/salary/payroll/history`);
  },
};