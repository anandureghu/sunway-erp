import { useMemo, useState } from "react";
import { Search, ListTodo, FileCheck } from "lucide-react";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PurchaseOrder } from "@/types/purchase";
import type { ColumnDef, Row, RowSelectionState } from "@tanstack/react-table";
import { PageHeader } from "@/components/PageHeader";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";

type Props = {
  loading: boolean;
  error: string | null;
  orders: PurchaseOrder[];
  searchQuery: string;
  statusFilter: string;
  columns: ColumnDef<PurchaseOrder>[];
  enableBulkArchive?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  selectedCount?: number;
  onBulkArchive?: () => void;
  bulkArchiving?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRowClick: (row: Row<PurchaseOrder>) => void;
  onRetry: () => void;
  kpiItems?: KpiSummaryStat[];
};

type OrderTab = "open" | "terminal";

function isTerminalOrderStatus(status: string): boolean {
  return status === "received" || status === "cancelled";
}

export function PurchaseOrdersListView({
  loading,
  error,
  orders,
  searchQuery,
  statusFilter,
  columns,
  enableBulkArchive = false,
  rowSelection,
  onRowSelectionChange,
  selectedCount = 0,
  onBulkArchive,
  bulkArchiving = false,
  onSearchChange,
  onStatusChange,
  onRowClick,
  onRetry,
  kpiItems,
}: Props) {
  const [tab, setTab] = useState<OrderTab>("open");

  const openOrders = useMemo(
    () => orders.filter((o) => !isTerminalOrderStatus(o.status)),
    [orders],
  );
  const terminalOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (!isTerminalOrderStatus(o.status)) return false;
        return !o.archived;
      }),
    [orders],
  );
  const terminalUnarchivedCount = useMemo(
    () =>
      orders.filter((o) => isTerminalOrderStatus(o.status) && !o.archived)
        .length,
    [orders],
  );

  const handleTabChange = (next: string) => {
    const value = next as OrderTab;
    setTab(value);
    onRowSelectionChange?.({});
    if (value === "terminal") {
      if (
        statusFilter !== "all" &&
        statusFilter !== "received" &&
        statusFilter !== "cancelled"
      ) {
        onStatusChange("all");
      }
    } else if (value === "open") {
      if (statusFilter === "received" || statusFilter === "cancelled") {
        onStatusChange("all");
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Orders are created when a requisition is approved"
        backHref="/inventory/purchase"
        variant="darkGreen"
      />

      {kpiItems && kpiItems.length > 0 ? (
        <KpiSummaryStrip items={kpiItems} />
      ) : null}

      <Card className="shadow-sm">
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading purchase orders…
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-4">
              <div className="text-red-600 font-medium">{error}</div>
              {error.includes("not configured") && (
                <p className="text-sm text-muted-foreground">
                  Expected:{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    GET /api/purchase/orders
                  </code>
                </p>
              )}
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <Tabs value={tab} onValueChange={handleTabChange}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TabsList>
                    <TabsTrigger value="open" className="flex items-center gap-2">
                      <ListTodo className="h-4 w-4" />
                      Current Orders {openOrders.length}
                    </TabsTrigger>
                    <TabsTrigger value="terminal" className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      Completed {terminalUnarchivedCount}
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-8 w-56 sm:w-64"
                      />
                    </div>
                    {tab === "open" ? (
                      <Select
                        value={statusFilter}
                        onValueChange={onStatusChange}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All status</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="ordered">Ordered</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="partially_received">
                            Partially received
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>
                </div>
                <TabsContent value="open" className="mt-4">
                  <SelectableDataTable
                    columns={columns}
                    data={openOrders}
                    onRowClick={onRowClick}
                  />
                </TabsContent>
                <TabsContent value="terminal" className="mt-4 space-y-4">
                  {enableBulkArchive ? (
                    <BulkActionBar
                      selectedCount={selectedCount}
                      onArchive={onBulkArchive}
                      onClear={() => onRowSelectionChange?.({})}
                      archiving={bulkArchiving}
                    />
                  ) : null}
                  <SelectableDataTable
                    columns={columns}
                    data={terminalOrders}
                    onRowClick={onRowClick}
                    enableRowSelection={enableBulkArchive}
                    rowSelection={rowSelection}
                    onRowSelectionChange={onRowSelectionChange}
                    getRowId={(row) => row.id}
                    isRowSelectable={(row) =>
                      (row.status === "received" || row.status === "cancelled") &&
                      !row.archived
                    }
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
