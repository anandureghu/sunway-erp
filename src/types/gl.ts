export interface GLAccountBalance {
  id: number;

  accountId: number;

  fiscalYear: string;

  accountingPeriodStart: string | null; // ISO Instant
  accountingPeriodEnd: string | null;

  totalAssets: number | string;
  totalLiabilities: number | string;
  totalRevenue: number | string;
  totalExpenses: number | string;

  balance: number | string;

  asOfDate?: string | null;

  createdAt: string;
}

export interface CreateGLBalanceDTO {
  accountId: number;
  fiscalYear: string;

  accountingPeriodStart: string | null;
  accountingPeriodEnd: string | null;

  totalAssets: number | string;
  totalLiabilities: number | string;
  totalRevenue: number | string;
  totalExpenses: number | string;

  asOfDate: string | null;
}

export interface GLBalanceResponseDTO {
  accountId: number;
  fiscalYear: string;

  totalAssets: number | string;
  totalLiabilities: number | string;
  totalRevenue: number | string;
  totalExpenses: number | string;

  balance: number | string;
}
