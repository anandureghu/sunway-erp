// Minimal DTO typings extracted from `https://api.picominds.com/v3/api-docs`
// Keep this file focused on the modules we use in the UI (Inventory + Sales flow).

import type { Warehouse } from "@/types/inventory";

export type Id = number; // OpenAPI uses int64 for most IDs

// --- Auth ---
export type JwtResponse = {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
};

export type LoginRequest = {
  loginId: string;
  password: string;
};

// --- Customers ---
export type CustomerResponseDTO = {
  id: Id;
  customerName?: string;
  contactPersonName?: string;
  phoneNo?: string;
  email?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  active?: boolean;
  customerType?: string;
};

// --- Inventory (master data) ---
export type CategoryResponseDTO = {
  id: Id;
  code?: string;
  name?: string;
  status?: string;
  parentId?: Id;
  subCategories?: CategoryResponseDTO[];
};

export type CategoryCreateDTO = {
  code?: string;
  name?: string;
  status?: string;
  parentId?: Id;
};

export type CategoryUpdateDTO = {
  name?: string;
  status?: string;
};

export type WarehouseResponseDTO = {
  id: Id;

  // Core identity
  code: string;
  name: string;
  status: "active" | "inactive";

  // Address
  street?: string;
  city?: string;
  country?: string;
  pin?: string;

  // Contact
  phone?: string;
  contactPersonName?: string;

  // Manager
  managerId?: Id;
  managerName?: string;

  // Computed / display
  location?: string;
};

export type WarehouseCreateDTO = {
  code?: string;
  name?: string;
  location?: string;
  status?: string;
};

export type WarehouseUpdateDTO = {
  name?: string;
  location?: string;
  status?: string;
};

export type ItemResponseDTO = {
  id: Id;
  sku?: string;
  name?: string;
  type?: string; // Item type
  category?: string;
  subCategory?: string;
  brand?: string;
  quantity?: number;
  available?: number;
  reserved?: number;
  costPrice?: number;
  sellingPrice?: number;
  unitMeasure?: string; // Unit of measure
  reorderLevel?: number;
  minimum?: number;
  maximum?: number;
  barcode?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;

  warehouse_id?: number;
  warehouse_name?: number;
  warehouse_location?: number;
  imageUrl?: string;
};

export type ItemCreateDTO = {
  sku?: string;
  name?: string;
  type?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  location?: string;
  quantity?: number;
  minimum?: number;
  maximum?: number;
  barcode?: string;
  serialNo?: string;
  costPrice?: number;
  sellingPrice?: number;
  unitMeasure?: string;
  reorderLevel?: number;
  status?: string;
  imageUrl?: string;
  description?: string;
  image?: File | null;
};

export type ItemUpdateDTO = {
  name?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  location?: string;
  quantity?: number;
  minimum?: number;
  maximum?: number;
  costPrice?: number;
  sellingPrice?: number;
  status?: string;
  imageUrl?: string;
  description?: string;
};

// --- Sales flow ---
export type SalesOrderItemDTO = {
  itemId?: Id;
  quantity?: number; // int32
  unitPrice?: number; // double
};

export type SalesOrderCreateDTO = {
  customerId?: Id;
  orderDate?: string; // date
  items?: SalesOrderItemDTO[];
};

export type SalesOrderUpdateDTO = {
  orderDate?: string; // date
  items?: SalesOrderItemDTO[];
};

export type SalesOrderItemResponseDTO = {
  itemId?: Id;
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  warehouseName?: string;
  warehouseId?: number;
};

export type SalesOrderResponseDTO = {
  id: Id;
  orderNumber?: string;
  customerId?: Id;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDate?: string; // date
  status?: string;
  totalAmount?: number;
  items?: SalesOrderItemResponseDTO[];
};

export type PicklistItemDTO = {
  itemId?: Id;
  quantity?: number;
  itemName?: string;
};

export type PicklistResponseDTO = {
  id: Id;
  picklistNumber?: string;
  salesOrderId?: Id;
  status?: string;
  createdAt?: string;
  items?: PicklistItemDTO[];
  warehouseId?: number;
  warehouse?: Warehouse;
};

export type ShipmentItemDTO = {
  itemId?: Id;
  quantity?: number;
};

export type ShipmentCreateDTO = {
  carrierName?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  estimatedDeliveryDate?: string;
  deliveryAddress?: string;
  notes?: string;
};

export type ShipmentResponseDTO = {
  id: Id;
  shipmentNumber?: string;
  picklistId?: Id;
  customerId?: Id;
  status?: string;
  carrierName?: string;
  trackingNumber?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  items?: ShipmentItemDTO[];
};
