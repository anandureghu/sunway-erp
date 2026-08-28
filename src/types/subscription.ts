export type SubscriptionPlanType = "FREE" | "MONTHLY" | "YEARLY" | "CUSTOM";
export type SubscriptionStatus =
  | "ACTIVE"
  | "EXPIRING"
  | "EXPIRED"
  | "CANCELLED"
  | "SUSPENDED";
export type SubscriptionReminderType = "D7" | "D3" | "D1" | "DAY_OF" | "EXPIRED";
export type SubscriptionPaymentStatus = "PAID" | "UNPAID" | "NOT_REQUIRED";

export type SubscriptionStatusResponse = {
  companyId?: number | null;
  companyName?: string | null;
  planType?: SubscriptionPlanType | null;
  status?: SubscriptionStatus | null;
  startsAt?: string | null;
  endsAt?: string | null;
  warningDays?: number;
  daysRemaining?: number | null;
  locked: boolean;
  showWarningBanner: boolean;
  billingContactEmail?: string | null;
  amount?: number | null;
  currencyCode?: string | null;
};

export type SubscriptionPayment = {
  id: number;
  companySubscriptionId: number;
  companyId: number;
  amount: number;
  paidOn: string;
  methodNote?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  recordedBy?: number | null;
  createdAt?: string;
};

export type SubscriptionReminderLog = {
  id: number;
  reminderType: SubscriptionReminderType;
  periodKey: string;
  sentAt: string;
  toEmail?: string | null;
  success: boolean;
  error?: string | null;
};

export type SubscriptionInvoice = {
  id: number;
  companySubscriptionId: number;
  companyId: number;
  invoiceNo: string;
  periodStart: string;
  periodEnd?: string | null;
  amount: number;
  currencyCode?: string | null;
  planType: SubscriptionPlanType;
  pdfUrl?: string | null;
  toEmail?: string | null;
  sentAt?: string | null;
  sentBy?: string | null;
  sendSuccess: boolean;
  sendError?: string | null;
  sent: boolean;
  createdAt?: string;
};

export type CompanySubscription = {
  id: number;
  companyId: number;
  companyName?: string | null;
  planType: SubscriptionPlanType;
  amount: number;
  currencyCode?: string | null;
  startsAt: string;
  endsAt?: string | null;
  status: SubscriptionStatus;
  warningDays: number;
  graceDays: number;
  hrEntitled: boolean;
  financeEntitled: boolean;
  inventoryEntitled: boolean;
  /** Max total storage in bytes (cloud + database quota). */
  maxStorageBytes: number;
  notes?: string | null;
  daysRemaining?: number | null;
  locked: boolean;
  lastPaymentOn?: string | null;
  lastPaymentAmount?: number | null;
  paymentStatus?: SubscriptionPaymentStatus | null;
  createdAt?: string;
  updatedAt?: string;
  payments?: SubscriptionPayment[];
  reminders?: SubscriptionReminderLog[];
  invoices?: SubscriptionInvoice[];
};

export type AssignSubscriptionRequest = {
  planType: SubscriptionPlanType;
  amount?: number;
  currencyCode?: string;
  startsAt: string;
  endsAt?: string | null;
  warningDays?: number;
  graceDays?: number;
  hrEntitled?: boolean;
  financeEntitled?: boolean;
  inventoryEntitled?: boolean;
  /** Max total storage in bytes (cloud + database). */
  maxStorageBytes?: number;
  notes?: string;
  syncCompanyModules?: boolean;
};

export type RecordSubscriptionPaymentRequest = {
  amount: number;
  paidOn: string;
  methodNote?: string;
  periodStart?: string;
  periodEnd?: string;
  idempotencyKey?: string;
  extendSubscription?: boolean;
};

export type ExtendSubscriptionRequest = {
  newEndsAt: string;
  notes?: string;
};

export type CancelSubscriptionRequest = {
  status?: "CANCELLED" | "SUSPENDED";
  notes?: string;
};

export type SubscriptionAnalytics = {
  totalCompanies: number;
  countByStatus: Record<string, number>;
  countByPlanType: Record<string, number>;
  expiringIn7Days: number;
  expiringIn30Days: number;
  revenueCollectedInRange: number;
  estimatedMonthlyRecurring: number;
  newInPeriod: number;
  expiredInPeriod: number;
  paymentsByMonth: { month: string; amount: number }[];
};

export type PagedSubscriptions = {
  content: CompanySubscription[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};
