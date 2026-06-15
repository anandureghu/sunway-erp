import type { ItemResponseDTO } from "@/service/erpApiTypes";
import type { Warehouse } from "./inventory";
import type {
  PurchaseOrderItemDTO,
  PurchaseRequisitionItemDTO,
} from "@/service/purchaseFlowService";

// Supplier Types
export type Supplier = {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  rating?: number; // 1-5 rating for supplier performance
  status: "active" | "inactive";
  // Performance tracking
  totalOrders?: number;
  onTimeDeliveryRate?: number; // Percentage
  qualityScore?: number; // 1-5
  averageDeliveryTime?: number; // Days
  createdAt: string;
  updatedAt?: string;
};

// Purchase Requisition Types
export type PurchaseRequisitionStatus =
  | "draft"
  | "submitted"
  | "rejected"
  | "converted";

export type PurchaseRequisitionUrgency = "normal" | "urgent" | "critical";

export type PurchaseRequisitionReviewAction = "reject" | "send_back";

export type PurchaseRequisitionDocument = {
  id: string;
  fileName: string;
  contentType?: string;
  fileSizeBytes?: number;
  downloadUrl?: string;
  uploadedAt?: string;
  uploadedById?: string;
  uploadedByName?: string;
};

export type PurchaseRequisitionItem = {
  id: string;
  requisitionId: string;
  itemId: number;
  itemName?: string;
  item?: PurchaseRequisitionItemDTO;
  quantity: number;
  /** Snapshot of item cost price when the line was added. */
  actualItemPrice?: number;
  /** Optional negotiated / other unit cost. */
  otherUnitCost?: number;
  unitPrice?: number;
  estimatedUnitCost?: number;
  estimatedTotal?: number;
  notes?: string;
};

export type PurchaseRequisition = {
  id: string;
  requisitionNo: string;
  requestedBy: string;
  requestedByName?: string;
  requestedById?: string;
  department?: string;
  departmentId?: string;
  departmentName?: string;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  supplierAddress?: string;
  requestedDate: string;
  requiredDeliveryDate?: string;
  /** Legacy alias; maps to required delivery date when present. */
  requiredDate?: string;
  projectCode?: string;
  requisitionDescription?: string;
  urgency?: PurchaseRequisitionUrgency;
  deliveryWarehouseId?: string;
  deliveryWarehouseName?: string;
  justification?: string;
  status: PurchaseRequisitionStatus;
  items: PurchaseRequisitionItem[];
  documents?: PurchaseRequisitionDocument[];
  totalAmount?: number;
  notes?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  convertedAt?: string;
  archived?: boolean;
  /** Set when approval creates a purchase order in the same request. */
  createdPurchaseOrderId?: string;
  /** Human-readable PO number (e.g. PO-1000) when a linked order exists. */
  createdPurchaseOrderNumber?: string;
  debitAccountId?: string;
  debitAccountName?: string;
  creditAccountId?: string;
  creditAccountName?: string;
  /** Finance transaction posted on approve. */
  financeTransactionId?: string;
  rejectionReason?: string;
  reviewAction?: PurchaseRequisitionReviewAction;
  rejectedAt?: string;
  rejectedById?: string;
  rejectedByName?: string;
  createdAt: string;
  updatedAt: string;
};

// Purchase Order Types
export type PurchaseOrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled";

export type PurchaseOrderItem = {
  id: string;
  orderId: string;
  itemId: number;
  itemName?: string;
  item?: PurchaseOrderItemDTO;
  quantity: number;
  /** Snapshot of item cost price from master. */
  actualItemPrice?: number;
  /** Optional other / negotiated unit cost. */
  otherUnitCost?: number;
  /** Applied unit cost (same as unitCost in API). */
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  lineTotal: number;
  receivedQuantity?: number;
  warehouseId?: string;
  notes?: string;
};

export type PurchaseOrderPostingPreview = {
  action: "release" | "cancel";
  amount: number;
  debitAccountId?: number;
  debitAccountCode?: string;
  debitAccountName?: string;
  debitBalanceBefore?: number;
  debitBalanceAfter?: number;
  creditAccountId?: number;
  creditAccountCode?: string;
  creditAccountName?: string;
  creditBalanceBefore?: number;
  creditBalanceAfter?: number;
  sufficientFunds: boolean;
  insufficientFundsMessage?: string;
  fundsAlreadyCommitted?: boolean;
  willReleaseCommittedFunds?: boolean;
  summary?: string;
};

export type PurchaseOrder = {
  id: string;
  orderNo: string;
  orderNumber?: string;
  requisitionId?: string;
  /** Human-readable PR number (e.g. PR-1000) when sourced from a requisition. */
  requisitionNo?: string;
  requisition?: PurchaseRequisition;
  supplierId: string;
  supplierName?: string;
  supplier?: Supplier;
  orderDate: string;
  expectedDate?: string;
  status: PurchaseOrderStatus;
  archived?: boolean;
  /** True after vendor payment is confirmed in Finance → AP → Vendor payments */
  vendorPaymentSettled?: boolean;
  purchaseInvoiceId?: number;
  vendorPaymentId?: number;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress?: string;
  notes?: string;
  orderedBy?: string;
  orderedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  createdAt: string;
  updatedAt: string;
};

// Goods Receipt Types
export type GoodsReceiptStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type QualityInspectionStatus =
  | "pending"
  | "passed"
  | "failed"
  | "partial";

/** Lightweight item snapshot for GR line display (not full catalog DTO). */
export type PurchaseItemRef = {
  id: number;
  name?: string;
  sku?: string;
};

export type GoodsReceiptItem = {
  id: string;
  receiptId: string;
  orderItemId: string;
  orderItem?: PurchaseOrderItem;
  itemId: number;
  item?: PurchaseItemRef;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  qualityStatus: QualityInspectionStatus;
  batchNo?: string;
  lotNo?: string;
  expiryDate?: string;
  warehouseId: string;
  warehouse?: Warehouse;
  notes?: string;
};

export type GoodsReceipt = {
  id: string;
  receiptNo: string;
  orderId: string;
  order?: PurchaseOrder;
  receiptDate: string;
  /** Backend-generated goods receipt PDF (public URL). */
  documentPdfUrl?: string | null;
  status: GoodsReceiptStatus;
  items: GoodsReceiptItem[];
  receivedBy?: string;
  receivedByName?: string;
  inspectedBy?: string;
  inspectedByName?: string;
  inspectionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// Purchase Invoice Types
export type PurchaseInvoiceStatus =
  | "draft"
  | "pending"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "cancelled";

export type PurchaseInvoiceItem = {
  id: string;
  invoiceId: string;
  orderItemId: string;
  itemId: number;
  item?: ItemResponseDTO;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
};

export type PurchaseInvoice = {
  id: string;
  invoiceNo: string;
  orderId: string;
  order?: PurchaseOrder;
  supplierId: string;
  supplier?: Supplier;
  supplierName: string;
  date: string;
  dueDate: string;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  status: PurchaseInvoiceStatus;
  paymentTerms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
