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
    <Tabs defaultValue="details" className="mx-auto max-w-6xl space-y-4">
      <TabsList className="h-auto flex-wrap gap-1 rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
        <TabsTrigger
          value="details"
          className="gap-1.5 rounded-lg px-4 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
        >
          <Package className="h-4 w-4" />
          Product details
        </TabsTrigger>
        <TabsTrigger
          value="batches"
          className="gap-1.5 rounded-lg px-4 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
        >
          <Layers className="h-4 w-4" />
          Batches &amp; reports
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-4">
        <ItemDetailSections
          item={item}
          imageNonce={imageNonce}
          onEdit={onEdit}
          onUpdateImage={onUpdateImage}
        />
      </TabsContent>

      <TabsContent value="batches" className="mt-4 space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Inventory cost layers</h2>
          <p className="mt-1 text-sm text-slate-500">
            FIFO batches, movement history, and expiry insights for{" "}
            <span className="font-medium text-slate-800">{item.name}</span>.
          </p>
        </div>
        <ItemBatchReportsPanel itemId={item.id} mode="item" />
      </TabsContent>
    </Tabs>
  );
}
