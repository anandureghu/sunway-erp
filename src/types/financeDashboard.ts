export interface FinanceDashboardKpis {
  revenueThisMonth: number;
  expensesThisMonth: number;
  netProfitThisMonth: number;
  receivablesOutstanding: number;
  payablesOutstanding: number;
  cashBalance: number;
  budgetUtilizationPercent: number;
  pendingApprovalsCount: number;
}

export interface FinanceDashboardTrendPoint {
  yearMonth: string;
  revenue: number;
  expense: number;
}

export interface FinanceDashboardAging {
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

export interface FinanceDashboardOverdueRow {
  invoiceId: string;
  party: string;
  dueDate: string;
  daysOverdue: number;
  amount: number;
  outstanding: number;
}

export interface FinanceDashboardBudgetRow {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  budgeted: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
}

export interface FinanceDashboardPendingApprovals {
  purchaseRequisitions: number;
  purchaseOrders: number;
  paymentRequests: number;
  journalEntries: number;
}

export interface FinanceDashboardTransaction {
  transactionCode: string;
  transactionType: string;
  description: string;
  transactionDate: string;
  amount: number;
}

export interface FinanceDashboardPaymentStatus {
  paidCount: number;
  partiallyPaidCount: number;
  unpaidCount: number;
  totalCount: number;
}

export interface FinanceDashboardAlert {
  type: string;
  message: string;
  count: number;
  amount: number;
}

export interface FinanceDashboard {
  kpis: FinanceDashboardKpis;
  revenueExpenseTrend: FinanceDashboardTrendPoint[];
  receivablesAging: FinanceDashboardAging;
  payablesAging: FinanceDashboardAging;
  topOverdueReceivables: FinanceDashboardOverdueRow[];
  topPayablesDue: FinanceDashboardOverdueRow[];
  budgetUtilizationByDepartment: FinanceDashboardBudgetRow[];
  pendingApprovals: FinanceDashboardPendingApprovals;
  recentFinancialTransactions: FinanceDashboardTransaction[];
  paymentStatus: FinanceDashboardPaymentStatus;
  criticalAlerts: FinanceDashboardAlert[];
  generatedAt: string;
}
