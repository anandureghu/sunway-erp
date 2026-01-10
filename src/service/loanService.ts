import { apiClient } from "@/service/apiClient";
import type { Loan, LoanPayload } from "@/types/hr/loan";

const BASE = "/employees";

export const loanService = {
  // Get loan types for dropdown
  getLoanTypes(employeeId: number) {
    return apiClient.get<string[]>(`${BASE}/${employeeId}/loans/types`);
  },

  // Apply for loan
  applyLoan(employeeId: number, data: LoanPayload) {
    return apiClient.post<Loan>(`${BASE}/${employeeId}/loans`, {
      loanType: data.loanType,
      loanAmount: data.loanAmount,
      loanPeriod: data.loanPeriod,
      startDate: data.startDate,
      notes: (data as any).notes,
    });
  },

  // Get employee loans
  getLoans(employeeId: number) {
    return apiClient.get<Loan[]>(`${BASE}/${employeeId}/loans`);
  },

  // Update loan
  updateLoan(employeeId: number, loanId: number, data: LoanPayload) {
    return apiClient.put<Loan>(`${BASE}/${employeeId}/loans/${loanId}`, data);
  },

  // Generic PUT alias (some callers expect `put`)
  put(employeeId: number, loanId: number, data: any) {
    return apiClient.put(`${BASE}/${employeeId}/loans/${loanId}`, data);
  },

  // Soft-delete via PUT (backend may accept status change via PUT)
  softDelete(employeeId: number, loanId: number) {
    return apiClient.put(`${BASE}/${employeeId}/loans/${loanId}`, { status: 'DELETED' });
  },

  // Delete loan
  deleteLoan(employeeId: number, loanId: number) {
    return apiClient.delete(`${BASE}/${employeeId}/loans/${loanId}`);
  },
};

export default loanService;
