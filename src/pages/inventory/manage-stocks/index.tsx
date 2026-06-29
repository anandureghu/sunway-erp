import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowRightLeft, LayoutGrid, Package, PackagePlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReceiveItemTab } from "./components/receive-item-tab";
import { StockListTab } from "./components/stock-list-tab";
import { StockStatsCards } from "./components/stock-stats-cards";
import { VarianceTab } from "./components/variance-tab";
import { useManageStocks } from "./use-manage-stocks";
import { PageHeader } from "@/components/PageHeader";
import { useModulePermission } from "@/hooks/use-module-permission";
import { InventoryModule } from "@/lib/module-permissions";

export default function ManageStocks() {
  const navigate = useNavigate();
  const stockCaps = useModulePermission(InventoryModule.STOCK);
  const itemCaps = useModulePermission(InventoryModule.ITEM);
  const canViewStock = stockCaps.canView || itemCaps.canView;
  const canReceive = stockCaps.canCreate || stockCaps.canEdit;
  const canManageVariances =
    stockCaps.canCreate || stockCaps.canEdit || stockCaps.canApprove;
  const [activeTab, setActiveTab] = useState("stock");
  const {
    items,
    warehouses,
    loading,
    loadError,
    refetch,
    selectedWarehouse,
    setSelectedWarehouse,
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    filteredStock,
    stats,
  } = useManageStocks();

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50/90 via-background to-background dark:from-muted/15">
      <div className="mx-auto space-y-8 p-6">
        {/* Page hero */}
        <PageHeader
          title="Manage Stocks"
          description="View and manage your stock inventory"
          variant="darkBlue"
          icon={<Package className="w-6 h-6" />}
        />

        <StockStatsCards
          totalItems={stats.totalItems}
          lowStockItems={stats.lowStockItems}
          onOrderCount={stats.onOrderCount}
          onReserveCount={stats.onReserveCount}
        />

        <Card className="overflow-hidden border-border/80 shadow-md p-0">
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                void refetch();
              }}
              className="w-full gap-0 p-0"
            >
              <div className="border-b border-border/60 bg-muted/20 px-3 py-4 sm:px-5">
                <TabsList
                  className={cn(
                    "grid h-auto w-full grid-cols-1 gap-2 rounded-xl border border-border/50 bg-background/80 p-1.5 shadow-inner",
                    canReceive && canManageVariances
                      ? "sm:grid-cols-3"
                      : canReceive || canManageVariances
                        ? "sm:grid-cols-2"
                        : "sm:grid-cols-1",
                  )}
                >
                  {canViewStock && (
                    <TabsTrigger
                      value="stock"
                      className="gap-2 py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      <LayoutGrid className="h-4 w-4 shrink-0" />
                      <span className="truncate">Stock catalog</span>
                    </TabsTrigger>
                  )}
                  {canReceive && (
                    <TabsTrigger
                      value="receive"
                      className="gap-2 py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      <PackagePlus className="h-4 w-4 shrink-0" />
                      <span className="truncate">Receive goods</span>
                    </TabsTrigger>
                  )}
                  {canManageVariances && (
                    <TabsTrigger
                      value="variances"
                      className="gap-2 py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      <ArrowRightLeft className="h-4 w-4 shrink-0" />
                      <span className="truncate">Variances</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="px-4 pb-6 pt-2 sm:px-6 sm:pb-8">
                {canViewStock && (
                <TabsContent value="stock" className="mt-0 outline-none">
                  <StockListTab
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    selectedWarehouse={selectedWarehouse}
                    onSelectedWarehouseChange={setSelectedWarehouse}
                    selectedStatus={selectedStatus}
                    onSelectedStatusChange={setSelectedStatus}
                    warehouses={warehouses}
                    loading={loading}
                    loadError={loadError}
                    filteredStock={filteredStock}
                    onRowNavigate={(row) =>
                      navigate(`/inventory/stocks/${row.id}`)
                    }
                  />
                </TabsContent>
                )}

                {canReceive && (
                <TabsContent value="receive" className="mt-0 outline-none">
                  <ReceiveItemTab
                    items={items}
                    warehouses={warehouses}
                    onStockUpdated={refetch}
                  />
                </TabsContent>
                )}

                {canManageVariances && (
                <TabsContent value="variances" className="mt-0 outline-none">
                  <VarianceTab
                    items={items}
                    warehouses={warehouses}
                    onStockUpdated={refetch}
                  />
                </TabsContent>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
