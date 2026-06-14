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

export type PayrollAccountStatus = {
  status: "NOT_CONFIGURED" | "READY" | "INSUFFICIENT";
  configured: boolean;
  debitAccountId?: number | null;
  debitAccountCode?: string | null;
  debitAccountName?: string | null;
  availableBalance: number;
  payrollGrossAmount: number;
  sufficientFunds: boolean;
};

export type PayrollPreview = {
  monthlyGross: number;
  workingDays: number;
  perDaySalary: number;
  workedHours: number;
  workedDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  payableDays: number;
  lopDays: number;
  lopAmount: number;
  loanDeduction: number;
  totalDeductions: number;
  netPayable: number;
  earnedGrossPay: number;
  endOfServiceCompensation: number;
  finalSettlement: boolean;
  grossPay: number;
  payrollAccount: PayrollAccountStatus;
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
  previewPayroll(employeeId: number, payload: PayrollGeneratePayload) {
    return apiClient.post<PayrollPreview>(
      `${BASE}/${employeeId}/salary/payroll/preview`,
      payload,
    );
  },

  getPayrollAccountStatus(companyId: string | number) {
    return apiClient.get<PayrollAccountStatus>(
      `/companies/${companyId}/payroll/account-status`,
    );
  },

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