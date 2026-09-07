import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import type { Warehouse } from "@/types/inventory";
import { ClipboardList, Clock, History, Sparkles, Undo2 } from "lucide-react";
import { useState } from "react";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { VarianceFormPanel } from "./variance-form-panel";
import { VarianceHistoryPanel } from "./variance-history-panel";
import { VariancePendingPanel } from "./variance-pending-panel";
import { VarianceSentBackPanel } from "./variance-sent-back-panel";

type VarianceTabProps = {
  items: ItemResponseDTO[];
  warehouses: Warehouse[];
  onStockUpdated: () => Promise<void>;
  canCreate?: boolean;
  canApprove?: boolean;
  canDelete?: boolean;
};

export function VarianceTab({
  items,
  warehouses,
  onStockUpdated,
  canCreate = true,
  canApprove = true,
  canDelete = false,
}: VarianceTabProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const defaultTab = canCreate
    ? "new"
    : canApprove
      ? "pending"
      : "history";

  const handleSubmitted = async () => {
    setRefreshKey((k) => k + 1);
  };

  const handleApproved = async () => {
    setRefreshKey((k) => k + 1);
    await onStockUpdated();
  };

  const visibleTabCount = (canCreate ? 1 : 0) + 3;

  return (
    <div className="mt-6 space-y-6">
      <SecondaryPageHeader
        title="Stock variances"
        description="Submit adjustments and transfers for approval before stock and GL updates"
        icon={<Sparkles className="h-5 w-5 text-white" />}
      />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList
          className={
            visibleTabCount === 4
              ? "grid w-full max-w-2xl grid-cols-4"
              : "grid w-full max-w-2xl grid-cols-3"
          }
        >
          {canCreate ? (
            <TabsTrigger value="new" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              New variance
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="sent-back" className="gap-2">
            <Undo2 className="h-4 w-4" />
            Sent back
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {canCreate ? (
          <TabsContent value="new" className="mt-0 outline-none">
            <VarianceFormPanel
              items={items}
              warehouses={warehouses}
              onSubmitted={handleSubmitted}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="pending" className="mt-0 outline-none">
          <VariancePendingPanel
            refreshKey={refreshKey}
            onUpdated={handleApproved}
          />
        </TabsContent>

        <TabsContent value="sent-back" className="mt-0 outline-none">
          <VarianceSentBackPanel
            items={items}
            warehouses={warehouses}
            refreshKey={refreshKey}
            onResubmitted={handleSubmitted}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none">
          <VarianceHistoryPanel
            refreshKey={refreshKey}
            canArchive={canDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
