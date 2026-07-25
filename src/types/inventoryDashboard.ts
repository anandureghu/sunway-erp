export interface InventoryDashboardKpis {
  distinctSkuCount: number;
  totalQuantityOnHand: number;
  totalAvailable: number;
  totalReserved: number;
  totalOnOrder: number;
  lowStockCount: number;
  openSalesQuotations: number;
  openPurchaseOrders: number;
  goodsReceiptsAwaitingInspection: number;
  goodsReceiptsReadyToReceive: number;
}

export interface InventoryStockByWarehouse {
  warehouseId: number;
  warehouseName: string;
  onHand: number;
  reserved: number;
  available: number;
  valueAtCost: number;
}

export interface InventoryLowStockItem {
  itemId: number;
  sku: string;
  name: string;
  warehouseId: number;
  warehouseName: string;
  available: number;
  reorderLevel: number;
}

export interface InventorySalesPipeline {
  quotations: number;
  confirmed: number;
  shipmentsInTransit: number;
  deliveredThisMonth: number;
}

export interface InventoryPurchasePipeline {
  requisitionsSubmitted: number;
  purchaseOrdersDraft: number;
  purchaseOrdersApproved: number;
  purchaseOrdersConfirmed: number;
  goodsReceiptsPendingInspection: number;
  goodsReceiptsReadyToReceive: number;
}

export interface InventoryDashboardAlert {
  type: string;
  message: string;
  count: number;
  amount: number;
}

export interface InventoryDashboard {
  kpis: InventoryDashboardKpis;
  stockByWarehouse: InventoryStockByWarehouse[];
  lowStockItems: InventoryLowStockItem[];
  salesPipeline: InventorySalesPipeline;
  purchasePipeline: InventoryPurchasePipeline;
  alerts: InventoryDashboardAlert[];
  generatedAt: string;
}
