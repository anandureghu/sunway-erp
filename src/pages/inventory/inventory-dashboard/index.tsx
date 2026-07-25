import {
  DashboardErrorBanner,
  DashboardPageHeader,
  useDashboardQuery,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { getInventoryDashboard } from "@/service/inventoryDashboardService";
import { LayoutDashboard } from "lucide-react";
import { useCallback } from "react";
import { InventoryDashboardKpisPanel } from "./inventory-dashboard-kpis";
import { InventoryDashboardLists } from "./inventory-dashboard-lists";
import { InventoryDashboardPipelines } from "./inventory-dashboard-pipelines";

export default function InventoryDashboardPage() {
  const { company } = useAuth();
  const currencyCode = company?.currency?.currencyCode;
  const fetcher = useCallback(() => getInventoryDashboard(), []);
  const { data, loading, error, refresh } = useDashboardQuery(
    fetcher,
    "Could not load inventory dashboard",
  );

  const companyName = company?.companyName ?? "your company";

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Inventory Dashboard"
        description={`Welcome back! Here's the stock and operations overview of ${companyName}`}
        variant="darkBlue"
        icon={<LayoutDashboard className="h-6 w-6" />}
        generatedAt={data?.generatedAt}
        loading={loading}
        onRefresh={() => void refresh()}
      />

      {error && !loading ? (
        <DashboardErrorBanner
          message={error}
          onRetry={() => void refresh()}
        />
      ) : null}

      <InventoryDashboardKpisPanel
        kpis={data?.kpis ?? null}
        loading={loading}
      />

      <InventoryDashboardPipelines
        stockByWarehouse={data?.stockByWarehouse ?? []}
        salesPipeline={data?.salesPipeline ?? null}
        purchasePipeline={data?.purchasePipeline ?? null}
        currencyCode={currencyCode}
        loading={loading}
      />

      <InventoryDashboardLists
        lowStockItems={data?.lowStockItems ?? []}
        alerts={data?.alerts ?? []}
        loading={loading}
      />
    </div>
  );
}
