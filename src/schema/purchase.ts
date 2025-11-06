import { z } from "zod";

// Supplier Schema
export const SUPPLIER_SCHEMA = z.object({
  code: z.string().min(1, "Supplier code is required"),
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

// Purchase Requisition Item Schema
export const PURCHASE_REQUISITION_ITEM_SCHEMA = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Purchase Requisition Schema
export const PURCHASE_REQUISITION_SCHEMA = z.object({
  requestedBy: z.string().min(1, "Requested by is required"),
  department: z.string().optional(),
  requestedDate: z.string().min(1, "Request date is required"),
  requiredDate: z.string().optional(),
  items: z.array(PURCHASE_REQUISITION_ITEM_SCHEMA).min(1, "At least one item is required"),
  notes: z.string().optional(),
});

// Purchase Order Item Schema
export const PURCHASE_ORDER_ITEM_SCHEMA = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  discount: z.number().min(0).max(100, "Discount cannot exceed 100%").default(0),
  tax: z.number().min(0).default(0),
  warehouseId: z.string().optional(),
  notes: z.string().optional(),
});

// Purchase Order Schema
export const PURCHASE_ORDER_SCHEMA = z.object({
  requisitionId: z.string().optional(),
  supplierId: z.string().min(1, "Supplier is required"),
  orderDate: z.string().min(1, "Order date is required"),
  expectedDate: z.string().optional(),
  items: z.array(PURCHASE_ORDER_ITEM_SCHEMA).min(1, "At least one item is required"),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
});

// Goods Receipt Item Schema
export const GOODS_RECEIPT_ITEM_SCHEMA = z.object({
  orderItemId: z.string().min(1, "Order item is required"),
  receivedQuantity: z.number().min(0, "Received quantity must be positive"),
  acceptedQuantity: z.number().min(0, "Accepted quantity must be positive"),
  rejectedQuantity: z.number().min(0, "Rejected quantity must be positive").default(0),
  qualityStatus: z.enum(["pending", "passed", "failed", "partial"]).default("pending"),
  batchNo: z.string().optional(),
  lotNo: z.string().optional(),
  expiryDate: z.string().optional(),
  warehouseId: z.string().min(1, "Warehouse is required"),
  notes: z.string().optional(),
});

// Goods Receipt Schema
export const GOODS_RECEIPT_SCHEMA = z.object({
  orderId: z.string().min(1, "Purchase order is required"),
  receiptDate: z.string().min(1, "Receipt date is required"),
  items: z.array(GOODS_RECEIPT_ITEM_SCHEMA).min(1, "At least one item is required"),
  receivedBy: z.string().optional(),
  inspectedBy: z.string().optional(),
  notes: z.string().optional(),
});

// Purchase Invoice Schema
export const PURCHASE_INVOICE_SCHEMA = z.object({
  orderId: z.string().min(1, "Purchase order is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  date: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  items: z.array(PURCHASE_ORDER_ITEM_SCHEMA).min(1, "At least one item is required"),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

// Export types from schemas
export type SupplierFormData = z.infer<typeof SUPPLIER_SCHEMA>;
export type PurchaseRequisitionFormData = z.infer<typeof PURCHASE_REQUISITION_SCHEMA>;
export type PurchaseOrderFormData = z.infer<typeof PURCHASE_ORDER_SCHEMA>;
export type GoodsReceiptFormData = z.infer<typeof GOODS_RECEIPT_SCHEMA>;
export type PurchaseInvoiceFormData = z.infer<typeof PURCHASE_INVOICE_SCHEMA>;

