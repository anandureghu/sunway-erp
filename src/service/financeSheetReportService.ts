/**
 * FIN_SHEET_REPORTS — client for Financial Summary / Account Summary sheets.
 * Delete with those report pages, sidebar entries, and backend FinanceSheetReportService.
 */
import { apiClient } from "./apiClient";

export type AgingSplit = {
  current: number;
  d1To30: number;
  d31To60: number;
  d61To90: number;
  d90Plus: number;
  total: number;
};

export type FinancialSummaryReport = {
  companyName?: string | null;
  from: string;
  to: string;
  generatedAt: string;
  periodLabel?: string | null;
  revenue: number;
  expenses: number;
  netProfit: number;
  grossMarginPercent: number;
  cashBalance: number;
  totalReceivables: number;
  totalPayables: number;
  overdueReceivables: number;
  overduePayables: number;
  profitAndLoss: {
    label: string;
    amount?: number | null;
    header: boolean;
    total: boolean;
    indented: boolean;
  }[];
  balanceSheet: {
    label: string;
    amount?: number | null;
    header: boolean;
    total: boolean;
    indented: boolean;
  }[];
  revenueTrend: { yearMonth: string; label: string; value: number }[];
  arAging: AgingSplit;
  apAging: AgingSplit;
  exceptions: {
    label: string;
    count: number;
    value: number;
    detail?: string | null;
    owner?: string | null;
    tone?: string | null;
  }[];
  trialBalance: {
    accountId: number;
    accountCode: string;
    accountName: string;
    accountClass: string;
    accountType: string;
    opening: number;
    debits: number;
    credits: number;
    closing: number;
  }[];
};

export type AccountSummaryReport = {
  accountId: number;
  accountCode: string;
  accountName: string;
  description?: string | null;
  accountClass: string;
  accountType: string;
  normalBalance: string;
  statement: string;
  departmentName?: string | null;
  projectCode?: string | null;
  active?: boolean | null;
  companyName?: string | null;
  from: string;
  to: string;
  generatedAt: string;
  opening: number;
  periodDebits: number;
  periodCredits: number;
  closing: number;
  periodMovement: number;
  lastPostingAt?: string | null;
  lastPostingLabel?: string | null;
  trend: { yearMonth: string; label: string; value: number }[];
  movement: { label: string; amount: number; note?: string | null; total: boolean }[];
  recentTransactions: {
    date?: string | null;
    code?: string | null;
    narrative?: string | null;
    side: string;
    debit: number;
    credit: number;
  }[];
  byCostCentre: { name: string; amount: number; share: number }[];
};

export const financeSheetReportService = {
  async financialSummary(from?: string, to?: string): Promise<FinancialSummaryReport> {
    const res = await apiClient.get<FinancialSummaryReport>(
      "/finance/reports/financial-summary",
      { params: { from, to } },
    );
    return {
      ...res.data,
      profitAndLoss: res.data?.profitAndLoss ?? [],
      balanceSheet: res.data?.balanceSheet ?? [],
      revenueTrend: res.data?.revenueTrend ?? [],
      exceptions: res.data?.exceptions ?? [],
      trialBalance: res.data?.trialBalance ?? [],
      arAging: res.data?.arAging ?? emptyAging(),
      apAging: res.data?.apAging ?? emptyAging(),
    };
  },

  async accountSummary(
    accountId: number,
    from?: string,
    to?: string,
  ): Promise<AccountSummaryReport> {
    const res = await apiClient.get<AccountSummaryReport>(
      `/finance/reports/accounts/${accountId}/summary`,
      { params: { from, to } },
    );
    return {
      ...res.data,
      trend: res.data?.trend ?? [],
      movement: res.data?.movement ?? [],
      recentTransactions: res.data?.recentTransactions ?? [],
      byCostCentre: res.data?.byCostCentre ?? [],
    };
  },
};

function emptyAging(): AgingSplit {
  return { current: 0, d1To30: 0, d31To60: 0, d61To90: 0, d90Plus: 0, total: 0 };
}

export const money = (n?: number | null) =>
  n == null
    ? "—"
    : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtReportDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
