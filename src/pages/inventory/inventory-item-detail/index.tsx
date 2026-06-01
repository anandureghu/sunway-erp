import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { getItemById } from "@/service/inventoryService";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CreateItemForm from "../item-form";
import { ChangeItemImageDialog } from "./change-item-image-dialog";
import { InventoryPageHeader } from "@/components/inventory-page-header";
import { ItemGallery } from "./ItemGallery";
import { ItemPriceBlock } from "./ItemPriceBlock";
import { ItemStockSpecs } from "./ItemStockSpecs";
import { ItemMeta } from "./ItemMeta";

function apiErrorMessage(e: unknown): string {
  const ax = e as { response?: { data?: { message?: string } }; message?: string };
  return ax.response?.data?.message ?? ax.message ?? "Failed to load item";
}

export default function InventoryItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem]           = useState<ItemResponseDTO | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [editOpen, setEditOpen]   = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageNonce, setImageNonce] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getItemById(id);
        if (!cancelled) setItem(data);
      } catch (e: unknown) {
        if (!cancelled) { setError(apiErrorMessage(e)); setItem(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading product…</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <Package className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-center text-muted-foreground">{error ?? "Item not found."}</p>
        <Button variant="outline" onClick={() => navigate("/inventory/stocks")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to catalog
        </Button>
      </div>
    );
  }


  return (
    <div className="min-h-screen">
      <div className="w-full px-4 py-6 sm:px-6 lg:py-10 space-y-6">
        <InventoryPageHeader
          title={item.name}
          description={`${item.category ?? "Uncategorized"} · SKU ${item.sku ?? item.id}`}
          variant="item"
          backHref="/inventory/stocks"
        >
          <Package className="h-6 w-6 text-white" />
        </InventoryPageHeader>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Gallery */}
          <div className="lg:col-span-3">
            <ItemGallery
              item={item}
              imageNonce={imageNonce}
              onUpdateImage={() => setImageDialogOpen(true)}
            />
          </div>

          {/* Info panel */}
          <div className="lg:col-span-9 space-y-6">
            <ItemPriceBlock
              item={item}
              onEdit={() => setEditOpen(true)}
              onUpdateImage={() => setImageDialogOpen(true)}
            />
            <ItemStockSpecs item={item} />
            <ItemMeta item={item} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ChangeItemImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        itemId={String(item.id)}
        onUpdated={(updated) => { setItem(updated); setImageNonce((n) => n + 1); }}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>Update catalog details. SKU cannot be changed.</DialogDescription>
          </DialogHeader>
          <CreateItemForm
            editMode
            initialData={item}
            onSuccess={(newItem) => { setItem(newItem); setImageNonce((n) => n + 1); setEditOpen(false); }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
