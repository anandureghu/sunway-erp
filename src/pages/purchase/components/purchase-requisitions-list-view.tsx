import { useState } from "react";
import { ListTodo, FileCheck } from "lucide-react";
import { SelectableDataTable } from "@/components/selectable-data-table";
import type { ServerPaginationProps } from "@/components/table-pagination";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PurchaseRequisition } from "@/types/purchase";
import type { ColumnDef, Row, RowSelectionState } from "@tanstack/react-table";
import { PageHeader } from "@/components/PageHeader";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import {
  ListToolbar,
  ListSearchField,
  ListToolbarSelect,
} from "@/components/list-toolbar";

type RequisitionTab = "active" | "converted";

type Props = {
  loading: boolean;
  error: string | null;
  requisitions: PurchaseRequisition[];
  searchQuery: string;
  statusFilter: string;
  listTab?: RequisitionTab;
  onListTabChange?: (tab: RequisitionTab) => void;
  activeCount?: number;
  convertedCount?: number;
  columns: ColumnDef<PurchaseRequisition>[];
  enableBulkArchive?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  selectedCount?: number;
  onBulkArchive?: () => void;
  bulkArchiving?: boolean;
  onCreateNew: () => void;
  showCreateButton?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRetry: () => void;
  onRowClick: (row: Row<PurchaseRequisition>) => void;
  kpiItems?: KpiSummaryStat[];
  serverPagination?: ServerPaginationProps;
};

export function PurchaseRequisitionsListView({
  loading,
  error,
  requisitions,
  searchQuery,
  statusFilter,
  columns,
  enableBulkArchive = false,
  rowSelection,
  onRowSelectionChange,
  selectedCount = 0,
  onBulkArchive,
  bulkArchiving = false,
  onCreateNew,
  showCreateButton = true,
  onSearchChange,
  onStatusChange,
  onRetry,
  onRowClick,
  kpiItems,
  listTab: listTabProp,
  onListTabChange,
  activeCount,
  convertedCount,
  serverPagination,
}: Props) {
  const [internalTab, setInternalTab] = useState<RequisitionTab>("active");
  const tab = listTabProp ?? internalTab;

  const setTab = (value: RequisitionTab) => {
    if (onListTabChange) onListTabChange(value);
    else setInternalTab(value);
  };

  const handleTabChange = (next: string) => {
    const value = next as RequisitionTab;
    setTab(value);
    onRowSelectionChange?.({});
    if (value === "converted" && statusFilter !== "all") {
      onStatusChange("all");
    } else if (value === "active" && statusFilter === "converted") {
      onStatusChange("all");
    }
  };

  const activeBadge =
    activeCount ??
    (tab === "active" ? (serverPagination?.total ?? requisitions.length) : undefined);
  const convertedBadge =
    convertedCount ??
    (tab === "converted"
      ? (serverPagination?.total ?? requisitions.length)
      : undefined);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Purchase requisitions"
        description="Approving creates a draft purchase order"
        backHref="/inventory/purchase"
        variant="darkGreen"
        actions={
          showCreateButton ? (
            <Button
              size="lg"
              onClick={onCreateNew}
              className="bg-white text-slate-900 hover:bg-white/90"
            >
              Create requisition
            </Button>
          ) : undefined
        }
      />

      {kpiItems && kpiItems.length > 0 ? (
        <KpiSummaryStrip items={kpiItems} />
      ) : null}

      <Card className="shadow-sm">
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading…
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-3">
              <div className="text-red-600 font-medium">{error}</div>
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={handleTabChange}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <ListTodo className="h-4 w-4" />
                    Active{activeBadge != null ? ` ${activeBadge}` : ""}
                  </TabsTrigger>
                  <TabsTrigger
                    value="converted"
                    className="flex items-center gap-2"
                  >
                    <FileCheck className="h-4 w-4" />
                    Converted To Purchase Order
                    {convertedBadge != null ? ` ${convertedBadge}` : ""}
                  </TabsTrigger>
                </TabsList>
                <ListToolbar className="p-0">
                  <ListSearchField
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="Search…"
                    className="w-56 sm:w-64"
                  />
                  {tab === "active" ? (
                    <ListToolbarSelect
                      aria-label="Status"
                      value={statusFilter}
                      onChange={(e) => onStatusChange(e.target.value)}
                    >
                      <option value="all">All status</option>
                      <option value="quotation">Quotation</option>
                      <option value="submitted">Submitted</option>
                      <option value="converted">Converted</option>
                      <option value="rejected">Rejected</option>
                    </ListToolbarSelect>
                  ) : null}
                </ListToolbar>
              </div>

              <TabsContent value="active" className="mt-4">
                {tab === "active" ? (
                  <SelectableDataTable
                    columns={columns}
                    data={requisitions}
                    onRowClick={onRowClick}
                    serverPagination={serverPagination}
                  />
                ) : null}
              </TabsContent>
              <TabsContent value="converted" className="mt-4 space-y-4">
                {tab === "converted" ? (
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
                      data={requisitions}
                      onRowClick={onRowClick}
                      enableRowSelection={enableBulkArchive}
                      rowSelection={rowSelection}
                      onRowSelectionChange={onRowSelectionChange}
                      getRowId={(row) => row.id}
                      isRowSelectable={(row) =>
                        row.status === "converted" && !row.archived
                      }
                      serverPagination={serverPagination}
                    />
                  </>
                ) : null}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
