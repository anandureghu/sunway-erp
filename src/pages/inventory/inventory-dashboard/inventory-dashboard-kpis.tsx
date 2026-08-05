import { DashboardKpiSkeleton } from "@/components/dashboard";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import type { InventoryDashboardKpis } from "@/types/inventoryDashboard";
import {
  AlertTriangle,
  Boxes,
  ClipboardCheck,
  Package,
  PackageCheck,
  PackageOpen,
  ShoppingCart,
  Truck,
  Warehouse,
} from "lucide-react";

export function InventoryDashboardKpisPanel({
  kpis,
  loading,
}: {
  kpis: InventoryDashboardKpis | null;
  loading: boolean;
}) {
  if (loading || !kpis) {
    return <DashboardKpiSkeleton count={10} className="xl:grid-cols-5" />;
  }

  const fmtQty = (n: number) => (Number.isFinite(n) ? n.toLocaleString() : "0");

  return (
    <KpiSummaryStrip
      className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      items={[
        {
          label: "SKUs in Stock",
          value: fmtQty(kpis.distinctSkuCount),
          hint: "Distinct items on hand",
          accent: "violet",
          icon: Package,
        },
        {
          label: "Qty On Hand",
          value: fmtQty(kpis.totalQuantityOnHand),
          hint: "All warehouses",
          accent: "blue",
          icon: Boxes,
        },
        {
          label: "Available",
          value: fmtQty(kpis.totalAvailable),
          hint: "Ready to allocate",
          accent: "emerald",
          icon: PackageCheck,
        },
        {
          label: "Reserved",
          value: fmtQty(kpis.totalReserved),
          hint: "Committed to orders",
          accent: "amber",
          icon: PackageOpen,
        },
        {
          label: "On Order",
          value: fmtQty(kpis.totalOnOrder),
          hint: "Remaining inbound PO qty",
          accent: "sky",
          icon: Truck,
        },
        {
          label: "Low Stock",
          value: fmtQty(kpis.lowStockCount),
          hint: "At or below reorder",
          accent: kpis.lowStockCount > 0 ? "rose" : "slate",
          icon: AlertTriangle,
        },
        {
          label: "Open Quotations",
          value: fmtQty(kpis.openSalesQuotations),
          hint: "Sales pipeline",
          accent: "violet",
          icon: ShoppingCart,
        },
        {
          label: "Open POs",
          value: fmtQty(kpis.openPurchaseOrders),
          hint: "Purchase pipeline",
          accent: "orange",
          icon: ClipboardCheck,
        },
        {
          label: "Ready for Inspection",
          value: fmtQty(kpis.goodsReceiptsAwaitingInspection),
          hint: "Goods receipts",
          accent: "amber",
          icon: Warehouse,
        },
        {
          label: "Confirmed - Ready to Receive",
          value: fmtQty(kpis.goodsReceiptsReadyToReceive),
          hint: "Goods receipts",
          accent: "emerald",
          icon: PackageCheck,
        },
      ]}
    />
  );
}
