export type HistoryModule = "inventory" | "finance" | "hr";

export type HistoryEntityType =
  | "SALES_ORDER"
  | "PURCHASE_ORDER"
  | "PURCHASE_REQUISITION"
  | "STOCK_VARIANCE"
  | "GOODS_RECEIPT"
  | "SALES_INVOICE"
  | "CUSTOMER_PAYMENT"
  | "PURCHASE_INVOICE"
  | "VENDOR_PAYMENT"
  | "JOURNAL_ENTRY"
  | "TRANSACTION"
  | "BUDGET_DISTRIBUTION";

export type HistoryRecord = {
  id: number;
  type: HistoryEntityType;
  referenceNo?: string | null;
  status?: string | null;
  partyName?: string | null;
  amount?: number | null;
  createdAt?: string | null;
  archivedAt?: string | null;
};

export type HistoryPageResponse = {
  content: HistoryRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type BulkActionFailure = {
  id: number;
  reason: string;
};

export type BulkActionResult = {
  succeeded: number[];
  failed: BulkActionFailure[];
};

export const HISTORY_ENTITY_LABELS: Record<HistoryEntityType, string> = {
  SALES_ORDER: "Sales orders",
  PURCHASE_ORDER: "Purchase orders",
  PURCHASE_REQUISITION: "Purchase requisitions",
  STOCK_VARIANCE: "Stock variances",
  GOODS_RECEIPT: "Goods receipts",
  SALES_INVOICE: "Sales invoices",
  CUSTOMER_PAYMENT: "Customer payments",
  PURCHASE_INVOICE: "Purchase invoices",
  VENDOR_PAYMENT: "Vendor payments",
  JOURNAL_ENTRY: "Journal entries",
  TRANSACTION: "Transactions",
  BUDGET_DISTRIBUTION: "Budget distributions",
};

/** Backend module each entity type belongs to (must match HistoryEntityType.java). */
export const HISTORY_TYPE_MODULE: Record<HistoryEntityType, HistoryModule> = {
  SALES_ORDER: "inventory",
  PURCHASE_ORDER: "inventory",
  PURCHASE_REQUISITION: "inventory",
  STOCK_VARIANCE: "inventory",
  GOODS_RECEIPT: "inventory",
  SALES_INVOICE: "finance",
  CUSTOMER_PAYMENT: "finance",
  PURCHASE_INVOICE: "finance",
  VENDOR_PAYMENT: "finance",
  JOURNAL_ENTRY: "finance",
  TRANSACTION: "finance",
  BUDGET_DISTRIBUTION: "finance",
};

export const HISTORY_MODULE_TYPES: Record<HistoryModule, HistoryEntityType[]> = {
  inventory: [
    "SALES_ORDER",
    "PURCHASE_ORDER",
    "PURCHASE_REQUISITION",
    "STOCK_VARIANCE",
    "GOODS_RECEIPT",
    "SALES_INVOICE",
    "PURCHASE_INVOICE",
    "CUSTOMER_PAYMENT",
    "VENDOR_PAYMENT",
  ],
  finance: [
    "SALES_INVOICE",
    "CUSTOMER_PAYMENT",
    "PURCHASE_INVOICE",
    "VENDOR_PAYMENT",
    "JOURNAL_ENTRY",
    "TRANSACTION",
    "BUDGET_DISTRIBUTION",
  ],
  hr: [],
};

export const OPERATIONAL_ARCHIVE_TYPE: Partial<
  Record<HistoryEntityType, HistoryEntityType>
> = {
  SALES_ORDER: "SALES_ORDER",
  PURCHASE_ORDER: "PURCHASE_ORDER",
  PURCHASE_REQUISITION: "PURCHASE_REQUISITION",
  STOCK_VARIANCE: "STOCK_VARIANCE",
  GOODS_RECEIPT: "GOODS_RECEIPT",
  SALES_INVOICE: "SALES_INVOICE",
  CUSTOMER_PAYMENT: "CUSTOMER_PAYMENT",
  PURCHASE_INVOICE: "PURCHASE_INVOICE",
  VENDOR_PAYMENT: "VENDOR_PAYMENT",
  JOURNAL_ENTRY: "JOURNAL_ENTRY",
  TRANSACTION: "TRANSACTION",
};
