import { Plus, Search, Filter, ListTodo, FileCheck } from "lucide-react";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RowSelectionState } from "@tanstack/react-table";
import type { SalesOrder } from "@/types/sales";
import type { ColumnDef } from "@tanstack/react-table";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { PageHeader } from "@/components/PageHeader";

type ListTab = "active" | "closed";

type Props = {
  loading: boolean;
  error: string | null;
  orders: SalesOrder[];
  listTab: ListTab;
  onListTabChange: (tab: ListTab) => void;
  activeCount: number;
  closedCount: number;
  searchQuery: string;
  statusFilter: string;
  paymentStatusFilter: string;
  columns: ColumnDef<SalesOrder>[];
  enableBulkArchive?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  selectedCount?: number;
  onBulkArchive?: () => void;
  bulkArchiving?: boolean;
  onCreateNew: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPaymentStatusChange: (value: string) => void;
  onRowClick: (id: string) => void;
  kpiItems?: KpiSummaryStat[];
};

export function SalesOrdersListView({
  loading,
  error,
  orders,
  listTab,
  onListTabChange,
  activeCount,
  closedCount,
  searchQuery,
  statusFilter,
  paymentStatusFilter,
  columns,
  enableBulkArchive = false,
  rowSelection,
  onRowSelectionChange,
  selectedCount = 0,
  onBulkArchive,
  bulkArchiving = false,
  onCreateNew,
  onSearchChange,
  onStatusChange,
  onPaymentStatusChange,
  onRowClick,
  kpiItems,
}: Props) {
  const emptyMessage =
    listTab === "active"
      ? "No open orders match your filters."
      : "No completed or cancelled orders match your filters.";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader variant="darkBlue"
        title="Manage Sales Orders"
        description="Review confirmed and completed orders, filter by status, and drill into any order."
        backHref="/inventory/sales"
        actions={
          <Button
            size="lg"
            onClick={onCreateNew}
            className="bg-white text-slate-900 hover:bg-white/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Order
          </Button>
        }
      />

      {kpiItems && kpiItems.length > 0 ? (
        <KpiSummaryStrip items={kpiItems} />
      ) : null}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <Tabs
            value={listTab}
            onValueChange={(v) => onListTabChange(v as ListTab)}
            className="w-full gap-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 lg:w-auto">
                <TabsTrigger value="active" className="gap-2">
                  <ListTodo className="h-4 w-4" />
                  Current orders
                  <Badge variant="secondary" className="font-normal">
                    {activeCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="closed" className="gap-2">
                  <FileCheck className="h-4 w-4" />
                  Completed
                  <Badge variant="secondary" className="font-normal">
                    {closedCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search order no / customer..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8 w-72"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-44 pl-8">
                      <SelectValue placeholder="Order status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All order status</SelectItem>
                      {listTab === "active" ? (
                        <>
                          <SelectItem value="quotation">Quotation</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="picked">Picked</SelectItem>
                          <SelectItem value="dispatched">Dispatched</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Select
                    value={paymentStatusFilter}
                    onValueChange={onPaymentStatusChange}
                  >
                    <SelectTrigger className="w-48 pl-8">
                      <SelectValue placeholder="Payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All payment status</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partially_paid">Partially paid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          {enableBulkArchive ? (
            <BulkActionBar
              selectedCount={selectedCount}
              onArchive={onBulkArchive}
              onClear={() => onRowSelectionChange?.({})}
              archiving={bulkArchiving}
            />
          ) : null}
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              Loading sales orders...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-600">{error}</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <SelectableDataTable
              columns={columns}
              data={orders}
              onRowClick={(row) => onRowClick(row.original.id)}
              enableRowSelection={enableBulkArchive}
              rowSelection={rowSelection}
              onRowSelectionChange={onRowSelectionChange}
              getRowId={(row) => row.id}
              isRowSelectable={(row) =>
                (row.status === "completed" || row.status === "cancelled") &&
                !row.archived
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
