import { DataTable } from "@/components/datatable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STOCK_COLUMNS } from "@/lib/columns/inventory-columns";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import type { Warehouse } from "@/types/inventory";
import { Search, FileSpreadsheet, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatOptionalDate } from "@/pages/inventory/inventory-item-detail/formatters";

type StockListTabProps = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  selectedWarehouse: string;
  onSelectedWarehouseChange: (v: string) => void;
  selectedStatus: string;
  onSelectedStatusChange: (v: string) => void;
  warehouses: Warehouse[];
  loading: boolean;
  loadError: string | null;
  filteredStock: ItemResponseDTO[];
  onRowNavigate: (item: ItemResponseDTO) => void;
};

function exportToCsv(data: ItemResponseDTO[]) {
  const headers = [
    "SL No.", "SKU/Item Code", "Barcode", "Item Name", "Category", "Brand",
    "Warehouse", "Quantity", "Unit", "Available", "Reserved",
    "Item Status", "Date Received", "Sale by Date",
  ];
  const rows = data.map((item, i) => [
    i + 1,
    item.sku,
    item.barcode ?? "",
    item.name,
    item.category,
    item.brand ?? "",
    item.warehouse_name,
    item.quantity,
    item.unitMeasure,
    item.available,
    item.reserved,
    item.status,
    formatOptionalDate(item.dateReceived),
    formatOptionalDate(item.expiryDate),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stock-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportToPdf(data: ItemResponseDTO[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import("html2pdf.js" as any) as any;
  const html2pdf = (mod.default ?? mod) as (el: HTMLElement) => {
    set: (opts: object) => { save: () => Promise<void> };
  };

  const statusLabel: Record<string, string> = {
    active: "Active",
    discontinued: "Discontinued",
    out_of_stock: "Out of Stock",
  };

  const rowsHtml = data
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.sku}${item.barcode ? `<br/><small>${item.barcode}</small>` : ""}</td>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.brand ?? "-"}</td>
        <td>${item.warehouse_name}</td>
        <td>${item.quantity} ${item.unitMeasure}</td>
        <td>${item.available} ${item.unitMeasure}</td>
        <td>${item.reserved || "-"}</td>
        <td>${statusLabel[item.status] ?? item.status}</td>
        <td>${formatOptionalDate(item.dateReceived)}</td>
        <td>${formatOptionalDate(item.expiryDate)}</td>
      </tr>`,
    )
    .join("");

  const html = `
    <html><head><style>
      body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; }
      h2 { color: #1e3a5f; margin: 0 0 4px; font-size: 14px; }
      p.sub { color: #6b7280; margin: 0 0 10px; font-size: 9px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1e3a5f; color: #fff; padding: 5px 6px; text-align: left; font-size: 9px; }
      td { padding: 4px 6px; border-bottom: 1px solid #e5e7eb; font-size: 9px; }
      tr:nth-child(even) td { background: #f9fafb; }
    </style></head>
    <body>
      <h2>Stock Inventory Report</h2>
      <p class="sub">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; ${data.length} item(s)</p>
      <table>
        <thead><tr>
          <th>SL No.</th><th>SKU</th><th>Item Name</th><th>Category</th>
          <th>Brand</th><th>Warehouse</th><th>Quantity</th><th>Available</th>
          <th>Reserved</th><th>Status</th><th>Date Received</th><th>Sale by Date</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body></html>`;

  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);

  await html2pdf(el).set({
    margin: 6,
    filename: `stock-inventory-${new Date().toISOString().slice(0, 10)}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
  }).save();

  document.body.removeChild(el);
}

export function StockListTab({
  searchQuery,
  onSearchQueryChange,
  selectedWarehouse,
  onSelectedWarehouseChange,
  selectedStatus,
  onSelectedStatusChange,
  warehouses,
  loading,
  loadError,
  filteredStock,
  onRowNavigate,
}: StockListTabProps) {
  return (
    <div className="space-y-4 mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 relative min-w-[200px]">
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
          <SelectTrigger className="w-[180px]">
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
        <Select value={selectedStatus} onValueChange={onSelectedStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="discontinued">Discontinued</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => exportToCsv(filteredStock)}
            disabled={filteredStock.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void exportToPdf(filteredStock)}
            disabled={filteredStock.length === 0}
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="py-10 text-center text-muted-foreground">
          Loading inventory data...
        </div>
      ) : loadError ? (
        <div className="py-10 text-center text-red-600">{loadError}</div>
      ) : filteredStock.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          {searchQuery || selectedWarehouse !== "all" || selectedStatus !== "all"
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
