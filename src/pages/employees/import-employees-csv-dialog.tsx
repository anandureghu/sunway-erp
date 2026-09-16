"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Banknote,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { BulkUploadModule, canBulkUpload } from "@/lib/module-permissions";
import {
  EMPLOYEE_CSV_CANONICAL_FIELDS,
  importEmployeesCsv,
  previewEmployeesCsv,
  type EmployeeCsvImportResult,
  type EmployeeCsvPreview,
} from "@/service/hr.service";

const TEMPLATE_HEADERS = [
  "Employee No",
  "First Name",
  "Middle Name",
  "Last Name",
  "Gender",
  "Prefix",
  "Marital Status",
  "Date of Birth",
  "Join Date",
  "Probation End Date",
  "Status",
  "Nationality",
  "Phone",
  "Email",
  "Department",
  "Company Role",
  "Designation",
  "Work Location",
  "Reporting Manager ID",
  "Bank Name",
  "IBAN",
  "Basic Salary (QAR)",
  "Housing Allowance (QAR)",
  "Transport Allowance (QAR)",
  "Other Allowances (QAR)",
];

const FIELD_LABELS: Record<string, string> = {
  employeeNo: "Employee No",
  firstName: "First Name",
  middleName: "Middle Name",
  lastName: "Last Name",
  gender: "Gender",
  prefix: "Prefix / Title",
  maritalStatus: "Marital Status",
  dateOfBirth: "Date of Birth",
  joinDate: "Join Date",
  probationEndDate: "Probation End Date",
  status: "Status",
  birthplace: "Birthplace",
  hometown: "Hometown",
  nationality: "Nationality",
  religion: "Religion",
  identification: "ID / National ID",
  phoneNo: "Phone",
  altPhone: "Alt Phone",
  email: "Email",
  departmentName: "Department",
  companyRole: "Company Role",
  designation: "Designation (Job Title)",
  workLocation: "Work Location",
  reportingManagerNo: "Reporting Manager No",
  bankName: "Bank Name",
  iban: "IBAN",
  basicSalary: "Basic Salary",
  housingAllowance: "Housing Allowance",
  transportAllowance: "Transport Allowance",
  otherAllowance: "Other Allowances",
};

type Props = { onImported: () => void };

export function ImportEmployeesCsvDialog({ onImported }: Props) {
  const { permissions } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [preview, setPreview] = useState<EmployeeCsvPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [result, setResult] = useState<EmployeeCsvImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const IMPORT_STEPS = [
    { label: "Creating employee records", icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
    { label: "Saving bank details", icon: <Banknote className="h-3.5 w-3.5" /> },
    { label: "Saving compensation", icon: <Briefcase className="h-3.5 w-3.5" /> },
    { label: "Assigning job codes", icon: <Building2 className="h-3.5 w-3.5" /> },
  ];

  const reset = () => {
    setPreview(null);
    setMapping({});
    setResult(null);
    setFile(null);
    setImportStep(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const sample = [
      TEMPLATE_HEADERS.join(","),
      '"EMP-001","Ahmed","","Al Rashidi","Male","Mr","Single","15/03/1990","01/09/2024","15/03/2025","ACTIVE","Qatari","+974 5512 3456","ahmed@company.qa","Operations","Senior Engineer","Software Engineer","Office","EMP-0005","QNB","QA12QNBA000000001234567890","18000","5000","2000","1500"',
    ].join("\n");
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees-import-template.csv";
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
      const res = await previewEmployeesCsv(selected);
      setPreview(res);
      setMapping({ ...(res.fieldMapping || {}) });
      if (res.warnings?.length) toast.message(res.warnings[0]);
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
    setImportStep(0);
    setResult(null);

    // Cycle through steps to show progress while the server processes
    const rowCount = preview?.dataRowCount ?? 1;
    const msPerRow = Math.min(Math.max(rowCount * 80, 800), 6000);
    const stepInterval = Math.floor(msPerRow / IMPORT_STEPS.length);
    const timer = setInterval(() => {
      setImportStep((s) => (s < IMPORT_STEPS.length - 1 ? s + 1 : s));
    }, stepInterval);

    try {
      const res = await importEmployeesCsv(file, mapping);
      clearInterval(timer);
      setImportStep(IMPORT_STEPS.length);
      setResult(res);
      if (res.created > 0 || res.updated > 0) {
        const parts = [];
        if (res.created > 0) parts.push(`${res.created} created`);
        if (res.updated > 0) parts.push(`${res.updated} updated`);
        toast.success(`Employees imported: ${parts.join(", ")}`);
        onImported();
      } else if (res.failed === 0 && res.skipped > 0) {
        toast.message(`No changes — ${res.skipped} skipped`);
      } else {
        toast.error("Import finished with errors");
      }
    } catch (error: unknown) {
      clearInterval(timer);
      setImportStep(0);
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

  if (!canBulkUpload(permissions, BulkUploadModule.HR)) return null;

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
            maxWidth: 700,
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
                  Bulk upload employees
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
            {/* Dependency warning */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <p className="flex items-start gap-2 font-semibold">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                Make sure dependent data exists before uploading
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-6 text-xs text-amber-800">
                <li>
                  <strong>Departments</strong> — employees assigned to a department require it to already exist
                </li>
                <li>
                  <strong>Divisions</strong> — if employees reference divisions, upload those first
                </li>
                <li>
                  <strong>Job Codes</strong> — must be created (and approved) before assigning to employees
                </li>
                <li>
                  <strong>Company Roles</strong> — roles referenced in the CSV must already exist in HR Settings
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-sm text-sky-950">
              <p className="flex items-start gap-2 font-medium">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                Upload your employee spreadsheet as-is
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-6 text-xs text-sky-900/80">
                <li>Headers map to our fields (AI when configured)</li>
                <li>Arabic name columns are ignored</li>
                <li>Dates: DD/MM/YYYY or YYYY-MM-DD</li>
                <li>Each employee gets a system-generated employee number and a linked login account</li>
                <li>Phone and email are saved as contact info</li>
                <li>Bank (IBAN), salary, and job code are saved when columns are present</li>
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
                        {EMPLOYEE_CSV_CANONICAL_FIELDS.map((field) => {
                          const taken = usedTargets.has(field) && target !== field;
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

                {importing ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-medium">Processing {preview?.dataRowCount ?? "…"} rows</span>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((importStep / IMPORT_STEPS.length) * 100)}%` }}
                      />
                    </div>
                    <ul className="space-y-1.5">
                      {IMPORT_STEPS.map((step, idx) => (
                        <li key={idx} className={`flex items-center gap-2 text-xs transition-colors ${idx <= importStep ? "text-emerald-700 font-medium" : "text-slate-400"}`}>
                          {idx < importStep ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          ) : idx === importStep ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-500" />
                          ) : (
                            <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center rounded-full border border-slate-300 text-[9px] text-slate-400">{idx + 1}</span>
                          )}
                          {step.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Button
                    className="w-full gap-1.5"
                    onClick={() => void handleConfirmImport()}
                  >
                    <Upload className="h-4 w-4" />
                    Confirm import
                  </Button>
                )}
              </div>
            )}

            {result && (
              <div className="rounded-lg border bg-slate-50 p-3 text-sm space-y-3">
                <p>
                  Created <strong>{result.created}</strong>
                  {" · "}
                  Updated <strong>{result.updated}</strong>
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
                        {err.employeeNo ? ` (${err.employeeNo})` : ""}: {err.message}
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
