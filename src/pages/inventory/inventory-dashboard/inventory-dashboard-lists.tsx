import {
  DashboardAlertsCard,
  DashboardCardSkeletonGrid,
  DashboardEmpty,
  DashboardSectionCard,
} from "@/components/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  InventoryDashboardAlert,
  InventoryLowStockItem,
} from "@/types/inventoryDashboard";

export function InventoryDashboardLists({
  lowStockItems,
  alerts,
  loading,
}: {
  lowStockItems: InventoryLowStockItem[];
  alerts: InventoryDashboardAlert[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <DashboardCardSkeletonGrid
        count={2}
        className="xl:grid-cols-2"
        cardClassName="h-[300px] rounded-xl"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <DashboardSectionCard
        title="Low Stock Items"
        description="At or below reorder level"
        viewAllTo="/inventory/stocks"
        contentClassName="overflow-x-auto px-0"
      >
        {lowStockItems.length === 0 ? (
          <DashboardEmpty message="No low-stock items." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="pr-6 text-right">Reorder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((row) => (
                <TableRow key={`${row.itemId}-${row.warehouseId}`}>
                  <TableCell className="pl-6 font-medium">{row.sku}</TableCell>
                  <TableCell className="max-w-[160px] truncate">
                    {row.name}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs">
                    {row.warehouseName}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600 tabular-nums">
                    {row.available.toLocaleString()}
                  </TableCell>
                  <TableCell className="pr-6 text-right tabular-nums text-muted-foreground">
                    {row.reorderLevel.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DashboardSectionCard>

      <DashboardAlertsCard
        title="Inventory Alerts"
        alerts={alerts}
        showAmount={false}
        emptyMessage="No inventory alerts."
      />
    </div>
  );
}
