"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Download, FileSpreadsheet, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { importItemsCsv, type ItemCsvImportResult } from "@/service/inventoryService";

const TEMPLATE_HEADERS = [
  "sku",
  "name",
  "category",
  "warehouse",
  "quantity",
  "unitMeasure",
  "barcode",
  "brand",
  "costPrice",
  "sellingPrice",
  "status",
  "reorderLevel",
  "minimum",
  "maximum",
  "type",
  "subCategory",
  "location",
  "description",
];

type Props = {
  onImported: () => void;
};

export function ImportItemsCsvDialog({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ItemCsvImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setResult(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const sample = [
      TEMPLATE_HEADERS.join(","),
      '"SKU-001","Widget A","General","Main Warehouse","10","pcs","","Acme","5.00","9.99","active","5","0","100","product","","",""',
    ].join("\n");
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-items-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setResult(null);
    try {
      const res = await importItemsCsv(file);
      setResult(res);
      if (res.created > 0) {
        toast.success(`Imported ${res.created} item(s)`);
        onImported();
      } else if (res.failed === 0 && res.skipped > 0) {
        toast.message(`No new items — ${res.skipped} skipped (duplicate SKU)`);
      } else {
        toast.error("Import finished with errors");
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to import CSV",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
          style={{ maxWidth: 520, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
        >
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-emerald-100 text-emerald-700">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                  Import inventory items
                </DialogTitle>
                <p className="mt-0.5 text-[12px] text-slate-300">
                  Upload a CSV to create items in bulk
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
            <p className="text-sm text-muted-foreground">
              Required columns: <span className="font-medium text-foreground">sku, name, category, warehouse</span>.
              Warehouse can be the warehouse id or name. Duplicate SKUs are skipped.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadTemplate}>
                <Download className="h-4 w-4" />
                Download template
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={loading}
                onClick={() => inputRef.current?.click()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {loading ? "Importing…" : "Choose CSV file"}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
            </div>

            {fileName && (
              <p className="text-xs text-muted-foreground">Selected: {fileName}</p>
            )}

            {result && (
              <div className="rounded-lg border bg-slate-50 p-3 text-sm space-y-2">
                <p>
                  Created <strong>{result.created}</strong>
                  {" · "}
                  Skipped <strong>{result.skipped}</strong>
                  {" · "}
                  Failed <strong>{result.failed}</strong>
                </p>
                {result.errors.length > 0 && (
                  <ul className="max-h-40 overflow-y-auto text-xs text-slate-600 space-y-1">
                    {result.errors.slice(0, 50).map((err, i) => (
                      <li key={`${err.row}-${i}`}>
                        Row {err.row}
                        {err.sku ? ` (${err.sku})` : ""}: {err.message}
                      </li>
                    ))}
                    {result.errors.length > 50 && (
                      <li>…and {result.errors.length - 50} more</li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
