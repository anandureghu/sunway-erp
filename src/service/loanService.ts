import { apiClient } from "@/service/apiClient";
import type { Loan, LoanPayload } from "@/types/hr/loan";

const BASE = "/employees";

export const loanService = {
  getAll(employeeId: number) {
    return apiClient.get<Loan[]>(`${BASE}/${employeeId}/loans`);
  },

  create(employeeId: number, payload: LoanPayload) {
    return apiClient.post<Loan>(`${BASE}/${employeeId}/loans`, payload);
  },

  update(loanId: number, payload: LoanPayload) {
    return apiClient.put<Loan>(`${BASE}/loans/${loanId}`, payload);
  },
};

export default loanService;
