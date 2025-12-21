import { z } from "zod";

// Item Schema
export const ITEM_SCHEMA = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  itemType: z.string().optional(), // Item Type (e.g., Raw Material, Finished Good)
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  brand: z.string().optional(), // Brand name
  unit: z.enum(["pcs", "kg", "g", "box", "pallet", "liter", "meter", "carton", "bag", "bucket"]),
  location: z.string().min(1, "Warehouse location is required"), // Warehouse
  quantity: z.number().min(0, "Quantity must be positive"), // Initial quantity
  costPrice: z.number().min(0, "Cost price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  reorderLevel: z.number().min(0, "Reorder level must be positive"),
  reorderQuantity: z.number().min(0).optional(),
  status: z.enum(["active", "discontinued", "out_of_stock"]),
  barcode: z.string().optional(),
  rfidTag: z.string().optional(),
});

// Warehouse Schema
export const WAREHOUSE_SCHEMA = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  location: z.string().min(1, "Location is required"),
  status: z.enum(["active", "inactive"]),
});

// Receive Item Schema
export const RECEIVE_ITEM_SCHEMA = z.object({
  itemId: z.string().min(1, "Item is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantityReceived: z.number().min(0.01, "Quantity received must be greater than 0"),
  receivedDate: z.string().min(1, "Received date is required"),
  batchNo: z.string().optional(),
  serialNo: z.string().optional(),
  referenceNo: z.string().optional(), // PO number
  costPrice: z.number().min(0, "Cost price must be positive").optional(),
  unitPrice: z.number().min(0, "Unit price must be positive").optional(),
  notes: z.string().optional(),
});

// Stock Transfer Schema
export const STOCK_TRANSFER_SCHEMA = z.object({
  itemId: z.string().min(1, "Item is required"),
  fromWarehouseId: z.string().min(1, "Source warehouse is required"),
  toWarehouseId: z.string().min(1, "Destination warehouse is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  transferDate: z.string().min(1, "Transfer date is required"),
  batchNo: z.string().optional(),
  notes: z.string().optional(),
});

// Stock Adjustment Schema
export const STOCK_ADJUSTMENT_SCHEMA = z.object({
  itemId: z.string().min(1, "Item is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  adjustmentQuantity: z.number().refine((val) => val !== 0, {
    message: "Adjustment quantity cannot be zero",
  }),
  newQuantity: z.number().min(0).optional(), // Optional: can adjust by quantity or set new quantity
  reason: z.string().min(1, "Reason is required"),
  adjustmentType: z.enum(["damaged", "expired", "wastage", "found", "theft", "other"]),
  adjustmentDate: z.string().min(1, "Adjustment date is required"),
  notes: z.string().optional(),
});

// Category Schema
export const CATEGORY_SCHEMA = z.object({
  name: z.string().min(1, "Category name is required"),
  parentId: z.string().optional(), // For subcategories
  status: z.enum(["active", "inactive"]),
});

// Export types from schemas
export type ItemFormData = z.infer<typeof ITEM_SCHEMA>;
export type WarehouseFormData = z.infer<typeof WAREHOUSE_SCHEMA>;
export type ReceiveItemFormData = z.infer<typeof RECEIVE_ITEM_SCHEMA>;
export type StockTransferFormData = z.infer<typeof STOCK_TRANSFER_SCHEMA>;
export type StockAdjustmentFormData = z.infer<typeof STOCK_ADJUSTMENT_SCHEMA>;
export type CategoryFormData = z.infer<typeof CATEGORY_SCHEMA>;

