export interface ChartOfAccounts {
  id: number;

  accountCode: string;
  accountName: string;
  description?: string | null;

  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;

  projectId?: string;
  projectCode?: string;
  projectName?: string;

  parentId?: string;
  parentCode?: string;
  parentName?: string;

  type: CoaType;

  status: AccountStatus;

  glAccountClassTypeKey?: string | null;
  glAccountType?: string | null;

  balance: string | number; // BigDecimal
  asOfDate?: string | null;

  createdAt: string;
  updatedAt: string;

  companyId: number;
}

export interface ChartOfAccountResponseDTO {
  id: number;

  accountCode: string;
  accountName: string;
  description?: string | null;

  type: CoaType;

  parentId?: number | null;

  currency?: string | null;
  status: AccountStatus;

  glAccountClassTypeKey?: string | null;
  glAccountType?: string | null;

  balance: string | number; // BigDecimal from backend
  companyId: number;
}

export const COA = [
  { key: "ASSET", label: "Asset" },
  { key: "LIABILITY", label: "Liability" },
  { key: "EQUITY", label: "Equity" },
  { key: "REVENUE", label: "Revenue" },
  { key: "EXPENSE", label: "Expense" },
  { key: "INCOME", label: "Income" },
  { key: "CASH", label: "Cash" },
  { key: "TAX", label: "Tax" },
  { key: "COST", label: "Cost" },
] as const;

export type CoaType = (typeof COA)[number]["key"];

export interface CreateAccountDTO {
  companyId: number; // required

  accountCode: string;
  accountName: string;
  description?: string | null;

  type: CoaType;
  parentId?: number | null;

  currency?: string | null;
  status: AccountStatus;

  glAccountClassTypeKey?: string | null;
  glAccountType?: string | null;

  openingBalance?: number | string; // BigDecimal
}

export const STATUS_TYPES = ["active", "inactive"] as const;
export type AccountStatus = (typeof STATUS_TYPES)[number];
