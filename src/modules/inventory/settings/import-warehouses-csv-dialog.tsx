"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  WAREHOUSE_CSV_CANONICAL_FIELDS,
  importWarehousesCsv,
  previewWarehousesCsv,
  type WarehouseCsvImportResult,
  type WarehouseCsvPreview,
} from "@/service/inventoryService";

const TEMPLATE_HEADERS = [
  "Warehouse Code",
  "Warehouse Name",
  "Type",
  "Address",
  "City",
  "Manager",
  "Contact No.",
  "Capacity (Pallets)",
  "Status",
];

const FIELD_LABELS: Record<string, string> = {
  warehouseCode: "Warehouse Code",
  warehouseName: "Warehouse Name",
  warehouseType: "Type",
  street: "Address / Street",
  city: "City",
  manager: "Manager",
  phone: "Contact No.",
  capacity: "Capacity (Pallets)",
  status: "Status",
  country: "Country",
  pin: "PIN / ZIP",
  contactPersonName: "Contact Person",
};

type Props = {
  onImported: () => void;
};

export function ImportWarehousesCsvDialog({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<WarehouseCsvPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [result, setResult] = useState<WarehouseCsvImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setMapping({});
    setResult(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const sample = [
      TEMPLATE_HEADERS.join(","),
      '"WH-001","Main Store – Industrial Area","General","Street 44, Industrial Area","Doha","Abdullah Al Mansouri","+974 5567 8901","500","Active"',
      '"WH-002","Chemical Store – Industrial Area","Hazardous","Street 12, Industrial Area","Doha","Rizwan Ahmed","+974 5000 1122","80","Active"',
      '"WH-003","Al Wakra Site Store","Site Store","Al Wakra Industrial Zone","Al Wakra","Mark Reyes","+974 3333 4444","120","Active"',
    ].join("\n");
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "warehouses-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFile = async (selected: File | undefined) => {
    if (!selected) return;
    setFile(selected);
    setLoading(true);
    setPreview(null);
    setResult(null);
    try {
      const res = await previewWarehousesCsv(selected);
      setPreview(res);
      setMapping({ ...(res.fieldMapping || {}) });
      if (res.warnings?.length) {
        toast.message(res.warnings[0]);
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
          "Failed to preview CSV",
      );
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await importWarehousesCsv(file, mapping);
      setResult(res);
      if (res.created > 0) {
        toast.success(
          `Imported ${res.created} warehouse${res.created === 1 ? "" : "s"}`,
        );
        onImported();
      } else if (res.failed === 0 && res.skipped > 0) {
        toast.message(`No new warehouses — ${res.skipped} skipped`);
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
      setImporting(false);
    }
  };

  const usedTargets = new Set(
    Object.values(mapping).filter((v): v is string => !!v),
  );
  const mappingEntries = Object.entries(mapping);

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
          style={{
            maxWidth: 640,
            maxHeight: "92vh",
            width: "calc(100vw - 32px)",
          }}
        >
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-emerald-100 text-emerald-700">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                  Bulk upload warehouses
                </DialogTitle>
                <p className="mt-0.5 text-[12px] text-slate-300">
                  Preview column mapping, then confirm import
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
                Upload your warehouse spreadsheet as-is
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-6 text-xs text-sky-900/80">
                <li>
                  Headers are mapped to our fields (AI when configured, else
                  heuristics)
                </li>
                <li>Arabic / AR name columns are ignored</li>
                <li>Review mapping below before confirming</li>
                <li>Duplicate warehouse codes are skipped</li>
                <li>
                  Manager names are matched to employees when possible;
                  otherwise stored as contact person
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4" />
                Download template
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={loading || importing}
                onClick={() => inputRef.current?.click()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {loading ? "Mapping columns…" : "Choose CSV file"}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
            </div>

            {file && (
              <p className="text-xs text-muted-foreground">
                Selected: {file.name}
                {preview ? ` · ${preview.dataRowCount} data row(s)` : ""}
                {preview?.aiMapped != null
                  ? ` · Mapping: ${preview.aiMapped ? "AI" : "heuristic"}`
                  : ""}
              </p>
            )}

            {preview && !result && (
              <div className="rounded-lg border bg-slate-50 p-3 text-sm space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Column mapping — adjust if needed
                </p>
                <ul className="space-y-2 max-h-56 overflow-y-auto">
                  {mappingEntries.map(([source, target]) => (
                    <li
                      key={source}
                      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                        {source}
                      </span>
                      <select
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
                        value={target ?? ""}
                        onChange={(e) => {
                          const next = e.target.value || null;
                          setMapping((prev) => ({ ...prev, [source]: next }));
                        }}
                      >
                        <option value="">Ignore</option>
                        {WAREHOUSE_CSV_CANONICAL_FIELDS.map((field) => {
                          const taken =
                            usedTargets.has(field) && target !== field;
                          return (
                            <option key={field} value={field} disabled={taken}>
                              {FIELD_LABELS[field] || field}
                            </option>
                          );
                        })}
                      </select>
                    </li>
                  ))}
                </ul>

                {preview.sampleRows.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                      Sample (mapped)
                    </p>
                    <pre className="max-h-28 overflow-auto rounded bg-white border p-2 text-[11px] text-slate-600">
                      {JSON.stringify(preview.sampleRows[0], null, 2)}
                    </pre>
                  </div>
                )}

                <Button
                  className="w-full gap-1.5"
                  disabled={importing}
                  onClick={() => void handleConfirmImport()}
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {importing ? "Importing…" : "Confirm import"}
                </Button>
              </div>
            )}

            {result && (
              <div className="rounded-lg border bg-slate-50 p-3 text-sm space-y-3">
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
                        {err.code ? ` (${err.code})` : ""}: {err.message}
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
