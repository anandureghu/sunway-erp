import type { Item, Warehouse, Stock, InventoryMovement, ItemCategory } from "@/types/inventory";

// Sample Categories
export const itemCategories: ItemCategory[] = [
  { id: "cat-1", name: "Raw Materials", description: "Raw materials and components", createdAt: "2025-01-01" },
  { id: "cat-2", name: "Finished Goods", description: "Completed products", createdAt: "2025-01-01" },
  { id: "cat-3", name: "Office Supplies", description: "Office equipment and supplies", createdAt: "2025-01-01" },
  { id: "cat-4", name: "Tools & Equipment", description: "Tools and machinery", createdAt: "2025-01-01" },
];

// Sample Warehouses
export const warehouses: Warehouse[] = [
  {
    id: "wh-1",
    name: "Main Warehouse",
    location: "Chennai, Tamil Nadu",
    address: "123 Industrial Park, Chennai",
    capacity: 10000,
    status: "active",
    createdAt: "2025-01-01",
  },
  {
    id: "wh-2",
    name: "North Warehouse",
    location: "Delhi, NCR",
    address: "456 Business District, Delhi",
    capacity: 8000,
    status: "active",
    createdAt: "2025-01-01",
  },
  {
    id: "wh-3",
    name: "Distribution Center",
    location: "Mumbai, Maharashtra",
    address: "789 Logistics Hub, Mumbai",
    capacity: 12000,
    status: "active",
    createdAt: "2025-01-01",
  },
];

// Sample Items
export const items: Item[] = [
  {
    id: "item-1",
    sku: "SKU-001",
    name: "Cement Bag (50kg)",
    description: "Portland cement, 50kg bag",
    category: "Raw Materials",
    subcategory: "Construction Materials",
    unit: "bag",
    costPrice: 350,
    sellingPrice: 420,
    reorderLevel: 100,
    reorderQuantity: 500,
    status: "active",
    barcode: "1234567890123",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-15",
  },
  {
    id: "item-2",
    sku: "SKU-002",
    name: "Steel Rod (12mm)",
    description: "TMT steel rod, 12mm diameter",
    category: "Raw Materials",
    subcategory: "Construction Materials",
    unit: "kg",
    costPrice: 65,
    sellingPrice: 78,
    reorderLevel: 2000,
    reorderQuantity: 5000,
    status: "active",
    barcode: "1234567890124",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-15",
  },
  {
    id: "item-3",
    sku: "SKU-003",
    name: "Red Bricks",
    description: "Standard red clay bricks",
    category: "Raw Materials",
    subcategory: "Construction Materials",
    unit: "pcs",
    costPrice: 8,
    sellingPrice: 12,
    reorderLevel: 5000,
    reorderQuantity: 20000,
    status: "active",
    barcode: "1234567890125",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-15",
  },
  {
    id: "item-4",
    sku: "SKU-004",
    name: "Paint (Premium White)",
    description: "Premium white paint, 20L bucket",
    category: "Finished Goods",
    subcategory: "Paints",
    unit: "bucket",
    costPrice: 1800,
    sellingPrice: 2400,
    reorderLevel: 50,
    reorderQuantity: 200,
    status: "active",
    barcode: "1234567890126",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-15",
  },
  {
    id: "item-5",
    sku: "SKU-005",
    name: "PVC Pipes (4 inch)",
    description: "PVC water pipes, 4 inch diameter",
    category: "Raw Materials",
    subcategory: "Plumbing",
    unit: "meter",
    costPrice: 150,
    sellingPrice: 195,
    reorderLevel: 500,
    reorderQuantity: 1000,
    status: "active",
    barcode: "1234567890127",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-15",
  },
  {
    id: "item-6",
    sku: "SKU-006",
    name: "Electrical Wire (2.5mm)",
    description: "Copper electrical wire, 2.5mm",
    category: "Raw Materials",
    subcategory: "Electrical",
    unit: "meter",
    costPrice: 45,
    sellingPrice: 60,
    reorderLevel: 1000,
    reorderQuantity: 2500,
    status: "active",
    barcode: "1234567890128",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-15",
  },
];

// Sample Stock
export const stock: Stock[] = [
  {
    id: "stock-1",
    itemId: "item-1",
    warehouseId: "wh-1",
    quantity: 850,
    reservedQuantity: 50,
    availableQuantity: 800,
    batchNo: "BATCH-2025-01",
    lastUpdated: "2025-01-20",
  },
  {
    id: "stock-2",
    itemId: "item-1",
    warehouseId: "wh-2",
    quantity: 450,
    reservedQuantity: 0,
    availableQuantity: 450,
    batchNo: "BATCH-2025-01",
    lastUpdated: "2025-01-19",
  },
  {
    id: "stock-3",
    itemId: "item-2",
    warehouseId: "wh-1",
    quantity: 3200,
    reservedQuantity: 200,
    availableQuantity: 3000,
    batchNo: "BATCH-2025-02",
    lastUpdated: "2025-01-20",
  },
  {
    id: "stock-4",
    itemId: "item-3",
    warehouseId: "wh-1",
    quantity: 12000,
    reservedQuantity: 500,
    availableQuantity: 11500,
    lotNo: "LOT-2025-01",
    lastUpdated: "2025-01-20",
  },
  {
    id: "stock-5",
    itemId: "item-4",
    warehouseId: "wh-1",
    quantity: 85,
    reservedQuantity: 5,
    availableQuantity: 80,
    batchNo: "BATCH-2025-03",
    expiryDate: "2026-12-31",
    lastUpdated: "2025-01-18",
  },
  {
    id: "stock-6",
    itemId: "item-5",
    warehouseId: "wh-2",
    quantity: 650,
    reservedQuantity: 0,
    availableQuantity: 650,
    batchNo: "BATCH-2025-04",
    lastUpdated: "2025-01-19",
  },
  {
    id: "stock-7",
    itemId: "item-6",
    warehouseId: "wh-1",
    quantity: 1800,
    reservedQuantity: 100,
    availableQuantity: 1700,
    batchNo: "BATCH-2025-05",
    lastUpdated: "2025-01-20",
  },
];

// Sample Inventory Movements
export const inventoryMovements: InventoryMovement[] = [
  {
    id: "mov-1",
    itemId: "item-1",
    toWarehouseId: "wh-1",
    quantity: 100,
    moveType: "inbound",
    date: "2025-01-20",
    referenceNo: "PO-001",
    batchNo: "BATCH-2025-01",
    notes: "Received from supplier",
    createdAt: "2025-01-20T10:30:00",
  },
  {
    id: "mov-2",
    itemId: "item-2",
    fromWarehouseId: "wh-1",
    toWarehouseId: "wh-2",
    quantity: 500,
    moveType: "transfer",
    date: "2025-01-19",
    batchNo: "BATCH-2025-02",
    notes: "Inter-warehouse transfer",
    createdAt: "2025-01-19T14:20:00",
  },
  {
    id: "mov-3",
    itemId: "item-3",
    fromWarehouseId: "wh-1",
    quantity: 2000,
    moveType: "outbound",
    date: "2025-01-18",
    referenceNo: "SO-001",
    notes: "Shipped to customer",
    createdAt: "2025-01-18T09:15:00",
  },
];

// Helper function to get stock with item and warehouse details
export function getStockWithDetails(): (Stock & { item: Item; warehouse: Warehouse })[] {
  return stock.map((s) => {
    const item = items.find((i) => i.id === s.itemId);
    const warehouse = warehouses.find((w) => w.id === s.warehouseId);
    return {
      ...s,
      item: item!,
      warehouse: warehouse!,
    };
  });
}

// Helper function to search items by SKU, barcode, or name
export function searchItems(query: string): Item[] {
  const lowerQuery = query.toLowerCase();
  return items.filter(
    (item) =>
      item.sku.toLowerCase().includes(lowerQuery) ||
      item.name.toLowerCase().includes(lowerQuery) ||
      item.barcode?.toLowerCase().includes(lowerQuery) ||
      item.rfidTag?.toLowerCase().includes(lowerQuery)
  );
}

