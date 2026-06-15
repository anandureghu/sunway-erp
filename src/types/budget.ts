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

export type BudgetType = "OPEX" | "CAPEX" | "PROJECT";

export interface BudgetResponseDTO {
  id: number;
  budgetName: string;
  fiscalYear: string;
  budgetType?: BudgetType;
  projectId?: string | null;
  budgetAccountId?: number | null;
  budgetAccountName?: string | null;
  budgetAccountCode?: string | null;
  status: string;
  startDate: string;
  endDate: string;
  amount?: number;
  distributedAmount?: number;
  remainingAmount?: number;
  balance?: number;
  isActive?: boolean;
  reviseCount?: number;
  parentBudgetId?: number | null;
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
  budgetType: BudgetType;
  budgetAccountId: number;
  projectId?: string;
}

export interface BudgetDistributeDTO {
  creditAccountId: number;
  amount: number;
  notes?: string;
  postedDate?: string;
}

export interface BudgetDistributionResponseDTO {
  id: number;
  transactionCode?: string;
  transactionDate: string;
  amount: number;
  creditAccountId?: number;
  creditAccountName?: string;
  creditAccountCode?: string;
  debitAccountId?: number;
  debitAccountName?: string;
  transactionDescription?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt?: string;
  archived?: boolean;
  archivedAt?: string;
  archivedByUserId?: number;
  archivedByUserName?: string;
}
