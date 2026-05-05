import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DataTable } from "@/components/datatable";
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
import type { ColumnDef, Row } from "@tanstack/react-table";
import { PurchasePageHeader } from "./purchase-page-header";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";

type Props = {
  loading: boolean;
  error: string | null;
  requisitions: PurchaseRequisition[];
  searchQuery: string;
  statusFilter: string;
  columns: ColumnDef<PurchaseRequisition>[];
  onCreateNew: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRetry: () => void;
  onRowClick: (row: Row<PurchaseRequisition>) => void;
  kpiItems?: KpiSummaryStat[];
};

type RequisitionTab = "active" | "converted";

export function PurchaseRequisitionsListView({
  loading,
  error,
  requisitions,
  searchQuery,
  statusFilter,
  columns,
  onCreateNew,
  onSearchChange,
  onStatusChange,
  onRetry,
  onRowClick,
  kpiItems,
}: Props) {
  const [tab, setTab] = useState<RequisitionTab>("active");

  const activeReqs = useMemo(
    () => requisitions.filter((r) => r.status !== "converted"),
    [requisitions],
  );
  const convertedReqs = useMemo(
    () => requisitions.filter((r) => r.status === "converted"),
    [requisitions],
  );

  const handleTabChange = (next: string) => {
    const value = next as RequisitionTab;
    setTab(value);
    if (value === "converted" && statusFilter !== "all") {
      onStatusChange("all");
    } else if (value === "active" && statusFilter === "converted") {
      onStatusChange("all");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PurchasePageHeader
        title="Purchase requisitions"
        description="Submit for approval; approving creates a draft purchase order tied to your preferred supplier."
        backHref="/inventory/purchase"
        actions={
          <Button
            size="lg"
            onClick={onCreateNew}
            className="bg-white text-slate-900 hover:bg-white/90"
          >
            Create requisition
          </Button>
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
                  <TabsTrigger value="active">
                    Active ({activeReqs.length})
                  </TabsTrigger>
                  <TabsTrigger value="converted">
                    Converted To PO ({convertedReqs.length})
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
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              </div>

              <TabsContent value="active" className="mt-4">
                <DataTable
                  columns={columns}
                  data={activeReqs}
                  onRowClick={onRowClick}
                />
              </TabsContent>
              <TabsContent value="converted" className="mt-4">
                <DataTable
                  columns={columns}
                  data={convertedReqs}
                  onRowClick={onRowClick}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
