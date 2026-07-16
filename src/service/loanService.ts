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

  // Approve / reject a pending loan (requires LOANS.APPROVE permission on the BE).
  // On reject, `comment` records why it was declined.
  decideLoan(
    employeeId: number,
    loanId: number,
    approve: boolean,
    comment?: string,
  ) {
    return apiClient.post<Loan>(
      `${BASE}/${employeeId}/loans/${loanId}/decision`,
      { approve, comment },
    );
  },

  // Company-wide list of PENDING_APPROVAL loans for the caller's tenant.
  // Backend gates this on LOANS.APPROVE.
  fetchPendingApprovals() {
    return apiClient.get<PendingLoanApproval[]>("/loans/pending-approvals");
  },

  // Company-wide history of decided loans (active / closed / rejected) for the
  // HR Reports "Loan Approvals" view.
  fetchLoanApprovalsHistory(archived = false) {
    return apiClient.get<PendingLoanApproval[]>("/loans/approvals-history", {
      params: { archived },
    });
  },

  // Archive / unarchive a decided loan (drops from / returns to the active list).
  archiveLoan(loanId: number, archived = true) {
    return apiClient.post<Loan>(`/loans/${loanId}/archive`, null, {
      params: { archived },
    });
  },
};

export interface PendingLoanApproval {
  id: number;
  loanCode: string;
  loanType: string;
  loanAmount: number;
  loanPeriod: number;
  monthlyDeduction: number;
  balance: number;
  status: string;
  startDate: string;
  endDate: string;
  employeeId: number;
  employeeName: string;
  notes?: string;
  currencyCode?: string;
  currencySymbol?: string;
}

export default loanService;
