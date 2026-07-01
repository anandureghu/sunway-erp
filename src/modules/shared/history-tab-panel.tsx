import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { DestructiveDeleteDialog } from "@/components/destructive-delete-dialog";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyAmount } from "@/lib/currency";
import {
  bulkDeleteHistoryRecords,
  deleteAllHistoryRecords,
  listHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import type {
  HistoryEntityType,
  HistoryModule,
  HistoryRecord,
} from "@/types/history";
import {
  HISTORY_ENTITY_LABELS,
  HISTORY_MODULE_TYPES,
} from "@/types/history";

type HistoryTabPanelProps = {
  module: HistoryModule;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "MMM d, yyyy");
}

export function HistoryTabPanel({ module }: HistoryTabPanelProps) {
  const entityTypes = HISTORY_MODULE_TYPES[module];
  const [entityType, setEntityType] = useState<HistoryEntityType | "">(
    entityTypes[0] ?? "",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<HistoryRecord[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    [rowSelection],
  );

  const loadHistory = useCallback(async () => {
    if (!entityType) {
      setRows([]);
      setTotalElements(0);
      return;
    }
    setLoading(true);
    try {
      const response = await listHistoryRecords({
        module,
        type: entityType,
        page,
        size: 20,
        search: search.trim() || undefined,
      });
      setRows(response.content);
      setTotalElements(response.totalElements);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load archived records.";
      toast.error(message);
      setRows([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [entityType, module, page, search]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setPage(0);
    setRowSelection({});
  }, [entityType, search]);

  const columns = useMemo<ColumnDef<HistoryRecord>[]>(
    () => [
      {
        accessorKey: "referenceNo",
        header: "Reference",
        cell: ({ row }) => row.original.referenceNo || "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => row.original.status || "—",
      },
      {
        accessorKey: "partyName",
        header: "Party / Details",
        cell: ({ row }) => row.original.partyName || "—",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) =>
          typeof row.original.amount === "number"
            ? formatCurrencyAmount({ amount: row.original.amount })
            : "—",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: "archivedAt",
        header: "Archived",
        cell: ({ row }) => formatDate(row.original.archivedAt),
      },
    ],
    [],
  );

  const handleDeleteSelected = async () => {
    if (!entityType || selectedIds.length === 0) return;
    setDeleting(true);
    try {
      const result = await bulkDeleteHistoryRecords(entityType, selectedIds);
      toast.success(summarizeBulkActionResult(result));
      setDeleteDialogOpen(false);
      setRowSelection({});
      await loadHistory();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete selected records.";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!entityType) return;
    setDeleting(true);
    try {
      const result = await deleteAllHistoryRecords(entityType, "DELETE");
      toast.success(summarizeBulkActionResult(result));
      setDeleteAllDialogOpen(false);
      setRowSelection({});
      await loadHistory();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete all archived records.";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (entityTypes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No archivable HR records yet. Archived HR items will appear here when
          supported.
        </CardContent>
      </Card>
    );
  }

  const entityLabel = entityType ? HISTORY_ENTITY_LABELS[entityType] : "records";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Archived history</CardTitle>
          <div className="grid gap-4 md:grid-cols-[240px_1fr_auto]">
            <div className="space-y-2">
              <Label>Record type</Label>
              <Select
                value={entityType}
                onValueChange={(value) =>
                  setEntityType(value as HistoryEntityType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {HISTORY_ENTITY_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="history-search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="history-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Reference, party, or status"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteAllDialogOpen(true)}
                disabled={!entityType || totalElements === 0 || loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete all archived
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <BulkActionBar
            mode="delete"
            selectedCount={selectedIds.length}
            onDelete={() => setDeleteDialogOpen(true)}
            onClear={() => setRowSelection({})}
            deleting={deleting}
          />
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading archived records...
            </div>
          ) : (
            <SelectableDataTable
              columns={columns}
              data={rows}
              enableRowSelection
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              getRowId={(row) => String(row.id)}
              hideSlNo
            />
          )}
          <p className="text-xs text-muted-foreground">
            {totalElements} archived record{totalElements === 1 ? "" : "s"} found.
          </p>
        </CardContent>
      </Card>

      <DestructiveDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        count={selectedIds.length}
        entityLabel={entityLabel}
        onConfirm={handleDeleteSelected}
        confirming={deleting}
      />

      <DestructiveDeleteDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        count={totalElements}
        entityLabel={entityLabel}
        requireDeleteAll
        title="Delete all archived records?"
        description={`This will permanently delete all ${totalElements} archived ${entityLabel.toLowerCase()}. This action cannot be undone.`}
        onConfirm={handleDeleteAll}
        confirming={deleting}
      />
    </div>
  );
}
