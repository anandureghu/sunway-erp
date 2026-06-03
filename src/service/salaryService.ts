import { apiClient } from "@/service/apiClient";

const BASE = "/employees";

export type RetirementCompensation = {
  employeeId: number;
  employeeName: string | null;
  joinDate: string | null;
  calculatedOn: string | null;
  yearsOfService: number;
  basicSalary: number;
  monthsPerYear: number;
  accruedMonths: number;
  compensationAmount: number;
  currencyCode: string | null;
};

export const salaryService = {
  async get(employeeId: number) {
    return apiClient.get(`${BASE}/${employeeId}/salary`);
  },

  async create(employeeId: number, payload: any) {
    return apiClient.post(`${BASE}/${employeeId}/salary`, payload);
  },

  async update(employeeId: number, payload: any) {
    return apiClient.put(`${BASE}/${employeeId}/salary`, payload);
  },

  /**
   * Accrued end-of-service compensation for the employee. Returns 200 with the
   * calculation when the company policy is enabled; the backend responds with an
   * error (4xx) when it is disabled or the data needed to compute it is missing.
   */
  async getRetirementCompensation(employeeId: number) {
    return apiClient.get<RetirementCompensation>(
      `${BASE}/${employeeId}/retirement-compensation`,
    );
  },
};
