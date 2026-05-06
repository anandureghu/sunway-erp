import { Input } from "@/components/ui/input";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useEditableForm } from "@/modules/hr/hooks/use-editable-form";
import { useParams } from "react-router-dom";
import {
  contractService,
  type ContractApiPayload,
  type AllowancePayload,
} from "@/service/contractService";
import { salaryService } from "@/service/salaryService";
import { downloadContractPdf } from "@/service/contractPdfService";
import { toast } from "sonner";
import type { ContractType, ContractStatus } from "@/types/hr";
import { FormField } from "@/modules/hr/components/form-components";
import {
  Plus,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  PenTool,
  Upload,
  Clock,
  User,
  Hash,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ================= TYPES ================= */

interface SalaryAllowanceRow {
  id: string;
  customName: string;
  amount: string;
  effectiveDate: string;
  note: string;
}

interface SalaryOption {
  name: string;
  amount: string;
  effectiveDate: string;
}

interface ContractFormData {
  contractCode: string;
  staffName: string;
  contractType: ContractType;
  status: ContractStatus;
  effectiveDate: string;
  expirationDate: string;
  contractPeriodMonths: number;
  noticePeriodDays: number;
  salaryRateType: string;
  salaryRows: SalaryAllowanceRow[];
  signatureDate: string;
  signedBy: string;
  termsAndConditions: string;
  attachmentUrl: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const createEmptyRow = (): SalaryAllowanceRow => ({
  id: crypto.randomUUID(),
  customName: "",
  amount: "",
  effectiveDate: "",
  note: "",
});

/* ================= STATUS COLORS ================= */

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "DRAFT":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "EXPIRED":
      return "bg-red-50 text-red-700 border-red-200";
    case "TERMINATED":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getContractTypeColor = (type: string) => {
  switch (type) {
    case "PERMANENT":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "TEMPORARY":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "CONTRACT":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "PART_TIME":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "INTERN":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "CONSULTANT":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "PROBATION":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

/* ================= HELPERS ================= */

function buildSalaryOptions(s: any): SalaryOption[] {
  if (!s) return [];
  const effectiveDate = s.effectiveFrom ?? "";
  const opts: SalaryOption[] = [];

  if (Number(s.basicSalary) > 0)
    opts.push({ name: "Basic Salary", amount: String(s.basicSalary), effectiveDate });
  if (s.transportationType === "ALLOWANCE" && Number(s.transportationAllowance) > 0)
    opts.push({ name: "Transportation Allowance", amount: String(s.transportationAllowance), effectiveDate });
  if (s.travelType === "ALLOWANCE" && Number(s.travelAllowance) > 0)
    opts.push({ name: "Travel Allowance", amount: String(s.travelAllowance), effectiveDate });
  if (s.housingType === "ALLOWANCE" && Number(s.housingAllowance) > 0)
    opts.push({ name: "Housing Allowance", amount: String(s.housingAllowance), effectiveDate });
  if (Number(s.otherAllowance) > 0)
    opts.push({ name: "Other Allowance", amount: String(s.otherAllowance), effectiveDate });

  return opts;
}

/* ================= COMPONENT ================= */

export default function EmployeeContractForm() {
  const { id } = useParams<{ id: string }>();

  const employeeId = (() => {
    if (!id || id.trim() === "") return undefined;
    const parsed = Number(id);
    if (Number.isNaN(parsed) || parsed <= 0) return undefined;
    return parsed;
  })();

  const [exists, setExists] = useState(false);
  const [contractId, setContractId] = useState<number | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [salaryOptions, setSalaryOptions] = useState<SalaryOption[]>([]);
  // Silently fetched for save matching — not used for UI
  const allowanceTypeMapRef = useRef<Map<string, number>>(new Map());

  const loadingContractRef = useRef(false);
  const savingRef = useRef(false);
  const contractLoadedRef = useRef(false);

  const initialFormData = useMemo<ContractFormData>(
    () => ({
      contractCode: "",
      staffName: "",
      contractType: "PERMANENT",
      status: "DRAFT",
      effectiveDate: new Date().toISOString().slice(0, 10),
      expirationDate: "",
      contractPeriodMonths: 0,
      noticePeriodDays: 30,
      salaryRateType: "MONTHLY",
      salaryRows: [createEmptyRow()],
      signatureDate: new Date().toISOString().slice(0, 10),
      signedBy: "",
      termsAndConditions: "",
      attachmentUrl: "",
    }),
    []
  );

  const {
    editing,
    formData,
    updateField,
    setFields,
    handleEdit,
    handleSave,
    handleCancel,
  } = useEditableForm<ContractFormData>({
    initialData: initialFormData,
    onSave: async (data) => {
      if (savingRef.current) return;
      savingRef.current = true;

      try {
        const validEmployeeId = employeeId as number;
        if (!validEmployeeId) throw new Error("Invalid employee ID");

        const today = new Date().toISOString().slice(0, 10);
        const allowances: AllowancePayload[] = data.salaryRows
          .filter(
            (r) =>
              r.customName.trim() !== "" &&
              String(r.amount).trim() !== "" &&
              Number(r.amount) > 0
          )
          .map((r) => {
            const name = r.customName.trim();
            // Try to find matching allowanceTypeId by name (case-insensitive fuzzy)
            const map = allowanceTypeMapRef.current;
            let allowanceTypeId: number | undefined;
            for (const [key, val] of map.entries()) {
              if (
                key.toLowerCase() === name.toLowerCase() ||
                key.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(key.toLowerCase())
              ) {
                allowanceTypeId = val;
                break;
              }
            }
            return {
              allowanceTypeId,
              customName: name,
              amount: Number(r.amount),
              effectiveDate: r.effectiveDate || today,
              note: r.note?.trim() || undefined,
            };
          });

        if (allowances.length === 0) {
          toast.error("Please add at least one allowance with a type and amount");
          return;
        }

        const payload: ContractApiPayload = {
          contractType: data.contractType,
          status: data.status,
          effectiveDate: data.effectiveDate,
          expirationDate: data.expirationDate || undefined,
          noticePeriodDays: data.noticePeriodDays || undefined,
          salaryRateType: data.salaryRateType || undefined,
          signatureDate: data.signatureDate || undefined,
          signedBy: data.signedBy || undefined,
          allowances,
        };

        if (exists && contractId) {
          await contractService.update(contractId, payload);
        } else {
          const result = await contractService.create(validEmployeeId, payload);
          if (result?.id) {
            setContractId(result.id);
            setExists(true);
          }
        }

        await loadContract(validEmployeeId);
        toast.success("Contract saved successfully");
      } catch (err: any) {
        toast.error(contractService.extractErrorMessage(err));
        throw err;
      } finally {
        savingRef.current = false;
      }
    },
  });

  /* ================= LOAD CONTRACT ================= */

  const loadContract = useCallback(
    async (empId: number) => {
      if (loadingContractRef.current) return;
      if (!empId) return;

      loadingContractRef.current = true;

      try {
        // Silently fetch allowance types for ID matching on save (not shown in UI)
        try {
          const types = await contractService.getAllowanceTypes();
          const map = new Map<string, number>();
          for (const t of types) map.set(t.name, t.id);
          allowanceTypeMapRef.current = map;
        } catch {
          // allowance-types API unavailable — will save with customName only
        }

        // Always fetch salary first — for dropdown options and pre-population
        let opts: SalaryOption[] = [];
        try {
          const salaryRes = await salaryService.get(empId);
          opts = buildSalaryOptions(salaryRes?.data);
          setSalaryOptions(opts);
        } catch {
          // Salary not configured yet — options stay empty
        }

        const fresh = await contractService.get(empId);

        if (!fresh) {
          setExists(false);
          setContractId(null);

          // Pre-populate rows from salary data when no contract exists
          if (opts.length > 0) {
            setFields({
              ...initialFormData,
              salaryRows: opts.map((opt) => ({
                id: crypto.randomUUID(),
                customName: opt.name,
                amount: opt.amount,
                effectiveDate: opt.effectiveDate,
                note: "",
              })),
            });
          } else {
            setFields(initialFormData);
          }
          return;
        }

        setExists(true);
        setContractId(fresh.id ?? null);

        const mappedSalaryRows: SalaryAllowanceRow[] =
          fresh.allowances?.length > 0
            ? fresh.allowances.map((a: AllowancePayload & { customName?: string; allowanceType?: string }) => ({
                id: crypto.randomUUID(),
                customName: a.customName ?? a.allowanceType ?? "",
                amount: a.amount != null ? String(a.amount) : "",
                effectiveDate: a.effectiveDate ?? "",
                note: a.note ?? "",
              }))
            : [createEmptyRow()];

        setFields({
          contractCode: fresh.contractCode ?? "",
          staffName: fresh.staffName ?? fresh.employeeName ?? fresh.staff?.name ?? "",
          contractType: fresh.contractType ?? "PERMANENT",
          status: fresh.status ?? "DRAFT",
          effectiveDate: fresh.effectiveDate ?? "",
          expirationDate: fresh.expirationDate ?? "",
          contractPeriodMonths: fresh.contractPeriodMonths ?? 0,
          noticePeriodDays: fresh.noticePeriodDays ?? 30,
          salaryRateType: fresh.salaryRateType ?? "MONTHLY",
          signatureDate: fresh.signatureDate ?? "",
          signedBy: fresh.signedBy ?? "",
          termsAndConditions: fresh.termsAndConditions ?? "",
          attachmentUrl: fresh.attachmentUrl ?? "",
          salaryRows: mappedSalaryRows,
        });

        contractLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading contract:", error);
      } finally {
        loadingContractRef.current = false;
      }
    },
    [initialFormData, setFields]
  );

  useEffect(() => {
    if (!employeeId) return;
    loadContract(employeeId);
  }, [employeeId, loadContract]);

  useEffect(() => {
    document.addEventListener("contract:start-edit", handleEdit as EventListener);
    document.addEventListener("contract:save", handleSave as EventListener);
    document.addEventListener("contract:cancel", handleCancel as EventListener);

    return () => {
      document.removeEventListener("contract:start-edit", handleEdit as EventListener);
      document.removeEventListener("contract:save", handleSave as EventListener);
      document.removeEventListener("contract:cancel", handleCancel as EventListener);
    };
  }, [handleEdit, handleSave, handleCancel]);

  /* ================= VALIDATION ================= */

  const validateForm = (data: ContractFormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.staffName?.trim()) errors.staffName = "Staff name is required";
    if (!data.contractType) errors.contractType = "Contract type is required";
    if (!data.effectiveDate) errors.effectiveDate = "Effective date is required";
    if (!data.status) errors.status = "Status is required";
    return errors;
  };

  const errors = validateForm(formData);

  /* ================= ROW HELPERS ================= */

  const updateRow = (rowId: string, field: keyof SalaryAllowanceRow, value: string) => {
    updateField("salaryRows")(
      formData.salaryRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const addRow = () => updateField("salaryRows")([...formData.salaryRows, createEmptyRow()]);

  const removeRow = (rowId: string) => {
    if (formData.salaryRows.length <= 1) return;
    updateField("salaryRows")(formData.salaryRows.filter((r) => r.id !== rowId));
  };

  /* ================= CALCULATED VALUES ================= */

  const totalSalary = formData.salaryRows.reduce((sum, row) => {
    return sum + (parseFloat(String(row.amount).replace(/[^0-9.]/g, "")) || 0);
  }, 0);

  const validRows = formData.salaryRows.filter(
    (r) => r.customName || r.amount || r.effectiveDate || r.note
  );

  /* ================= PDF ================= */

  const buildPdfData = useCallback(() => ({
    contractCode: formData.contractCode,
    staffName: formData.staffName,
    contractType: formData.contractType,
    status: formData.status,
    effectiveDate: formData.effectiveDate,
    expirationDate: formData.expirationDate,
    contractPeriodMonths: formData.contractPeriodMonths,
    noticePeriodDays: formData.noticePeriodDays,
    salaryRateType: formData.salaryRateType,
    signatureDate: formData.signatureDate,
    signedBy: formData.signedBy,
    termsAndConditions: formData.termsAndConditions,
    salaryRows: formData.salaryRows.map((row) => ({ ...row, customName: row.customName })),
  }), [formData]);

  const handleDownloadPdf = () => {
    if (!exists || !contractId) {
      toast.error("Save the contract before downloading the PDF");
      return;
    }
    try {
      downloadContractPdf(buildPdfData());
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to open PDF window");
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-violet-100 p-1.5 rounded-lg">
            <FileText className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-800 leading-tight">Employee Contract</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage employment contract details and terms</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {formData.status && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(formData.status)}`}>
                {formData.status}
              </span>
            )}
            {formData.contractType && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getContractTypeColor(formData.contractType)}`}>
                {formData.contractType}
              </span>
            )}
            <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={!exists || !contractId}
                title={!exists ? "Save the contract first" : "Download PDF"}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Summary */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-xl px-4 py-3 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold opacity-90 uppercase tracking-wide">Contract Summary</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wide mb-0.5">Contract Code</p>
              <p className="text-sm font-bold">{formData.contractCode || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wide mb-0.5">Duration</p>
              <p className="text-sm font-bold">{formData.contractPeriodMonths ? `${formData.contractPeriodMonths} months` : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wide mb-0.5">Start Date</p>
              <p className="text-sm font-bold">{formData.effectiveDate || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wide mb-0.5">Notice Period</p>
              <p className="text-sm font-bold">{formData.noticePeriodDays ? `${formData.noticePeriodDays} days` : "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">

        {/* General Information */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">General Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            <FormField label="Contract Code" required>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                  disabled={!editing}
                  value={formData.contractCode}
                  onChange={(e) => updateField("contractCode")(e.target.value)}
                />
              </div>
            </FormField>

            <FormField label="Staff Name" required error={errors.staffName}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                  disabled={!editing}
                  placeholder="Enter staff name"
                  value={formData.staffName}
                  onChange={(e) => updateField("staffName")(e.target.value)}
                />
              </div>
            </FormField>

            <FormField label="Contract Type" required error={errors.contractType}>
              <Select
                value={formData.contractType}
                onValueChange={(v) => updateField("contractType")(v as ContractType)}
                disabled={!editing}
              >
                <SelectTrigger className="h-11 border-slate-300 rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                  <SelectItem value="TEMPORARY">Temporary</SelectItem>
                  <SelectItem value="INTERN">Intern</SelectItem>
                  <SelectItem value="CONSULTANT">Consultant</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Status" required error={errors.status}>
              <Select
                value={formData.status}
                onValueChange={(v) => updateField("status")(v as ContractStatus)}
                disabled={!editing}
              >
                <SelectTrigger className="h-11 border-slate-300 rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Effective Date" required error={errors.effectiveDate}>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                  disabled={!editing}
                  value={formData.effectiveDate}
                  onChange={(e) => updateField("effectiveDate")(e.target.value)}
                />
              </div>
            </FormField>

            <FormField label="Expiration Date">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                  disabled={!editing}
                  value={formData.expirationDate}
                  onChange={(e) => updateField("expirationDate")(e.target.value)}
                />
              </div>
            </FormField>

            <FormField label="Contract Period (Months)">
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                  disabled={!editing}
                  placeholder="0"
                  value={formData.contractPeriodMonths || ""}
                  onChange={(e) => updateField("contractPeriodMonths")(Number(e.target.value) || 0)}
                />
              </div>
            </FormField>

            <FormField label="Notice Period (Days)">
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                  disabled={!editing}
                  placeholder="30"
                  value={formData.noticePeriodDays || ""}
                  onChange={(e) => updateField("noticePeriodDays")(Number(e.target.value) || 0)}
                />
              </div>
            </FormField>

            <FormField label="Salary Rate Type">
              <Select
                value={formData.salaryRateType}
                onValueChange={(v) => updateField("salaryRateType")(v)}
                disabled={!editing}
              >
                <SelectTrigger className="h-11 border-slate-300 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="HOURLY">Hourly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </section>

        {/* Salary & Allowances */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
              <DollarSign className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-700">Salary & Allowances</h3>
              <p className="text-xs text-slate-400">Fetched from the employee's salary setup</p>
            </div>
            {validRows.length > 0 && (
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200 text-xs font-semibold">
                Total: ${totalSalary.toLocaleString()}
              </div>
            )}
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700">
                  <th className="w-12 px-4 py-3 text-center font-semibold border-r border-slate-200">#</th>
                  <th className="px-4 py-3 text-left font-semibold border-r border-slate-200 min-w-[220px]">Allowance Type</th>
                  <th className="w-40 px-4 py-3 text-left font-semibold border-r border-slate-200">Amount</th>
                  <th className="w-40 px-4 py-3 text-left font-semibold border-r border-slate-200">Effective Date</th>
                  <th className="px-4 py-3 text-left font-semibold border-r border-slate-200 min-w-[150px]">Note</th>
                  {editing && <th className="w-14 px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {formData.salaryRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-t border-slate-200 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/50 transition-colors`}
                  >
                    <td className="px-4 py-3 text-center text-slate-500 border-r border-slate-200 font-medium">
                      {idx + 1}
                    </td>

                    {/* Allowance Type — dropdown sourced from salary setup */}
                    <td className="px-2 py-2 border-r border-slate-200">
                      {editing ? (
                        <Select
                          value={row.customName}
                          onValueChange={(v) => {
                            const matched = salaryOptions.find((o) => o.name === v);
                            updateField("salaryRows")(
                              formData.salaryRows.map((r) =>
                                r.id === row.id
                                  ? {
                                      ...r,
                                      customName: v,
                                      amount: matched?.amount ?? r.amount,
                                      effectiveDate: matched?.effectiveDate ?? r.effectiveDate,
                                    }
                                  : r
                              )
                            );
                          }}
                        >
                          <SelectTrigger className="h-10 border-0 shadow-none focus:ring-2 focus:ring-indigo-400 bg-transparent rounded-lg text-sm">
                            <SelectValue placeholder="Select allowance type" />
                          </SelectTrigger>
                          <SelectContent>
                            {salaryOptions.map((opt) => (
                              <SelectItem key={opt.name} value={opt.name}>
                                {opt.name}
                              </SelectItem>
                            ))}
                            {/* Allow manually typed names to remain selected */}
                            {row.customName && !salaryOptions.find((o) => o.name === row.customName) && (
                              <SelectItem value={row.customName}>{row.customName}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="h-10 flex items-center px-3 text-slate-700 font-medium">
                          {row.customName || "—"}
                        </div>
                      )}
                    </td>

                    <td className="px-2 py-2 border-r border-slate-200">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                        <Input
                          type="text"
                          className="h-10 pl-7 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-indigo-400 bg-transparent rounded-lg"
                          disabled={!editing}
                          value={row.amount}
                          onChange={(e) => updateRow(row.id, "amount", e.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder="0.00"
                        />
                      </div>
                    </td>

                    <td className="px-2 py-2 border-r border-slate-200">
                      <Input
                        type="date"
                        className="h-10 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-indigo-400 bg-transparent rounded-lg"
                        disabled={!editing}
                        value={row.effectiveDate}
                        onChange={(e) => updateRow(row.id, "effectiveDate", e.target.value)}
                      />
                    </td>

                    <td className="px-2 py-2 border-r border-slate-200">
                      <Input
                        className="h-10 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-indigo-400 bg-transparent rounded-lg"
                        disabled={!editing}
                        value={row.note}
                        onChange={(e) => updateRow(row.id, "note", e.target.value)}
                        placeholder={editing ? "Add note..." : ""}
                      />
                    </td>

                    {editing && (
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {editing && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors px-3 py-2 hover:bg-indigo-50 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                  Add Allowance Row
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Signing Information */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
              <PenTool className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Signing Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <FormField label="Signature Date">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                  disabled={!editing}
                  value={formData.signatureDate}
                  onChange={(e) => updateField("signatureDate")(e.target.value)}
                />
              </div>
            </FormField>

            <FormField label="Signed By">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                  disabled={!editing}
                  placeholder="Enter signatory name"
                  value={formData.signedBy}
                  onChange={(e) => updateField("signedBy")(e.target.value)}
                />
              </div>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Attachment">
                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Upload className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    {attachmentFile ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        <span className="font-medium text-slate-700">{attachmentFile.name}</span>
                        <button
                          type="button"
                          onClick={() => { setAttachmentFile(null); updateField("attachmentUrl")(""); }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-700 font-medium">
                          {editing ? "Click to upload or drag and drop" : "No file uploaded"}
                        </p>
                        <p className="text-xs text-slate-500">PDF, DOC, DOCX up to 10MB</p>
                      </div>
                    )}
                  </div>
                  {editing && (
                    <label className="cursor-pointer px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md">
                      Browse Files
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setAttachmentFile(file);
                          updateField("attachmentUrl")(file ? file.name : "");
                        }}
                      />
                    </label>
                  )}
                </div>
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Terms and Conditions">
                <textarea
                  className="w-full min-h-[100px] p-3 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all resize-none"
                  disabled={!editing}
                  value={formData.termsAndConditions}
                  onChange={(e) => updateField("termsAndConditions")(e.target.value)}
                  placeholder="Enter any additional terms and conditions..."
                />
              </FormField>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
