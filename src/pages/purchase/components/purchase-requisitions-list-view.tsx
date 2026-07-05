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
import type { PurchaseRequisition } from "@/types/purchase";
import type { ColumnDef, Row, RowSelectionState } from "@tanstack/react-table";
import { PageHeader } from "@/components/PageHeader";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";

type RequisitionTab = "active" | "converted";

type Props = {
  loading: boolean;
  error: string | null;
  requisitions: PurchaseRequisition[];
  searchQuery: string;
  statusFilter: string;
  listTab?: RequisitionTab;
  onListTabChange?: (tab: RequisitionTab) => void;
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
}: Props) {
  const [internalTab, setInternalTab] = useState<RequisitionTab>("active");
  const tab = listTabProp ?? internalTab;

  const setTab = (value: RequisitionTab) => {
    if (onListTabChange) onListTabChange(value);
    else setInternalTab(value);
  };

  const activeReqs = useMemo(
    () =>
      requisitions.filter((r) => r.status !== "converted" && !r.archived),
    [requisitions],
  );
  const convertedReqs = useMemo(
    () =>
      requisitions.filter((r) => r.status === "converted" && !r.archived),
    [requisitions],
  );
  
  const activeUnarchivedCount = useMemo(
    () => requisitions.filter((r) => r.status !== "converted" && !r.archived).length,
    [requisitions],
  );
  const convertedUnarchivedCount = useMemo(
    () => requisitions.filter((r) => r.status === "converted" && !r.archived).length,
    [requisitions],
  );

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
                    Active {activeUnarchivedCount}
                  </TabsTrigger>
                  <TabsTrigger value="converted" className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Converted To Purchase Order {convertedUnarchivedCount}
                  </TabsTrigger>
                </TabsList>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search…"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-8 w-56 sm:w-64"
                    />
                  </div>
                  {tab === "active" ? (
                    <Select value={statusFilter} onValueChange={onStatusChange}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              </div>

              <TabsContent value="active" className="mt-4">
                <SelectableDataTable
                  columns={columns}
                  data={activeReqs}
                  onRowClick={onRowClick}
                />
              </TabsContent>
              <TabsContent value="converted" className="mt-4 space-y-4">
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
                  data={convertedReqs}
                  onRowClick={onRowClick}
                  enableRowSelection={enableBulkArchive}
                  rowSelection={rowSelection}
                  onRowSelectionChange={onRowSelectionChange}
                  getRowId={(row) => row.id}
                  isRowSelectable={(row) =>
                    row.status === "converted" && !row.archived
                  }
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
