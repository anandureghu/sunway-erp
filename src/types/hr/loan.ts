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
  loanCode: string;
  loanAmount: number;
  loanPeriod: number;
  monthlyDeduction: number;
  startDate: string; // YYYY-MM-DD
}

