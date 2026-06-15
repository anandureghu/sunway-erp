export interface FinanceReportTotals {
  revenue: number;
  expenses: number;
  netProfit: number;
  totalReceivables: number;
  totalPayables: number;
  cashInflow: number;
  cashOutflow: number;
  invoiceCount: number;
  paymentCount: number;
}

export interface FinanceMonthlyPoint {
  yearMonth: string;
  value: number;
}

export interface FinanceAgingBuckets {
  current: number;
  d1To30: number;
  d31To60: number;
  d61To90: number;
  d90Plus: number;
  currentCount: number;
  d1To30Count: number;
  d31To60Count: number;
  d61To90Count: number;
  d90PlusCount: number;
}

export interface FinancePartyRow {
  name: string;
  totalAmount: number;
  outstanding: number;
  invoiceCount: number;
}

export interface FinanceAccountAmount {
  accountName: string;
  accountCode: string | null;
  amount: number;
}

export interface FinanceDepartmentBudgetSpend {
  departmentId: number;
  departmentName: string;
  departmentCode: string | null;
  budgeted: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
}

export interface FinanceReportSummary {
  from: string;
  to: string;
  totals: FinanceReportTotals;
  revenueByMonth: FinanceMonthlyPoint[];
  expenseByMonth: FinanceMonthlyPoint[];
  cashInflowByMonth: FinanceMonthlyPoint[];
  cashOutflowByMonth: FinanceMonthlyPoint[];
  arAging: FinanceAgingBuckets;
  apAging: FinanceAgingBuckets;
  topCustomers: FinancePartyRow[];
  topVendors: FinancePartyRow[];
  incomeByAccount: FinanceAccountAmount[];
  expensesByAccount: FinanceAccountAmount[];
  departmentBudgetSpend: FinanceDepartmentBudgetSpend[];
  generatedAt: string;
}
