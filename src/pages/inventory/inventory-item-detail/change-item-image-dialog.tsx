import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { updateItemImage } from "@/service/inventoryService";
import { ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function apiErrorMessage(e: unknown): string {
  const ax = e as { response?: { data?: { message?: string } }; message?: string };
  return (
    ax.response?.data?.message ??
    ax.message ??
    "Could not update image"
  );
}

type ChangeItemImageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  onUpdated: (item: ItemResponseDTO) => void;
};

export function ChangeItemImageDialog({
  open,
  onOpenChange,
  itemId,
  onUpdated,
}: ChangeItemImageDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
    }
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSave = async () => {
    if (!file) {
      toast.error("Choose an image file");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateItemImage(itemId, file);
      toast.success("Product image updated");
      onUpdated(updated);
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            Update product image
          </DialogTitle>
          <DialogDescription>
            JPG, PNG, or WebP. The image is stored and shown across inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f ?? null);
            }}
          />
          {preview ? (
            <div className="rounded-lg border bg-muted/30 overflow-hidden aspect-square max-h-64 mx-auto">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Uploading…" : "Save image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
