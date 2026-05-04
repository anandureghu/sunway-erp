import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function ManageStocks() {
  const navigate = useNavigate();
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
    filteredStock,
    stats,
  } = useManageStocks();

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50/90 via-background to-background dark:from-muted/15">
      <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-6 sm:px-6 lg:py-8">
        {/* Page hero */}
        <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Stock & movements
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Manage your stock and movements.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <Package className="h-5 w-5 text-primary" />
              <span>
                <span className="font-semibold text-foreground">
                  {stats.totalItems}
                </span>{" "}
                lines tracked
              </span>
            </div>
          </div>
        </header>

        <StockStatsCards
          totalItems={stats.totalItems}
          lowStockItems={stats.lowStockItems}
          totalValue={stats.totalValue}
          warehouseCount={stats.warehouseCount}
        />

        <Card className="overflow-hidden border-border/80 shadow-md">
          <CardHeader className="border-b border-border/60 bg-muted/25 px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg font-semibold sm:text-xl">
                Workspace
              </CardTitle>
              <CardDescription>
                Choose a mode below. Data refreshes when you switch tabs.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                void refetch();
              }}
              className="w-full gap-0"
            >
              <div className="border-b border-border/60 bg-muted/20 px-3 pt-4 sm:px-5">
                <TabsList
                  className={cn(
                    "grid h-auto w-full grid-cols-1 gap-2 rounded-xl border border-border/50 bg-background/80 p-1.5 shadow-inner",
                    "sm:grid-cols-3",
                  )}
                >
                  <TabsTrigger
                    value="stock"
                    className="gap-2 py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <LayoutGrid className="h-4 w-4 shrink-0" />
                    <span className="truncate">Stock catalog</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="receive"
                    className="gap-2 py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <PackagePlus className="h-4 w-4 shrink-0" />
                    <span className="truncate">Receive goods</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="variances"
                    className="gap-2 py-3 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <ArrowRightLeft className="h-4 w-4 shrink-0" />
                    <span className="truncate">Variances</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="px-4 pb-6 pt-2 sm:px-6 sm:pb-8">
                <TabsContent value="stock" className="mt-0 outline-none">
                  <StockListTab
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    selectedWarehouse={selectedWarehouse}
                    onSelectedWarehouseChange={setSelectedWarehouse}
                    warehouses={warehouses}
                    loading={loading}
                    loadError={loadError}
                    filteredStock={filteredStock}
                    onRowNavigate={(row) =>
                      navigate(`/inventory/stocks/${row.id}`)
                    }
                  />
                </TabsContent>

                <TabsContent value="receive" className="mt-0 outline-none">
                  <ReceiveItemTab
                    items={items}
                    warehouses={warehouses}
                    onStockUpdated={refetch}
                  />
                </TabsContent>

                <TabsContent value="variances" className="mt-0 outline-none">
                  <VarianceTab
                    items={items}
                    warehouses={warehouses}
                    onStockUpdated={refetch}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
