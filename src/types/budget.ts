export interface BudgetLineDTO {
  tempId?: string;
  id?: number;
  accountId: number;
  departmentId: number | null;
  projectId: number | null;
  amount: number;
  currencyCode: string;
  notes: string;
  startDate: string | null;
  endDate: string | null;
}

export interface BudgetResponseDTO {
  id: number;
  budgetName: string;
  budgetYear: number;
  status: string;
  startDate: string;
  endDate: string;
  amount?: number;
  balance?: number;
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
  departmentId?: number;
  projectId?: number;
}

export interface BudgetUpdateDTO {
  budgetName: string;
  budgetYear: number;
  startDate: string;
  endDate: string;
  amount: number;
  departmentId?: number;
  projectId?: number;
}
