import { useState } from "react";
import { ListTodo, FileCheck } from "lucide-react";
import { SelectableDataTable } from "@/components/selectable-data-table";
import type { ServerPaginationProps } from "@/components/table-pagination";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PurchaseOrder } from "@/types/purchase";
import type { ColumnDef, Row, RowSelectionState } from "@tanstack/react-table";
import { PageHeader } from "@/components/PageHeader";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import {
  OrderDateRangeFilter,
  type OrderDateRange,
} from "@/components/order-date-range-filter";
import {
  ListToolbar,
  ListSearchField,
  ListToolbarSelect,
} from "@/components/list-toolbar";

type OrderTab = "open" | "terminal";

type Props = {
  loading: boolean;
  error: string | null;
  /** Current server page rows (already filtered by tab/status/search). */
  orders: PurchaseOrder[];
  searchQuery: string;
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
  listTab?: OrderTab;
  onListTabChange?: (tab: OrderTab) => void;
  openCount?: number;
  terminalCount?: number;
  columns: ColumnDef<PurchaseOrder>[];
  enableBulkArchive?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  selectedCount?: number;
  onBulkArchive?: () => void;
  bulkArchiving?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateRangeChange: (next: OrderDateRange) => void;
  onRowClick: (row: Row<PurchaseOrder>) => void;
  onRetry: () => void;
  kpiItems?: KpiSummaryStat[];
  serverPagination?: ServerPaginationProps;
};

export function PurchaseOrdersListView({
  loading,
  error,
  orders,
  searchQuery,
  statusFilter,
  dateFrom,
  dateTo,
  columns,
  enableBulkArchive = false,
  rowSelection,
  onRowSelectionChange,
  selectedCount = 0,
  onBulkArchive,
  bulkArchiving = false,
  onSearchChange,
  onStatusChange,
  onDateRangeChange,
  onRowClick,
  onRetry,
  kpiItems,
  listTab: listTabProp,
  onListTabChange,
  openCount,
  terminalCount,
  serverPagination,
}: Props) {
  const [internalTab, setInternalTab] = useState<OrderTab>("open");
  const tab = listTabProp ?? internalTab;

  const setTab = (value: OrderTab) => {
    if (onListTabChange) onListTabChange(value);
    else setInternalTab(value);
  };

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

  const openBadge = openCount ?? (tab === "open" ? (serverPagination?.total ?? orders.length) : undefined);
  const terminalBadge =
    terminalCount ??
    (tab === "terminal" ? (serverPagination?.total ?? orders.length) : undefined);

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
                    GET /api/purchase/orders?page=
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
                      Current Orders
                      {openBadge != null ? ` ${openBadge}` : ""}
                    </TabsTrigger>
                    <TabsTrigger
                      value="terminal"
                      className="flex items-center gap-2"
                    >
                      <FileCheck className="h-4 w-4" />
                      Completed
                      {terminalBadge != null ? ` ${terminalBadge}` : ""}
                    </TabsTrigger>
                  </TabsList>
                  <ListToolbar className="p-0">
                    <OrderDateRangeFilter
                      from={dateFrom}
                      to={dateTo}
                      onChange={onDateRangeChange}
                    />
                    <ListSearchField
                      value={searchQuery}
                      onChange={onSearchChange}
                      placeholder="Search orders..."
                      className="w-56 sm:w-64"
                    />
                    {tab === "open" ? (
                      <ListToolbarSelect
                        aria-label="Status"
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                      >
                        <option value="all">All status</option>
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="ordered">Ordered</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="partially_received">
                          Partially received
                        </option>
                      </ListToolbarSelect>
                    ) : null}
                  </ListToolbar>
                </div>
                <TabsContent value="open" className="mt-4">
                  {tab === "open" ? (
                    <SelectableDataTable
                      columns={columns}
                      data={orders}
                      onRowClick={onRowClick}
                      serverPagination={serverPagination}
                    />
                  ) : null}
                </TabsContent>
                <TabsContent value="terminal" className="mt-4 space-y-4">
                  {tab === "terminal" ? (
                    <>
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
                        data={orders}
                        onRowClick={onRowClick}
                        enableRowSelection={enableBulkArchive}
                        rowSelection={rowSelection}
                        onRowSelectionChange={onRowSelectionChange}
                        getRowId={(row) => row.id}
                        isRowSelectable={(row) =>
                          (row.status === "received" ||
                            row.status === "cancelled") &&
                          !row.archived
                        }
                        serverPagination={serverPagination}
                      />
                    </>
                  ) : null}
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
