// Inventory Types

export type ItemStatus = "active" | "discontinued" | "out_of_stock";
export type MovementType = "inbound" | "outbound" | "transfer" | "adjustment" | "return";
export type Unit = "pcs" | "kg" | "g" | "box" | "pallet" | "liter" | "meter" | "carton" | "bag" | "bucket" | string;

// Items
export type Item = {
  id: string;
  sku: string; // Stock Keeping Unit - for barcode/RFID support
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: Unit;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  reorderQuantity?: number;
  status: ItemStatus;
  barcode?: string; // Barcode support
  rfidTag?: string; // RFID support
  createdAt: string;
  updatedAt: string;
};

// Warehouse
export type Warehouse = {
  id: string;
  name: string;
  location: string;
  address?: string;
  capacity?: number;
  status: "active" | "inactive";
  createdAt: string;
};

// Stock (multi-location support)
export type Stock = {
  id: string;
  itemId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity?: number; // Reserved for orders
  availableQuantity: number; // quantity - reservedQuantity
  batchNo?: string; // For batch tracking
  lotNo?: string; // For lot tracking
  serialNo?: string; // For serial number tracking
  expiryDate?: string; // For expiry tracking
  lastUpdated: string;
  // Computed fields from joins
  item?: Item;
  warehouse?: Warehouse;
};

// Inventory Movements
export type InventoryMovement = {
  id: string;
  itemId: string;
  fromWarehouseId?: string; // null for inbound/receipt
  toWarehouseId?: string; // null for outbound/shipment
  quantity: number;
  moveType: MovementType;
  date: string;
  referenceNo?: string; // Link to PO/SO
  batchNo?: string;
  lotNo?: string;
  serialNo?: string;
  notes?: string;
  userId?: string; // Who made the movement
  createdAt: string;
  // Computed fields
  item?: Item;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
};

// Stock Adjustment (Variance)
export type StockAdjustment = {
  id: string;
  itemId: string;
  warehouseId: string;
  quantityBefore: number;
  quantityAfter: number;
  adjustmentQuantity: number; // difference
  reason: string;
  adjustmentType: "damaged" | "expired" | "wastage" | "found" | "theft" | "other";
  date: string;
  approvedBy?: string;
  notes?: string;
  // Computed fields
  item?: Item;
  warehouse?: Warehouse;
};

// Item Category
export type ItemCategory = {
  id: string;
  name: string;
  description?: string;
  parentId?: string; // For hierarchical categories
  createdAt: string;
};

