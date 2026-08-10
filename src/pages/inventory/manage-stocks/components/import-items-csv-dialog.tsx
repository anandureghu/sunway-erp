"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Download, FileSpreadsheet, X, Loader2, Sparkles } from "lucide-react";
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
        toast.success(
          res.aiMapped
            ? `Imported ${res.created} item(s) (AI column mapping)`
            : `Imported ${res.created} item(s)`,
        );
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

  const mappingEntries = result?.fieldMapping
    ? Object.entries(result.fieldMapping)
    : [];

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
        Bulk upload
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
          style={{ maxWidth: 560, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
        >
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-emerald-100 text-emerald-700">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                  Bulk upload inventory items
                </DialogTitle>
                <p className="mt-0.5 text-[12px] text-slate-300">
                  Any CSV format — AI maps columns to our fields
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

          <div className="space-y-4 px-6 py-5 overflow-y-auto max-h-[75vh]">
            <div className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-sm text-sky-950">
              <p className="flex items-start gap-2 font-medium">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                Upload your supplier/customer spreadsheet as-is
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-6 text-xs text-sky-900/80">
                <li>
                  Column titles are mapped to our fields (sku, name, category, prices, …)
                  with OpenAI when configured
                </li>
                <li>Unmapped columns are kept in item metadata (not discarded)</li>
                <li>
                  If warehouse is missing, the company&apos;s first warehouse is used
                </li>
                <li>Duplicate SKUs are skipped</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadTemplate}>
                <Download className="h-4 w-4" />
                Optional template
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
                {loading ? "Mapping & importing…" : "Choose CSV file"}
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
              <div className="rounded-lg border bg-slate-50 p-3 text-sm space-y-3">
                <p>
                  Created <strong>{result.created}</strong>
                  {" · "}
                  Skipped <strong>{result.skipped}</strong>
                  {" · "}
                  Failed <strong>{result.failed}</strong>
                  {result.aiMapped != null && (
                    <>
                      {" · "}
                      Mapping:{" "}
                      <strong>{result.aiMapped ? "AI" : "heuristic"}</strong>
                    </>
                  )}
                </p>

                {mappingEntries.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                      Column mapping
                    </p>
                    <ul className="max-h-36 overflow-y-auto text-xs text-slate-600 space-y-0.5">
                      {mappingEntries.map(([source, target]) => (
                        <li key={source} className="flex gap-2">
                          <span className="min-w-0 truncate font-medium text-slate-800">
                            {source}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className={target ? "text-emerald-700" : "text-amber-700"}>
                            {target || "metadata"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
