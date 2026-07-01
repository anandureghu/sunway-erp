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
    <Tabs defaultValue="details" className="space-y-4">
      <TabsList className="h-auto flex-wrap gap-1 bg-muted/50 p-1">
        <TabsTrigger value="details" className="gap-1.5 px-4">
          <Package className="h-4 w-4" />
          Product details
        </TabsTrigger>
        <TabsTrigger value="batches" className="gap-1.5 px-4">
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
        <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Inventory cost layers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            FIFO batches, movement history, and expiry insights for{" "}
            <span className="font-medium text-foreground">{item.name}</span>.
          </p>
        </div>
        <ItemBatchReportsPanel itemId={item.id} mode="item" />
      </TabsContent>
    </Tabs>
  );
}
