import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Layers } from "lucide-react";
import { ItemDetailSections } from "./item-detail-sections";
import { ItemBatchReportsPanel } from "./item-batch-reports-panel";
import type { ItemResponseDTO } from "@/service/erpApiTypes";

type Props = {
  item: ItemResponseDTO;
  imageNonce: number;
  onEdit: () => void;
  onUpdateImage: () => void;
};

export function ItemDetailTabs({ item, imageNonce, onEdit, onUpdateImage }: Props) {
  return (
    <Tabs defaultValue="details" className="w-full space-y-3">
      <TabsList className="h-auto flex-wrap gap-1 rounded-lg border border-slate-200/80 bg-white p-1">
        <TabsTrigger
          value="details"
          className="gap-1.5 rounded-md px-3 py-1.5 text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
        >
          <Package className="h-3.5 w-3.5" />
          Product details
        </TabsTrigger>
        <TabsTrigger
          value="batches"
          className="gap-1.5 rounded-md px-3 py-1.5 text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
        >
          <Layers className="h-3.5 w-3.5" />
          Batches &amp; reports
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-3">
        <ItemDetailSections
          item={item}
          imageNonce={imageNonce}
          onEdit={onEdit}
          onUpdateImage={onUpdateImage}
        />
      </TabsContent>

      <TabsContent value="batches" className="mt-3 space-y-3">
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Inventory cost layers</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            FIFO batches, movement history, and expiry insights for{" "}
            <span className="font-medium text-slate-800">{item.name}</span>.
          </p>
        </div>
        <ItemBatchReportsPanel itemId={item.id} mode="item" />
      </TabsContent>
    </Tabs>
  );
}
