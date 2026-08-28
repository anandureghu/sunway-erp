import { useCallback, useMemo, useState } from "react";
import type { Row, RowSelectionState } from "@tanstack/react-table";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { DestructiveDeleteDialog } from "@/components/destructive-delete-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STOCK_COLUMNS } from "@/lib/columns/inventory-columns";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import {
  bulkArchiveItems,
  bulkDeleteItems,
  bulkRestoreItems,
  bulkUpdateItemStatus,
} from "@/service/inventoryService";
import { summarizeBulkActionResult } from "@/service/historyService";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { Search, FileSpreadsheet, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatOptionalDate } from "@/pages/inventory/inventory-item-detail/formatters";
import {
  resolveCatalogStatus,
  STATUS_LABELS,
} from "@/pages/inventory/inventory-item-detail/item-detail-utils";
import { ImportItemsCsvDialog } from "./import-items-csv-dialog";
import { StockBulkActionBar } from "./stock-bulk-action-bar";
import { toast } from "sonner";

type StockListTabProps = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  selectedStatus: string;
  onSelectedStatusChange: (v: string) => void;
  catalogView: "active" | "archived";
  onCatalogViewChange: (v: "active" | "archived") => void;
  loading: boolean;
  loadError: string | null;
  filteredStock: ItemResponseDTO[];
  onRowNavigate: (item: ItemResponseDTO) => void;
  onImported?: () => void;
  onRefresh?: () => void | Promise<void>;
  canEdit?: boolean;
  canDelete?: boolean;
};

function exportToCsv(data: ItemResponseDTO[]) {
  const headers = [
    "SL No.",
    "Item code",
    "Barcode",
    "Item name",
    "Category",
    "Brand",
    "Qty on hand",
    "Unit",
    "Qty on reserve",
    "Qty on order",
    "Date received",
    "Sale by date",
    "Status",
  ];
  const rows = data.map((item, i) => [
    i + 1,
    item.sku,
    item.barcode ?? "",
    item.name,
    item.category,
    item.brand ?? "",
    item.quantity,
    item.unitMeasure,
    item.reserved,
    item.quantityOnOrder ?? 0,
    formatOptionalDate(item.dateReceived),
    formatOptionalDate(item.expiryDate),
    STATUS_LABELS[resolveCatalogStatus(item)] ?? resolveCatalogStatus(item),
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
  const mod = (await import("html2pdf.js" as any)) as any;
  const html2pdf = (mod.default ?? mod) as (el: HTMLElement) => {
    set: (opts: object) => { save: () => Promise<void> };
  };

  const rowsHtml = data
    .map((item, i) => {
      const status = resolveCatalogStatus(item);
      return `
      <tr>
        <td>${i + 1}</td>
        <td>${item.sku}${item.barcode ? `<br/><small>${item.barcode}</small>` : ""}</td>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.brand ?? "-"}</td>
        <td>${item.quantity} ${item.unitMeasure}</td>
        <td>${item.reserved || "-"}</td>
        <td>${item.quantityOnOrder || "-"}</td>
        <td>${formatOptionalDate(item.dateReceived)}</td>
        <td>${formatOptionalDate(item.expiryDate)}</td>
        <td>${STATUS_LABELS[status] ?? status}</td>
      </tr>`;
    })
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
          <th>SL No.</th><th>Item code</th><th>Item name</th><th>Category</th>
          <th>Brand</th><th>Qty on hand</th><th>Qty on reserve</th><th>Qty on order</th>
          <th>Date received</th><th>Sale by date</th><th>Status</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body></html>`;

  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);

  await html2pdf(el)
    .set({
      margin: 6,
      filename: `stock-inventory-${new Date().toISOString().slice(0, 10)}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    })
    .save();

  document.body.removeChild(el);
}

function uniqueItemIds(rows: ItemResponseDTO[]): number[] {
  return [...new Set(rows.map((r) => r.id).filter((id) => id != null))];
}

export function StockListTab({
  searchQuery,
  onSearchQueryChange,
  selectedStatus,
  onSelectedStatusChange,
  catalogView,
  onCatalogViewChange,
  loading,
  loadError,
  filteredStock,
  onRowNavigate,
  onImported,
  onRefresh,
  canEdit = false,
  canDelete = false,
}: StockListTabProps) {
  const { confirm } = useConfirmDialog();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const selectedRows = useMemo(() => {
    return Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([rowId]) =>
        filteredStock.find(
          (row) => `${row.id}-${row.warehouse_id}` === rowId,
        ),
      )
      .filter((row): row is ItemResponseDTO => row != null);
  }, [rowSelection, filteredStock]);

  const selectedItemIds = useMemo(
    () => uniqueItemIds(selectedRows),
    [selectedRows],
  );

  const clearSelection = useCallback(() => setRowSelection({}), []);

  const handleCatalogViewChange = (value: string) => {
    onCatalogViewChange(value as "active" | "archived");
    clearSelection();
  };

  const runBulk = async (
    action: () => Promise<import("@/types/history").BulkActionResult>,
    successVerb: string,
  ) => {
    try {
      const result = await action();
      toast.success(summarizeBulkActionResult(result));
      if ((result.failed?.length ?? 0) > 0) {
        const reasons = result.failed
          .slice(0, 3)
          .map((f) => f.reason)
          .join("; ");
        toast.warning(reasons, { duration: 8000 });
      }
      clearSelection();
      await onRefresh?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Failed to ${successVerb}`));
    }
  };

  const handleArchive = async () => {
    if (selectedItemIds.length === 0) return;
    if (
      !(await confirm({
        title: "Archive products",
        description: `Archive ${selectedItemIds.length} selected product(s)? Archived items are hidden from the active catalog. They must have zero stock, no reservations, and no open purchase orders.`,
        variant: "destructive",
      }))
    ) {
      return;
    }
    setArchiving(true);
    try {
      await runBulk(() => bulkArchiveItems(selectedItemIds), "archive items");
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async () => {
    if (selectedItemIds.length === 0) return;
    if (
      !(await confirm({
        title: "Restore products",
        description: `Restore ${selectedItemIds.length} selected product(s) to the active catalog?`,
      }))
    ) {
      return;
    }
    setRestoring(true);
    try {
      await runBulk(() => bulkRestoreItems(selectedItemIds), "restore items");
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedItemIds.length === 0) return;
    setDeleting(true);
    try {
      await runBulk(() => bulkDeleteItems(selectedItemIds), "delete items");
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkDiscontinued = async () => {
    if (selectedItemIds.length === 0) return;
    if (
      !(await confirm({
        title: "Mark discontinued",
        description: `Mark ${selectedItemIds.length} selected product(s) as discontinued? They will remain in the active catalog.`,
      }))
    ) {
      return;
    }
    setUpdatingStatus(true);
    try {
      await runBulk(
        () => bulkUpdateItemStatus(selectedItemIds, "discontinued"),
        "update status",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const enableSelection = (canEdit || canDelete) && catalogView !== undefined;

  return (
    <div className="space-y-4 mt-6">
      <Tabs value={catalogView} onValueChange={handleCatalogViewChange}>
        <TabsList>
          <TabsTrigger value="active">Active catalog</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by SKU, name, barcode, sale by date, or date received..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {catalogView === "active" ? (
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
        ) : null}
        <div className="flex items-center gap-2 ml-auto">
          {onImported && catalogView === "active" ? (
            <ImportItemsCsvDialog onImported={onImported} />
          ) : null}
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

      {catalogView === "archived" ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-3 py-2">
          Archived products are removed from sales and receiving pickers. Restore
          to bring them back, or permanently delete when they have no transaction
          history.
        </p>
      ) : null}

      <StockBulkActionBar
        selectedCount={selectedRows.length}
        uniqueItemCount={selectedItemIds.length}
        view={catalogView}
        canEdit={canEdit}
        canDelete={canDelete}
        archiving={archiving}
        restoring={restoring}
        deleting={deleting}
        updatingStatus={updatingStatus}
        onArchive={catalogView === "active" && canEdit ? handleArchive : undefined}
        onRestore={catalogView === "archived" && canEdit ? handleRestore : undefined}
        onDelete={
          catalogView === "archived" && canDelete
            ? () => setDeleteDialogOpen(true)
            : undefined
        }
        onMarkDiscontinued={
          catalogView === "active" && canEdit ? handleMarkDiscontinued : undefined
        }
        onExportSelected={
          selectedRows.length > 0
            ? () => exportToCsv(selectedRows)
            : undefined
        }
        onClear={clearSelection}
      />

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">
          Loading inventory data...
        </div>
      ) : loadError ? (
        <div className="py-10 text-center text-red-600">{loadError}</div>
      ) : filteredStock.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          {catalogView === "archived"
            ? "No archived products."
            : searchQuery || selectedStatus !== "all"
              ? "No inventory items found matching your filters."
              : "No inventory items found. Add items to get started."}
        </div>
      ) : (
        <SelectableDataTable
          columns={STOCK_COLUMNS}
          data={filteredStock}
          enableRowSelection={enableSelection}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => `${row.id}-${row.warehouse_id}`}
          isRowSelectable={() => true}
          onRowClick={(row: Row<ItemResponseDTO>) => {
            if ((row.original.id ?? 0) <= 0) {
              toast.error("This product cannot be opened — item ID is missing.");
              return;
            }
            onRowNavigate(row.original);
          }}
        />
      )}

      <DestructiveDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Permanently delete archived products?"
        description={`You are about to permanently delete ${selectedItemIds.length} archived product(s). This removes the item master and warehouse stock rows. Items with purchase, sales, or receipt history cannot be deleted. Type DELETE to confirm.`}
        count={selectedItemIds.length}
        entityLabel="products"
        requireDeleteAll
        confirming={deleting}
        onConfirm={handleDeleteConfirm}
        onExport={() => exportToCsv(selectedRows)}
      />
    </div>
  );
}
