import {
  DashboardCardSkeletonGrid,
  DashboardCountListCard,
  DashboardProgressListCard,
  compactNumber,
} from "@/components/dashboard";
import { formatMoney } from "@/lib/utils";
import type {
  InventoryPurchasePipeline,
  InventorySalesPipeline,
  InventoryStockByWarehouse,
} from "@/types/inventoryDashboard";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  PackageCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

export function InventoryDashboardPipelines({
  stockByWarehouse,
  salesPipeline,
  purchasePipeline,
  currencyCode,
  loading,
}: {
  stockByWarehouse: InventoryStockByWarehouse[];
  salesPipeline: InventorySalesPipeline | null;
  purchasePipeline: InventoryPurchasePipeline | null;
  currencyCode?: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <DashboardCardSkeletonGrid
        count={3}
        className="md:grid-cols-2 xl:grid-cols-3"
        cardClassName="h-[320px] rounded-xl"
      />
    );
  }

  const maxOnHand = Math.max(1, ...stockByWarehouse.map((w) => w.onHand));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <DashboardProgressListCard
        title="Stock by Warehouse"
        description="On-hand quantity and inventory value"
        viewAllTo="/inventory/stocks"
        emptyMessage="No warehouse stock yet."
        rows={stockByWarehouse.map((w) => ({
          id: w.warehouseId,
          label: w.warehouseName,
          percent: (w.onHand / maxOnHand) * 100,
          leftHint: `On hand ${compactNumber(w.onHand)} · Avail ${compactNumber(w.available)}`,
          rightHint: formatMoney(w.valueAtCost, currencyCode),
        }))}
      />

      <DashboardCountListCard
        title="Sales Pipeline"
        description="Quotations through delivery"
        viewAllTo="/inventory/sales"
        items={[
          {
            key: "quotations",
            label: "Quotations",
            count: salesPipeline?.quotations ?? 0,
            icon: FileText,
            color: "bg-violet-100 text-violet-700",
            to: "/inventory/sales",
          },
          {
            key: "confirmed",
            label: "Confirmed Orders",
            count: salesPipeline?.confirmed ?? 0,
            icon: CheckCircle2,
            color: "bg-blue-100 text-blue-700",
            to: "/inventory/sales",
          },
          {
            key: "in-transit",
            label: "Shipments In Transit",
            count: salesPipeline?.shipmentsInTransit ?? 0,
            icon: Truck,
            color: "bg-amber-100 text-amber-800",
            to: "/inventory/sales",
          },
          {
            key: "delivered",
            label: "Delivered This Month",
            count: salesPipeline?.deliveredThisMonth ?? 0,
            icon: PackageCheck,
            color: "bg-emerald-100 text-emerald-700",
            to: "/inventory/sales",
          },
        ]}
      />

      <DashboardCountListCard
        title="Purchase Pipeline"
        description="Requisitions through receiving"
        viewAllTo="/inventory/purchase"
        items={[
          {
            key: "pr",
            label: "Requisitions Submitted",
            count: purchasePipeline?.requisitionsSubmitted ?? 0,
            icon: ClipboardList,
            color: "bg-violet-100 text-violet-700",
            to: "/inventory/purchase/requisitions",
          },
          {
            key: "po-draft",
            label: "POs Draft",
            count: purchasePipeline?.purchaseOrdersDraft ?? 0,
            icon: FileText,
            color: "bg-slate-100 text-slate-700",
            to: "/inventory/purchase/orders",
          },
          {
            key: "po-approved",
            label: "POs Approved",
            count: purchasePipeline?.purchaseOrdersApproved ?? 0,
            icon: CheckCircle2,
            color: "bg-blue-100 text-blue-700",
            to: "/inventory/purchase/orders",
          },
          {
            key: "po-confirmed",
            label: "POs Confirmed",
            count: purchasePipeline?.purchaseOrdersConfirmed ?? 0,
            icon: ShoppingCart,
            color: "bg-sky-100 text-sky-700",
            to: "/inventory/purchase/orders",
          },
          {
            key: "gr-inspect",
            label: "GR Pending Inspection",
            count: purchasePipeline?.goodsReceiptsPendingInspection ?? 0,
            icon: PackageCheck,
            color: "bg-amber-100 text-amber-800",
            to: "/inventory/purchase/receiving",
          },
          {
            key: "gr-ready",
            label: "GR Ready to Receive",
            count: purchasePipeline?.goodsReceiptsReadyToReceive ?? 0,
            icon: Truck,
            color: "bg-emerald-100 text-emerald-700",
            to: "/inventory/purchase/receiving",
          },
        ]}
      />
    </div>
  );
}
