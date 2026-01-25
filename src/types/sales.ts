import type { Item, Warehouse } from "./inventory";

// Customer Types
export type Customer = {
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
  creditLimit?: number;
  paymentTerms?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt?: string;
};

// Sales Order Types
export type SalesOrderStatus =
  | "draft"
  | "confirmed"
  | "picked"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type SalesOrderItem = {
  id: string;
  orderId: string;
  itemId: string;
  itemName?: string;
  item?: Item;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  warehouseId?: number;
  warehouseName?: string;
  reservedQuantity?: number;
};

export type SalesOrder = {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderDate: string;
  requiredDate?: string;
  status: SalesOrderStatus;
  items: SalesOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress?: string;
  notes?: string;
  salesPerson?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

// Picklist Types
export type PicklistStatus =
  | "created"
  | "picked"
  | "cancelled"
  | "completed"
  | "in_progress"
  | "on_hold";

export type PicklistItem = {
  id: string;
  picklistId: string;
  orderItemId: string;
  itemId: string;
  item?: Item;
  quantity: number;
  pickedQuantity?: number;
  location?: string;
  batchNo?: string;
  lotNo?: string;
  warehouse?: Warehouse;
  warehouseId?: number;
};

export type Picklist = {
  id: string;
  picklistNo: string;
  orderId: string;
  order?: SalesOrder;
  warehouseId: string;
  warehouse?: Warehouse;
  status: PicklistStatus;
  items: PicklistItem[];
  assignedTo?: string;
  startTime?: string;
  completedTime?: string;
  createdAt: string;
  updatedAt?: string;
};

// Dispatch Types
export type DispatchStatus =
  | "created"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type Dispatch = {
  id: string;
  dispatchNo: string;
  orderId: string;
  order?: SalesOrder;
  picklistId: string;
  picklist?: Picklist;
  vehicleId?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  status: DispatchStatus;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryAddress: string;
  trackingNumber?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
};

// Delivery Tracking Types
export type DeliveryTrackingStatus =
  | "dispatched"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed";

export type DeliveryTracking = {
  id: string;
  dispatchId: string;
  dispatch?: Dispatch;
  location?: string;
  status: DeliveryTrackingStatus;
  timestamp: string;
  notes?: string;
  signature?: string; // URL to signature image
  deliveredBy?: string;
  createdAt: string;
};

// Invoice Types
export type InvoiceStatus = "Paid" | "Unpaid" | "Overdue" | "Partially Paid";

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  itemId: string;
  item?: Item;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
};

// export type Invoice = {
//   id?: string;
//   invoiceNo?: string;
//   orderId?: string;
//   order?: SalesOrder;
//   customerId?: string;
//   customer?: Customer;
//   customerName?: string;
//   date?: string;
//   dueDate?: string;
//   items?: InvoiceItem[];
//   subtotal?: number;
//   tax?: number;
//   discount?: number;
//   total?: number;
//   paidAmount?: number;
//   status?: InvoiceStatus;
//   paymentTerms?: string;
//   notes?: string;
//   createdAt?: string;
//   updatedAt?: string;
//   amount?: number;
// };

export type Invoice = {
  id: number;
  invoiceId: string;

  companyId: number;
  companyName: string;

  type: "SALES" | "PURCHASE" | string;
  orderId?: number;

  toParty: string;
  partyClassification: string;

  status: string;

  invoiceDate: string; // ISO string
  dueDate: string;
  paidDate?: string;

  amount: number;
  openAmount: number;
  outstanding: number;

  itemDescription?: string;
  notesRemarks?: string;

  gracePeriod?: number;
  interestRate?: number;

  creditAccountId?: number;
  debitAccountId?: number;
  creditAccountName?: string;
  debitAccountName?: string;

  pdfUrl?: string;

  createdAt: string;
};
