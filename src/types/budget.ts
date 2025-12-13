export interface BudgetLineDTO {
  tempId?: string;
  id?: number;
  accountId: number;
  departmentId: number | null;
  projectId: number | null;
  period: number;
  amount: number;
  currencyCode: string;
  notes: string;
}

export interface BudgetResponseDTO {
  id: number;
  budgetName: string;
  budgetYear: number;
  status: string;
  startDate: string;
  endDate: string;
  amount?: number;
  createdAt: string;
  updatedAt: string;
  companyId: number;
  createdByUserId: number;
  approvedByUserId: number | null;
  lines: BudgetLineDTO[];
}

export interface BudgetCreateDTO {
  budgetName: string;
  budgetYear: number;
  startDate: string;
  endDate: string;
  amount: number;
}

export interface BudgetUpdateDTO {
  budgetName: string;
  budgetYear: number;
  startDate: string;
  endDate: string;
  amount: number;
}
