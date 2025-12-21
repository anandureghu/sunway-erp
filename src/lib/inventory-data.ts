import type {
  Item,
  Warehouse,
  Stock,
  InventoryMovement,
  ItemCategory,
} from "@/types/inventory";

// Sample Categories
export const itemCategories: ItemCategory[] = [
  {
    id: "cat-1",
    name: "Raw Materials",
    description: "Raw materials and components",
    createdAt: "2025-01-01",
  },
  {
    id: "cat-2",
    name: "Finished Goods",
    description: "Completed products",
    createdAt: "2025-01-01",
  },
  {
    id: "cat-3",
    name: "Office Supplies",
    description: "Office equipment and supplies",
    createdAt: "2025-01-01",
  },
  {
    id: "cat-4",
    name: "Tools & Equipment",
    description: "Tools and machinery",
    createdAt: "2025-01-01",
  },
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
    itemType: "Raw Material",
    category: "Raw Materials",
    subcategory: "Construction Materials",
    brand: "UltraTech",
    unit: "bag",
    costPrice: 350,
    sellingPrice: 420,
    reorderLevel: 100,
    maximum: 2000,
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
    itemType: "Raw Material",
    category: "Raw Materials",
    subcategory: "Construction Materials",
    brand: "JSW Steel",
    unit: "kg",
    costPrice: 65,
    sellingPrice: 78,
    reorderLevel: 2000,
    maximum: 10000,
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
    itemType: "Raw Material",
    category: "Raw Materials",
    subcategory: "Construction Materials",
    brand: "Local",
    unit: "pcs",
    costPrice: 8,
    sellingPrice: 12,
    reorderLevel: 5000,
    maximum: 50000,
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
    itemType: "Finished Good",
    category: "Finished Goods",
    subcategory: "Paints",
    brand: "Asian Paints",
    unit: "bucket",
    costPrice: 1800,
    sellingPrice: 2400,
    reorderLevel: 50,
    maximum: 500,
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
    itemType: "Raw Material",
    category: "Raw Materials",
    subcategory: "Plumbing",
    brand: "Finolex",
    unit: "meter",
    costPrice: 150,
    sellingPrice: 195,
    reorderLevel: 500,
    maximum: 5000,
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
    itemType: "Raw Material",
    category: "Raw Materials",
    subcategory: "Electrical",
    brand: "Havells",
    unit: "meter",
    costPrice: 45,
    sellingPrice: 60,
    reorderLevel: 1000,
    maximum: 10000,
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
    quantity: 850,
    reservedQuantity: 50,
    availableQuantity: 800,
    batchNo: "BATCH-2025-01",
    serialNo: "SN-001-2025",
    dateReceived: "2025-01-15",
    saleByDate: "2026-01-15",
    lastUpdated: "2025-01-20",
    updatedBy: "Admin User",
  },
  {
    id: "stock-2",
    itemId: "item-1",
    quantity: 450,
    reservedQuantity: 0,
    availableQuantity: 450,
    batchNo: "BATCH-2025-01",
    serialNo: "SN-002-2025",
    dateReceived: "2025-01-10",
    saleByDate: "2026-01-10",
    lastUpdated: "2025-01-19",
    updatedBy: "Warehouse Manager",
  },
  {
    id: "stock-3",
    itemId: "item-2",
    quantity: 3200,
    reservedQuantity: 200,
    availableQuantity: 3000,
    batchNo: "BATCH-2025-02",
    serialNo: "SN-003-2025",
    dateReceived: "2025-01-12",
    saleByDate: "2027-01-12",
    lastUpdated: "2025-01-20",
    updatedBy: "Admin User",
  },
  {
    id: "stock-4",
    itemId: "item-3",
    quantity: 12000,
    reservedQuantity: 500,
    availableQuantity: 11500,
    lotNo: "LOT-2025-01",
    serialNo: "SN-004-2025",
    dateReceived: "2025-01-08",
    saleByDate: "2026-01-08",
    lastUpdated: "2025-01-20",
    updatedBy: "Admin User",
  },
  {
    id: "stock-5",
    itemId: "item-4",
    quantity: 85,
    reservedQuantity: 5,
    availableQuantity: 80,
    batchNo: "BATCH-2025-03",
    serialNo: "SN-005-2025",
    expiryDate: "2026-12-31",
    dateReceived: "2025-01-05",
    saleByDate: "2026-12-31",
    lastUpdated: "2025-01-18",
    updatedBy: "Warehouse Manager",
  },
  {
    id: "stock-6",
    itemId: "item-5",
    quantity: 650,
    reservedQuantity: 0,
    availableQuantity: 650,
    batchNo: "BATCH-2025-04",
    serialNo: "SN-006-2025",
    dateReceived: "2025-01-14",
    saleByDate: "2027-01-14",
    lastUpdated: "2025-01-19",
    updatedBy: "Warehouse Manager",
  },
  {
    id: "stock-7",
    itemId: "item-6",
    quantity: 1800,
    reservedQuantity: 100,
    availableQuantity: 1700,
    batchNo: "BATCH-2025-05",
    serialNo: "SN-007-2025",
    dateReceived: "2025-01-11",
    saleByDate: "2027-01-11",
    lastUpdated: "2025-01-20",
    updatedBy: "Admin User",
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
export function getStockWithDetails(): (Stock & {
  item: Item;
  warehouse: Warehouse;
})[] {
  return stock.map((s) => {
    const item = items.find((i) => i.id === s.itemId);
    const warehouse = warehouses.find(
      (w) => w.id === s.warehouse_id?.toString()
    );
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

// Helper function to add a new item
export function addItem(item: Item): Item {
  items.push(item);
  return item;
}
