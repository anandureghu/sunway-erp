export interface Loan {
  id: number;
  loanCode: string;
  loanAmount: number;
  loanPeriod: number;
  monthlyDeduction: number;
  balance: number;
  status: "ACTIVE" | "CLOSED";
  startDate: string; // YYYY-MM-DD
}

export interface LoanPayload {
  // Request DTO for creating/updating a loan
  loanType: 'CAR_LOAN' | 'PERSONAL_LOAN' | 'HOUSING_LOAN' | 'EDUCATION_LOAN' | 'MEDICAL_LOAN';
  loanAmount: number;
  loanPeriod: number;
  startDate: string; // YYYY-MM-DD
  notes?: string;
}

