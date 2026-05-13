"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { updateItemImage } from "@/service/inventoryService";
import { ImagePlus, X, Upload } from "lucide-react";
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
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 480, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-violet-100 text-violet-600">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                Update product image
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                JPG, PNG, or WebP — shown across inventory
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFile(f ?? null);
                }}
                className="file:mr-4 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white file:transition-all hover:file:bg-slate-700"
              />
              {file && (
                <p className="mt-3 text-[12px] text-slate-500">{file.name}</p>
              )}
            </div>

            {preview ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden aspect-square max-h-72 mx-auto">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 aspect-square max-h-72 mx-auto flex items-center justify-center">
                <div className="text-center text-slate-300">
                  <ImagePlus className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-[12px]">No image selected</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            Supported: JPG, PNG, WebP
          </p>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !file}
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Uploading…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  Save image
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}