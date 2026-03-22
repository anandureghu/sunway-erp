import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manage Inventory</h1>
          <p className="text-gray-600 text-sm mt-1">
            Track and control your inventory
          </p>
        </div>
      </div>

      <StockStatsCards
        totalItems={stats.totalItems}
        lowStockItems={stats.lowStockItems}
        totalValue={stats.totalValue}
        warehouseCount={stats.warehouseCount}
      />

      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              void refetch();
            }}
            className="w-full"
          >
            <TabsList className="w-full">
              <StyledTabsTrigger value="stock">
                Inventory Items (Stock)
              </StyledTabsTrigger>
              <StyledTabsTrigger value="receive">
                Receive Item
              </StyledTabsTrigger>
              <StyledTabsTrigger value="variances">Variances</StyledTabsTrigger>
            </TabsList>

            <TabsContent value="stock">
              <StockListTab
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                selectedWarehouse={selectedWarehouse}
                onSelectedWarehouseChange={setSelectedWarehouse}
                warehouses={warehouses}
                loading={loading}
                loadError={loadError}
                filteredStock={filteredStock}
                onRowNavigate={(row) => navigate(`/inventory/stocks/${row.id}`)}
              />
            </TabsContent>

            <TabsContent value="receive">
              <ReceiveItemTab
                items={items}
                warehouses={warehouses}
                onStockUpdated={refetch}
              />
            </TabsContent>

            <TabsContent value="variances">
              <VarianceTab
                items={items}
                warehouses={warehouses}
                onStockUpdated={refetch}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
