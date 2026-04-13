import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormRow } from "@/modules/hr/components/form-components";
import { SelectField } from "@/modules/hr/components/select-field";
import { isValidAmount, isValidDate } from "@/modules/hr/utils/validation";
import { formatMoney } from "@/lib/utils";
import { salaryService } from "@/service/salaryService";
import { fetchCompany } from "@/service/companyService";
import { toast } from "sonner";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Plane,
  Home,
  Car,
  Sparkles,
  Wallet,
  ReceiptText,
  BadgePercent,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Company } from "@/types/company";
import { cn } from "@/lib/utils";

interface SalaryCtx {
  editing: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;
}

type BenefitType = "ALLOWANCE" | "COMPANY_PROVIDED";

const BENEFIT_OPTIONS = [
  { value: "ALLOWANCE",        label: "Company Pays Allowance" },
  { value: "COMPANY_PROVIDED", label: "Company Provides"       },
];

const COMPENSATION_STATUS_OPTIONS = [
  { value: "Active",   label: "Active"   },
  { value: "Inactive", label: "Inactive" },
];

type SalaryFormState = {
  basicSalary:              number;
  transportationType:       BenefitType;
  transportationAllowance:  number;
  travelType:               BenefitType;
  travelAllowance:          number;
  housingType:              BenefitType;
  housingAllowance:         number;
  otherAllowance:           number;
  compensationStatus:       string;
  effectiveFrom:            string;
  effectiveTo:              string;
  payPeriodStart:           string;
  payPeriodEnd:             string;
  numberOfDaysWorked:       string;
  payPerDay:                string;
  overtime:                 string;
};

const INITIAL_STATE: SalaryFormState = {
  basicSalary:             0,
  transportationType:      "COMPANY_PROVIDED",
  transportationAllowance: 0,
  travelType:              "COMPANY_PROVIDED",
  travelAllowance:         0,
  housingType:             "COMPANY_PROVIDED",
  housingAllowance:        0,
  otherAllowance:          0,
  compensationStatus:      "Active",
  effectiveFrom:           "",
  effectiveTo:             "",
  payPeriodStart:          "",
  payPeriodEnd:            "",
  numberOfDaysWorked:      "",
  payPerDay:               "",
  overtime:                "",
};

interface ValidationErrors { [key: string]: string }

// ── helpers ───────────────────────────────────────────────────────────────────
const getStatusMeta = (status: string) => {
  switch (status) {
    case "Active":
      return { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100" };
    case "Inactive":
      return { dot: "bg-slate-400",   badge: "bg-slate-50   text-slate-700   border-slate-200   ring-slate-100"   };
    default:
      return { dot: "bg-blue-500",    badge: "bg-blue-50    text-blue-700    border-blue-200    ring-blue-100"    };
  }
};

// ── sub-components ────────────────────────────────────────────────────────────

/** Compact section divider with icon */
const SectionHeading = ({
  icon,
  label,
  accent = "from-violet-600 to-blue-600",
}: {
  icon: React.ReactNode;
  label: string;
  accent?: string;
}) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white", accent)}>
      {icon}
    </div>
    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">{label}</h3>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

/** Single benefit row: type selector + optional amount */
const BenefitRow = ({
  icon,
  label,
  color,
  typeValue,
  onTypeChange,
  amountValue,
  onAmountChange,
  currencySymbol,
  disabled,
  amountError,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  typeValue: BenefitType;
  onTypeChange: (v: string) => void;
  amountValue: number;
  onAmountChange: (v: string) => void;
  currencySymbol: string;
  disabled: boolean;
  amountError?: string;
}) => (
  <div className={cn(
    "rounded-xl border bg-white p-4 transition-all",
    typeValue === "ALLOWANCE" ? "border-violet-200 shadow-sm" : "border-slate-100",
  )}>
    <div className="flex items-center gap-3 mb-3">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white", color)}>
        {icon}
      </div>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {typeValue === "ALLOWANCE" && (
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider rounded-full bg-violet-100 text-violet-700 px-2 py-0.5">
          Allowance
        </span>
      )}
      {typeValue === "COMPANY_PROVIDED" && (
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">
          Provided
        </span>
      )}
    </div>

    <div className={cn("grid gap-3", typeValue === "ALLOWANCE" ? "grid-cols-2" : "grid-cols-1")}>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Benefit Type</Label>
        <SelectField
          options={BENEFIT_OPTIONS}
          value={typeValue}
          onChange={(e) => onTypeChange(e.target.value)}
          disabled={disabled}
        />
      </div>

      {typeValue === "ALLOWANCE" && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Allowance Amount</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
              {currencySymbol}
            </span>
            <Input
              type="number"
              value={amountValue || ""}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.00"
              disabled={disabled}
              className="pl-8 h-9 rounded-lg border-violet-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
              min="0"
              step="0.01"
            />
          </div>
          {amountError && <p className="text-xs text-rose-500">{amountError}</p>}
        </div>
      )}
    </div>
  </div>
);

/** Live breakdown line in the summary panel */
const BreakdownLine = ({
  label,
  amount,
  currency,
  pct,
  color,
  isBold,
}: {
  label: string;
  amount: number;
  currency: string;
  pct: number;
  color: string;
  isBold?: boolean;
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm">
      <span className={cn("text-slate-600", isBold && "font-semibold text-slate-800")}>{label}</span>
      <span className={cn("font-mono tabular-nums", isBold ? "font-bold text-slate-900" : "text-slate-700")}>
        {formatMoney(String(amount), currency)}
      </span>
    </div>
    {pct > 0 && (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    )}
  </div>
);

// ── main form ─────────────────────────────────────────────────────────────────
export default function SalaryForm() {
  const { editing, cancelEdit, saveEdit } = useOutletContext<SalaryCtx>();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;
  const { user } = useAuth();

  const [formData,       setFormData]       = useState<SalaryFormState>(INITIAL_STATE);
  const [exists,         setExists]         = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  // ── validation ──────────────────────────────────────────────────────────────
  const validateForm = useCallback((data: SalaryFormState): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!isValidAmount(String(data.basicSalary)))
      errors.basicSalary = "Valid basic salary amount is required";
    if (data.transportationType === "ALLOWANCE" && !isValidAmount(String(data.transportationAllowance)))
      errors.transportationAllowance = "Valid transportation allowance amount is required";
    if (data.travelType === "ALLOWANCE" && !isValidAmount(String(data.travelAllowance)))
      errors.travelAllowance = "Valid travel allowance amount is required";
    if (data.housingType === "ALLOWANCE" && !isValidAmount(String(data.housingAllowance)))
      errors.housingAllowance = "Valid housing allowance amount is required";
    if (!isValidAmount(String(data.otherAllowance)))
      errors.otherAllowance = "Valid other allowance amount is required";
    if (!isValidDate(data.effectiveFrom))
      errors.effectiveFrom = "Valid effective from date is required";
    if (data.effectiveTo && !isValidDate(data.effectiveTo))
      errors.effectiveTo = "Invalid effective to date";
    return errors;
  }, []);

  const errors = useMemo(() => validateForm(formData), [formData, validateForm]);

  // ── save handler ────────────────────────────────────────────────────────────
  const handleSaveSalary = useCallback(async () => {
    if (!employeeId) return;
    if (Object.keys(validateForm(formData)).length > 0)
      throw new Error("Please fix the validation errors");

    const payload = {
      basicSalary:             Number(formData.basicSalary) || 0,
      transportationType:      formData.transportationType,
      transportationAllowance: formData.transportationType === "ALLOWANCE" ? Number(formData.transportationAllowance || 0) : 0,
      travelType:              formData.travelType,
      travelAllowance:         formData.travelType === "ALLOWANCE" ? Number(formData.travelAllowance || 0) : 0,
      housingType:             formData.housingType,
      housingAllowance:        formData.housingType === "ALLOWANCE" ? Number(formData.housingAllowance || 0) : 0,
      otherAllowance:          Number(formData.otherAllowance || 0),
      status:                  formData.compensationStatus,
      effectiveFrom:           formData.effectiveFrom,
      effectiveTo:             formData.effectiveTo,
    };

    const api = exists ? salaryService.update : salaryService.create;
    try {
      await api(employeeId, payload);
      toast.success(exists ? "Salary updated" : "Salary created");
      if (!exists) setExists(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save salary");
      throw err;
    }
  }, [employeeId, exists, formData, validateForm]);

  // ── event listeners ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleCancel = () => { setFormData(INITIAL_STATE); cancelEdit(); };
    document.addEventListener("salary:save",   handleSaveSalary as EventListener);
    document.addEventListener("salary:cancel", handleCancel);
    return () => {
      document.removeEventListener("salary:save",   handleSaveSalary as EventListener);
      document.removeEventListener("salary:cancel", handleCancel);
    };
  }, [formData, saveEdit, cancelEdit, employeeId, exists, handleSaveSalary]);

  // ── load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    salaryService.get(employeeId).then((res) => {
      if (!mounted || !res.data) return;
      const api = res.data;
      setFormData((prev) => ({
        ...prev,
        basicSalary:             Number(api.basicSalary ?? 0),
        transportationType:      (api.transportationType as BenefitType) || (Number(api.transportationAllowance ?? 0) > 0 ? "ALLOWANCE" : "COMPANY_PROVIDED"),
        transportationAllowance: Number(api.transportationAllowance ?? 0),
        travelType:              (api.travelType as BenefitType) || (Number(api.travelAllowance ?? 0) > 0 ? "ALLOWANCE" : "COMPANY_PROVIDED"),
        travelAllowance:         Number(api.travelAllowance ?? 0),
        housingType:             (api.housingType as BenefitType) || (Number(api.housingAllowance ?? 0) > 0 ? "ALLOWANCE" : "COMPANY_PROVIDED"),
        housingAllowance:        Number(api.housingAllowance ?? 0),
        otherAllowance:          Number(api.otherAllowance ?? 0),
        compensationStatus:      api.status ?? api.compensationStatus ?? "Active",
        effectiveFrom:           api.effectiveFrom ?? "",
        effectiveTo:             api.effectiveTo ?? "",
        payPeriodStart: "", payPeriodEnd: "", numberOfDaysWorked: "", payPerDay: "", overtime: "",
      }) as SalaryFormState);
      setExists(true);
    }).catch((err) => {
      toast.error(err?.response?.data?.message || "Failed to load salary");
    });
    return () => { mounted = false; };
  }, [employeeId]);

  // ── currency ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.companyId) return;
    fetchCompany(user.companyId.toString()).then((company: Company) => {
      if (company?.currency?.currencyCode) setCurrencySymbol(company.currency.currencyCode);
    }).catch(() => {});
  }, [user?.companyId]);

  // ── field updater ────────────────────────────────────────────────────────────
  const updateField = (field: keyof SalaryFormState) => (value: string) => {
    if (["basicSalary","transportationAllowance","travelAllowance","otherAllowance","housingAllowance"].includes(field)) {
      const num = Number(value.replace(/[^0-9.]/g, "")) || 0;
      setFormData((prev) => ({ ...prev, [field]: num }) as SalaryFormState);
      return;
    }
    if (["transportationType","travelType","housingType"].includes(field)) {
      const val = value as BenefitType;
      const reset =
        field === "housingType"        && val !== "ALLOWANCE" ? { housingAllowance: 0 } :
        field === "transportationType" && val !== "ALLOWANCE" ? { transportationAllowance: 0 } :
        field === "travelType"         && val !== "ALLOWANCE" ? { travelAllowance: 0 } : {};
      setFormData((prev) => ({ ...prev, [field]: val, ...reset }) as SalaryFormState);
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }) as SalaryFormState);
  };

  // ── derived values ───────────────────────────────────────────────────────────
  const transAmt  = formData.transportationType === "ALLOWANCE" ? (formData.transportationAllowance || 0) : 0;
  const travelAmt = formData.travelType          === "ALLOWANCE" ? (formData.travelAllowance          || 0) : 0;
  const housingAmt= formData.housingType         === "ALLOWANCE" ? (formData.housingAllowance         || 0) : 0;
  const otherAmt  = formData.otherAllowance || 0;

  const totalAllowance = useMemo(() => transAmt + travelAmt + housingAmt + otherAmt,
    [transAmt, travelAmt, housingAmt, otherAmt]);

  const grossPay = useMemo(() => (formData.basicSalary || 0) + totalAllowance,
    [formData.basicSalary, totalAllowance]);

  const statusMeta = getStatusMeta(formData.compensationStatus);

  // pct of gross for breakdown bars
  const pct = (v: number) => grossPay > 0 ? Math.round((v / grossPay) * 100) : 0;

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-50/60 min-h-screen p-5 space-y-5">

      {/* ── Page header ── */}
      <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        {/* Top gradient strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600" />
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-md">
              <ReceiptText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Salary & Compensation</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage the employee's compensation package and benefits</p>
            </div>
          </div>

          {/* Status badge */}
          {formData.compensationStatus && (
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ring-4",
              statusMeta.badge,
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot)} />
              {formData.compensationStatus}
            </span>
          )}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">

        {/* ── LEFT: form ── */}
        <div className="space-y-4">

          {/* Basic Salary card */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <SectionHeading
              icon={<DollarSign className="h-4 w-4" />}
              label="Basic Salary"
              accent="from-violet-600 to-blue-600"
            />
            <FormRow columns={1}>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Monthly Basic Salary <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-violet-600">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    value={formData.basicSalary || ""}
                    onChange={(e) => updateField("basicSalary")(e.target.value)}
                    placeholder="0.00"
                    disabled={!editing}
                    className="pl-10 h-12 text-lg font-bold rounded-xl border-violet-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 tabular-nums"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.basicSalary && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <span>⚠</span> {errors.basicSalary}
                  </p>
                )}
              </div>
            </FormRow>
          </div>

          {/* Benefits card */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <SectionHeading
              icon={<BadgePercent className="h-4 w-4" />}
              label="Benefits & Allowances"
              accent="from-emerald-500 to-teal-600"
            />
            <div className="space-y-3">
              <BenefitRow
                icon={<Car   className="h-4 w-4" />}
                label="Transportation"
                color="bg-blue-500"
                typeValue={formData.transportationType}
                onTypeChange={updateField("transportationType")}
                amountValue={formData.transportationAllowance}
                onAmountChange={updateField("transportationAllowance")}
                currencySymbol={currencySymbol}
                disabled={!editing}
                amountError={errors.transportationAllowance}
              />
              <BenefitRow
                icon={<Plane  className="h-4 w-4" />}
                label="Travel"
                color="bg-violet-500"
                typeValue={formData.travelType}
                onTypeChange={updateField("travelType")}
                amountValue={formData.travelAllowance}
                onAmountChange={updateField("travelAllowance")}
                currencySymbol={currencySymbol}
                disabled={!editing}
                amountError={errors.travelAllowance}
              />
              <BenefitRow
                icon={<Home     className="h-4 w-4" />}
                label="Housing"
                color="bg-amber-500"
                typeValue={formData.housingType}
                onTypeChange={updateField("housingType")}
                amountValue={formData.housingAllowance}
                onAmountChange={updateField("housingAllowance")}
                currencySymbol={currencySymbol}
                disabled={!editing}
                amountError={errors.housingAllowance}
              />

              {/* Other allowance inline */}
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white bg-slate-500">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">Other Allowance</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Allowance Amount</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      value={formData.otherAllowance || ""}
                      onChange={(e) => updateField("otherAllowance")(e.target.value)}
                      placeholder="0.00"
                      disabled={!editing}
                      className="pl-8 h-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {errors.otherAllowance && (
                    <p className="text-xs text-rose-500">{errors.otherAllowance}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status & Dates card */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <SectionHeading
              icon={<CheckCircle className="h-4 w-4" />}
              label="Status & Effective Dates"
              accent="from-emerald-500 to-teal-600"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Compensation Status <span className="text-rose-500">*</span>
                </Label>
                <SelectField
                  options={COMPENSATION_STATUS_OPTIONS}
                  value={formData.compensationStatus}
                  onChange={(e) => updateField("compensationStatus")(e.target.value)}
                  disabled={!editing}
                />
              </div>

              {/* Effective From */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                  Effective From <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => updateField("effectiveFrom")(e.target.value)}
                  disabled={!editing}
                  className="h-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
                />
                {errors.effectiveFrom && (
                  <p className="text-xs text-rose-500">{errors.effectiveFrom}</p>
                )}
              </div>

              {/* Effective To */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Effective To
                  <span className="text-[10px] font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  type="date"
                  value={formData.effectiveTo}
                  onChange={(e) => updateField("effectiveTo")(e.target.value)}
                  disabled={!editing}
                  className="h-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
                />
                {errors.effectiveTo && (
                  <p className="text-xs text-rose-500">{errors.effectiveTo}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: live compensation summary ── */}
        <div className="xl:sticky xl:top-5 space-y-4">

          {/* Gross pay hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 p-6 text-white shadow-xl">
            {/* decorative blobs */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-blue-400/20 blur-2xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-white/90">Total Gross Pay</span>
              </div>

              <p className="text-4xl font-bold tabular-nums leading-none mb-1">
                {formatMoney(String(grossPay), currencySymbol)}
              </p>
              <p className="text-xs text-white/65 mt-2">Per month · includes all allowances</p>

              <div className="mt-5 h-px w-full bg-white/20" />

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-white/60 text-xs">Basic Salary</p>
                  <p className="font-bold tabular-nums">{formatMoney(String(formData.basicSalary || 0), currencySymbol)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Allowances</p>
                  <p className="font-bold tabular-nums">{formatMoney(String(totalAllowance), currencySymbol)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown card */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-4 w-4 text-violet-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Pay Breakdown</h4>
            </div>

            <div className="space-y-3.5">
              <BreakdownLine
                label="Basic Salary"
                amount={formData.basicSalary || 0}
                currency={currencySymbol}
                pct={pct(formData.basicSalary || 0)}
                color="bg-violet-500"
              />
              {transAmt > 0 && (
                <BreakdownLine
                  label="Transportation"
                  amount={transAmt}
                  currency={currencySymbol}
                  pct={pct(transAmt)}
                  color="bg-blue-400"
                />
              )}
              {travelAmt > 0 && (
                <BreakdownLine
                  label="Travel"
                  amount={travelAmt}
                  currency={currencySymbol}
                  pct={pct(travelAmt)}
                  color="bg-purple-400"
                />
              )}
              {housingAmt > 0 && (
                <BreakdownLine
                  label="Housing"
                  amount={housingAmt}
                  currency={currencySymbol}
                  pct={pct(housingAmt)}
                  color="bg-amber-400"
                />
              )}
              {otherAmt > 0 && (
                <BreakdownLine
                  label="Other Allowance"
                  amount={otherAmt}
                  currency={currencySymbol}
                  pct={pct(otherAmt)}
                  color="bg-slate-400"
                />
              )}

              {/* Total divider */}
              <div className="border-t border-dashed border-slate-200 pt-3">
                <BreakdownLine
                  label="Gross Pay"
                  amount={grossPay}
                  currency={currencySymbol}
                  pct={100}
                  color="bg-emerald-500"
                  isBold
                />
              </div>
            </div>

            {/* % split pill */}
            {grossPay > 0 && (
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Salary Split
                </p>
                <div className="flex h-2 w-full overflow-hidden rounded-full gap-0.5">
                  <div className="bg-violet-500 transition-all duration-500 rounded-l-full" style={{ width: `${pct(formData.basicSalary || 0)}%` }} />
                  {transAmt  > 0 && <div className="bg-blue-400   transition-all duration-500" style={{ width: `${pct(transAmt)}%`  }} />}
                  {travelAmt > 0 && <div className="bg-purple-400 transition-all duration-500" style={{ width: `${pct(travelAmt)}%` }} />}
                  {housingAmt> 0 && <div className="bg-amber-400  transition-all duration-500" style={{ width: `${pct(housingAmt)}%`}} />}
                  {otherAmt  > 0 && <div className="bg-slate-400  transition-all duration-500 rounded-r-full" style={{ width: `${pct(otherAmt)}%` }} />}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 inline-block"/>Basic {pct(formData.basicSalary||0)}%</span>
                  {totalAllowance > 0 && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"/>Allowances {pct(totalAllowance)}%</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
