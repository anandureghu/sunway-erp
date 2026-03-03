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
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type PurchaseRequisitionItem = {
  id: string;
  requisitionId: string;
  itemId: number;
  item?: PurchaseRequisitionItemDTO;
  quantity: number;
  unitPrice?: number;
  estimatedTotal?: number;
  notes?: string;
};

export type PurchaseRequisition = {
  id: string;
  requisitionNo: string;
  requestedBy: string;
  requestedByName?: string;
  department?: string;
  requestedDate: string;
  requiredDate?: string;
  status: PurchaseRequisitionStatus;
  items: PurchaseRequisitionItem[];
  totalAmount?: number;
  notes?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  rejectionReason?: string;
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
  item?: PurchaseOrderItemDTO;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  lineTotal: number;
  receivedQuantity?: number;
  warehouseId?: string;
  notes?: string;
};

export type PurchaseOrder = {
  id: string;
  orderNo: string;
  orderNumber?: string;
  requisitionId?: string;
  requisition?: PurchaseRequisition;
  supplierId: string;
  supplier?: Supplier;
  orderDate: string;
  expectedDate?: string;
  status: PurchaseOrderStatus;
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

export type GoodsReceiptItem = {
  id: string;
  receiptId: string;
  orderItemId: string;
  orderItem?: PurchaseOrderItem;
  itemId: number;
  item?: ItemResponseDTO;
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
