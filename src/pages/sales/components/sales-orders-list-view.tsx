import { Plus, Search, Filter } from "lucide-react";
import { DataTable } from "@/components/datatable";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { SalesOrder } from "@/types/sales";
import type { ColumnDef } from "@tanstack/react-table";
import { SalesPageHeader } from "./sales-page-header";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";

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
  showArchivedOnly: boolean;
  columns: ColumnDef<SalesOrder>[];
  onCreateNew: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onShowArchivedOnlyChange: (value: boolean) => void;
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
  showArchivedOnly,
  columns,
  onCreateNew,
  onSearchChange,
  onStatusChange,
  onShowArchivedOnlyChange,
  onRowClick,
  kpiItems,
}: Props) {
  const emptyMessage =
    listTab === "active"
      ? "No open orders match your filters."
      : "No completed or cancelled orders match your filters.";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <SalesPageHeader
        titleClassName="!text-2xl"
        title="Manage Sales Orders"
        description="Review order pipeline, tabs for open vs completed work, and drill into any order."
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
                  Current orders
                  <Badge variant="secondary" className="font-normal">
                    {activeCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="closed" className="gap-2">
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
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {listTab === "active" ? (
                        <>
                          <SelectItem value="draft">Draft</SelectItem>
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
                {listTab === "closed" ? (
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Switch
                      id="show-archived-orders"
                      checked={showArchivedOnly}
                      onCheckedChange={onShowArchivedOnlyChange}
                    />
                    <Label
                      htmlFor="show-archived-orders"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Archived only
                    </Label>
                  </div>
                ) : null}
              </div>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
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
            <DataTable
              columns={columns}
              data={orders}
              onRowClick={(row) => onRowClick(row.original.id)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
