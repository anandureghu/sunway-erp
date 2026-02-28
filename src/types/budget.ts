export interface BudgetLineDTO {
  id?: number;
  accountId: number;
  accountName?: string;
  accountCode?: string;
  departmentId?: number | null;
  departmentName?: string;
  departmentCode?: string;
  projectId?: string | null;
  amount: number;
  notes?: string;
  startDate: string | null;
  endDate: string | null;
  status?: string;

  createdByUserId?: number;
  createdByUserName?: string;
  updatedByUserId?: number;
  updatedByUserName?: string;
  approvedByUserId?: number;
  approvedByUserName?: string;
}

export interface BudgetResponseDTO {
  id: number;
  budgetName: string;
  fiscalYear: string;
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
  fiscalYear: string;
  startDate: string;
  endDate: string;
  amount: number;
}
