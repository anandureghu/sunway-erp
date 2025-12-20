import { z } from "zod";

// Customer Schema
export const CUSTOMER_SCHEMA = z.object({
  code: z.string().min(1, "Customer code is required"),
  name: z.string().min(1, "Customer name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

// Sales Order Item Schema
export const SALES_ORDER_ITEM_SCHEMA = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  discount: z.number().min(0).max(100, "Discount cannot exceed 100%").default(0),
  tax: z.number().min(0).default(0),
  warehouseId: z.string().optional(),
});

// Sales Order Schema
export const SALES_ORDER_SCHEMA = z.object({
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.string().min(1, "Order date is required"),
  requiredDate: z.string().optional(),
  items: z.array(SALES_ORDER_ITEM_SCHEMA).min(1, "At least one item is required"),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  salesPerson: z.string().optional(),
});

// Picklist Schema
export const PICKLIST_SCHEMA = z.object({
  orderId: z.string().min(1, "Sales order is required"),
  warehouseId: z.string().optional(), // Optional - backend API doesn't accept it, but we collect for display
  assignedTo: z.string().optional(),
});

// Dispatch Schema
export const DISPATCH_SCHEMA = z.object({
  orderId: z.string().optional(), // Optional - can be derived from picklist
  picklistId: z.string().min(1, "Picklist is required"),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Delivery Tracking Schema
export const DELIVERY_TRACKING_SCHEMA = z.object({
  dispatchId: z.string().min(1, "Dispatch is required"),
  location: z.string().optional(),
  status: z.enum(["dispatched", "in_transit", "out_for_delivery", "delivered", "failed"]),
  notes: z.string().optional(),
  deliveredBy: z.string().optional(),
});

// Invoice Schema
export const INVOICE_SCHEMA = z.object({
  orderId: z.string().min(1, "Sales order is required"),
  customerId: z.string().min(1, "Customer is required"),
  date: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

// Type exports for form data
export type CustomerFormData = z.infer<typeof CUSTOMER_SCHEMA>;
export type SalesOrderFormData = z.infer<typeof SALES_ORDER_SCHEMA>;
export type SalesOrderItemFormData = z.infer<typeof SALES_ORDER_ITEM_SCHEMA>;
export type PicklistFormData = z.infer<typeof PICKLIST_SCHEMA>;
export type DispatchFormData = z.infer<typeof DISPATCH_SCHEMA>;
export type DeliveryTrackingFormData = z.infer<typeof DELIVERY_TRACKING_SCHEMA>;
export type InvoiceFormData = z.infer<typeof INVOICE_SCHEMA>;

