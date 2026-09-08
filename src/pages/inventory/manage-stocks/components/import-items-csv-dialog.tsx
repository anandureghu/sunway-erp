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
  ITEM_CSV_CANONICAL_FIELDS,
  importItemsCsv,
  previewItemsCsv,
  type ItemCsvImportResult,
  type ItemCsvPreview,
} from "@/service/inventoryService";

const TEMPLATE_HEADERS = [
  "Item Code",
  "Item Name (EN)",
  "Category",
  "Sub-Category",
  "UOM",
  "Brand / Manufacturer",
  "Model / Part No.",
  "Description",
  "Item Type",
  "Criticality",
  "HSN / Tariff Code",
  "Unit Cost (QAR)",
  "Selling Price (QAR)",
  "VAT Applicable",
  "Reorder Level",
  "Reorder Qty",
  "Min Stock",
  "Max Stock",
  "Lead Time (Days)",
  "Default Warehouse",
  "Shelf / Bin Location",
  "Preferred Supplier",
  "Supplier Part No.",
  "Weight (kg)",
  "Dimensions (LxWxH)",
  "Warranty (Months)",
  "Status",
  "Remarks",
];

const FIELD_LABELS: Record<string, string> = {
  sku: "Item Code / SKU",
  name: "Item Name",
  category: "Category",
  subCategory: "Sub-Category",
  warehouse: "Default Warehouse",
  quantity: "Quantity",
  unitMeasure: "UOM",
  barcode: "Barcode",
  brand: "Brand",
  type: "Item Type",
  model: "Model",
  manufacturerPartNumber: "Manufacturer Part No.",
  location: "Shelf / Bin",
  description: "Description",
  remarks: "Remarks",
  serialNo: "Serial No.",
  dateReceived: "Date Received",
  expiryDate: "Expiry Date",
  status: "Status",
  costPrice: "Unit Cost",
  sellingPrice: "Selling Price",
  reorderLevel: "Reorder Level",
  reorderQty: "Reorder Qty",
  minimum: "Min Stock",
  maximum: "Max Stock",
  criticality: "Criticality",
  hsnCode: "HSN / Tariff Code",
  vatApplicable: "VAT Applicable",
  leadTimeDays: "Lead Time (Days)",
  preferredSupplier: "Preferred Supplier",
  supplierPartNo: "Supplier Part No.",
  weightKg: "Weight (kg)",
  dimensions: "Dimensions",
  warrantyMonths: "Warranty (Months)",
};

type Props = {
  onImported: () => void;
};

export function ImportItemsCsvDialog({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ItemCsvPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [result, setResult] = useState<ItemCsvImportResult | null>(null);
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
      [
        "ITM-0001",
        "Split AC Unit 2 Ton",
        "HVAC",
        "Air Conditioning",
        "Unit",
        "Daikin",
        "FTX250N",
        "2-ton split AC",
        "Stock",
        "Critical",
        "8415.1",
        "6200",
        "7500",
        "Yes",
        "5",
        "2",
        "10",
        "30",
        "14",
        "WH-001 Main Store",
        "A1-01-01",
        "Gulf Refrigeration",
        "DKN-FTXZ50N",
        "45",
        "98x30x22",
        "24",
        "Active",
        "",
      ]
        .map((v) => `"${v}"`)
        .join(","),
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

  const handleFile = async (selected: File | undefined) => {
    if (!selected) return;
    setFile(selected);
    setLoading(true);
    setPreview(null);
    setResult(null);
    try {
      const res = await previewItemsCsv(selected);
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
      const res = await importItemsCsv(file, mapping);
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
            maxWidth: 680,
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
                  Bulk upload items
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
                Upload your item spreadsheet as-is
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-6 text-xs text-sky-900/80">
                <li>Arabic / AR name columns are ignored</li>
                <li>
                  Category, sub-category, warehouse, and supplier are matched
                  when found — otherwise left empty (warehouse falls back to
                  company default)
                </li>
                <li>Review mapping below before confirming</li>
                <li>Duplicate SKUs are skipped</li>
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
                        {ITEM_CSV_CANONICAL_FIELDS.map((field) => {
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
