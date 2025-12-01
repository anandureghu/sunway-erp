export interface ChartOfAccounts {
  id: number;

  accountCode: string;
  accountName: string;
  description?: string | null;

  type: AccountType;

  parent?: ChartOfAccounts | null;
  parentId?: number | null;

  currency?: string | null;

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

  type: AccountType;

  parentId?: number | null;

  currency?: string | null;
  status: AccountStatus;

  glAccountClassTypeKey?: string | null;
  glAccountType?: string | null;

  balance: string | number; // BigDecimal from backend
  companyId: number;
}

export interface CreateAccountDTO {
  companyId: number; // required

  accountCode: string;
  accountName: string;
  description?: string | null;

  type: AccountType;
  parentId?: number | null;

  currency?: string | null;
  status: AccountStatus;

  glAccountClassTypeKey?: string | null;
  glAccountType?: string | null;

  openingBalance?: number | string; // BigDecimal
}

export const ACCOUNT_TYPES = [
  "asset",
  "liability",
  "income",
  "expense",
  "equity",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const STATUS_TYPES = ["active", "inactive"] as const;
export type AccountStatus = (typeof STATUS_TYPES)[number];
