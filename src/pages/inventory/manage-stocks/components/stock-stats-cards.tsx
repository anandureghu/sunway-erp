import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

type StockStatsCardsProps = {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  warehouseCount: number;
};

export function StockStatsCards({
  totalItems,
  lowStockItems,
  totalValue,
  warehouseCount,
}: StockStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold mt-1">{totalItems}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {lowStockItems}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold mt-1">
                ₹ {totalValue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warehouses</p>
              <p className="text-2xl font-bold mt-1">{warehouseCount}</p>
            </div>
            <WarehouseIcon className="h-8 w-8 text-amber-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
