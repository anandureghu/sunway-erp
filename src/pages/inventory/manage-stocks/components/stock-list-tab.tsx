import { DataTable } from "@/components/datatable";
import { Input } from "@/components/ui/input";
import { STOCK_COLUMNS } from "@/lib/columns/inventory-columns";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import type { Warehouse } from "@/types/inventory";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StockListTabProps = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  selectedWarehouse: string;
  onSelectedWarehouseChange: (v: string) => void;
  warehouses: Warehouse[];
  loading: boolean;
  loadError: string | null;
  filteredStock: ItemResponseDTO[];
  onRowNavigate: (item: ItemResponseDTO) => void;
};

export function StockListTab({
  searchQuery,
  onSearchQueryChange,
  selectedWarehouse,
  onSelectedWarehouseChange,
  warehouses,
  loading,
  loadError,
  filteredStock,
  onRowNavigate,
}: StockListTabProps) {
  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by SKU, name, or barcode..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={selectedWarehouse}
          onValueChange={onSelectedWarehouseChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="py-10 text-center text-muted-foreground">
          Loading inventory data...
        </div>
      ) : loadError ? (
        <div className="py-10 text-center text-red-600">{loadError}</div>
      ) : filteredStock.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          {searchQuery || selectedWarehouse !== "all"
            ? "No inventory items found matching your filters."
            : "No inventory items found. Add items to get started."}
        </div>
      ) : (
        <DataTable
          columns={STOCK_COLUMNS}
          data={filteredStock}
          onRowClick={(row) => {
            onRowNavigate(row.original);
          }}
        />
      )}
    </div>
  );
}
