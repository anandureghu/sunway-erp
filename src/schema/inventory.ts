import { z } from "zod";
export const ITEM_SCHEMA = z
  .object({
    id: z.string().optional(),

    sku: z.string().optional(),
    name: z.string().min(1),
    itemType: z.string().optional(),
    category: z.string().min(1),
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    description: z.string().optional(),

    unit: z
      .enum([
        "pcs",
        "kg",
        "g",
        "box",
        "pallet",
        "liter",
        "meter",
        "carton",
        "bag",
        "bucket",
      ])
      .optional(),

    warehouse: z.number().min(1),

    quantity: z.number().optional(),
    reorderLevel: z.number().optional(),

    costPrice: z.number().min(0),
    sellingPrice: z.number().min(0),

    status: z.enum(["active", "discontinued", "out_of_stock"]),

    barcode: z.string().optional(),
    image: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    const isEdit = !!data.id;

    if (!isEdit) {
      if (!data.sku) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SKU is required",
          path: ["sku"],
        });
      }

      if (!data.unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Unit is required",
          path: ["unit"],
        });
      }

      if (data.quantity === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Initial quantity is required",
          path: ["quantity"],
        });
      }

      if (data.reorderLevel === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reorder level is required",
          path: ["reorderLevel"],
        });
      }
    }
  });

// Warehouse Schema
export const WAREHOUSE_SCHEMA = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  address: z.string().optional(),
  capacity: z.number().min(0).optional(),
  status: z.enum(["active", "inactive"]),
  city: z.string(),
  street: z.string(),
  country: z.string(),
  pin: z.string(),
  phone: z.string(),
  contactPersonName: z.string(),
  manager: z.number(),
});

// Receive Item Schema
export const RECEIVE_ITEM_SCHEMA = z.object({
  itemId: z.string().min(1, "Item is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantityReceived: z
    .number()
    .min(0.01, "Quantity received must be greater than 0"),
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
  adjustmentType: z.enum([
    "damaged",
    "expired",
    "wastage",
    "found",
    "theft",
    "other",
  ]),
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
export type ItemFormValues = z.infer<typeof ITEM_SCHEMA>;
export type WarehouseFormData = z.infer<typeof WAREHOUSE_SCHEMA>;
export type ReceiveItemFormData = z.infer<typeof RECEIVE_ITEM_SCHEMA>;
export type StockTransferFormData = z.infer<typeof STOCK_TRANSFER_SCHEMA>;
export type StockAdjustmentFormData = z.infer<typeof STOCK_ADJUSTMENT_SCHEMA>;
export type CategoryFormData = z.infer<typeof CATEGORY_SCHEMA>;
