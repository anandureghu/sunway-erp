import { apiClient } from "@/service/apiClient";

const BASE = "/employees";

export const payrollService = {
  generatePayroll(employeeId: number, payload: { payPeriodStart: string; payPeriodEnd: string; payDate: string }) {
    return apiClient.post(`${BASE}/${employeeId}/salary/payroll/generate`, payload);
  },

  getPayrollHistory(employeeId: number) {
    return apiClient.get(`${BASE}/${employeeId}/salary/payroll/history`);
  },
};