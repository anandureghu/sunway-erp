import { useEffect, useState, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  MapPin,
  CreditCard,
  Globe,
  FileText,
  Landmark,
  Hash,
  ShieldCheck,
  StickyNote,
} from "lucide-react";
import { bankService } from "@/service/bankService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SalaryCtx = { editing: boolean };

type BankModel = {
  location:    string;
  city:        string;
  bankName:    string;
  state:       string;
  bankBranch:  string;
  country:     string;
  accountType: string;
  remarks:     string;
  accountNo:   string;
  iban:        string;
};

const SEED: BankModel = {
  location: "", city: "", bankName: "", state: "", bankBranch: "",
  country: "", accountType: "", remarks: "", accountNo: "", iban: "",
};

interface ValidationErrors { [key: string]: string }

// ── helpers ───────────────────────────────────────────────────────────────────

/** Mask all but last 4 digits of account number */
const maskAccount = (val: string) => {
  if (!val || val.length < 5) return val || "•••• •••• ••••";
  const visible = val.slice(-4);
  const hidden  = val.slice(0, -4).replace(/./g, "•");
  // group into blocks of 4
  const full = hidden + visible;
  return full.match(/.{1,4}/g)?.join(" ") ?? full;
};

// ── sub-components ────────────────────────────────────────────────────────────

const SectionHeading = ({
  icon,
  label,
  accent = "from-violet-600 to-blue-600",
}: {
  icon: React.ReactNode;
  label: string;
  accent?: string;
}) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white", accent)}>
      {icon}
    </div>
    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</span>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

const Field = ({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-700">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </Label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-rose-500">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

// ── virtual bank card ─────────────────────────────────────────────────────────
const BankCard = ({ data }: { data: BankModel }) => {
  const hasData = !!(data.bankName || data.accountNo || data.accountType);

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-6 text-white shadow-xl select-none transition-all duration-500",
      hasData
        ? "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"
        : "bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300",
    )}>
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute right-16 bottom-8 h-24 w-24 rounded-full bg-white/5" />

      {/* Card top row */}
      <div className="relative flex items-start justify-between mb-8">
        <div>
          <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-0.5", hasData ? "text-white/50" : "text-slate-400")}>
            Bank
          </p>
          <p className={cn("text-base font-bold leading-tight", hasData ? "text-white" : "text-slate-400")}>
            {data.bankName || "Bank Name"}
          </p>
          {data.bankBranch && (
            <p className="text-[11px] text-white/50 mt-0.5">{data.bankBranch}</p>
          )}
        </div>
        {/* Chip */}
        <div className={cn(
          "h-9 w-12 rounded-md border-2",
          hasData ? "border-amber-400/60 bg-gradient-to-br from-amber-300/30 to-amber-500/20" : "border-slate-300/40 bg-slate-200/20",
        )}>
          <div className={cn("mt-1.5 mx-1.5 h-2.5 w-9 rounded-sm", hasData ? "bg-amber-400/40" : "bg-slate-300/30")} />
          <div className={cn("mt-1 ml-2.5 h-1.5 w-4 rounded-sm", hasData ? "bg-amber-400/30" : "bg-slate-300/20")} />
        </div>
      </div>

      {/* Account number */}
      <p className={cn(
        "relative font-mono text-lg font-semibold tracking-[0.2em] mb-5",
        hasData ? "text-white" : "text-slate-400",
      )}>
        {maskAccount(data.accountNo)}
      </p>

      {/* Bottom row */}
      <div className="relative flex items-end justify-between">
        <div>
          <p className={cn("text-[9px] uppercase tracking-widest mb-0.5", hasData ? "text-white/40" : "text-slate-400")}>
            Account Type
          </p>
          <p className={cn("text-sm font-semibold", hasData ? "text-white" : "text-slate-400")}>
            {data.accountType || "—"}
          </p>
        </div>
        {data.iban && (
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">IBAN / SWIFT</p>
            <p className="text-xs font-mono text-white/70">{data.iban}</p>
          </div>
        )}
        {/* Network logo placeholder */}
        <div className="flex gap-1">
          <div className={cn("h-7 w-7 rounded-full opacity-70", hasData ? "bg-amber-400" : "bg-slate-300")} />
          <div className={cn("h-7 w-7 rounded-full -ml-3 opacity-50", hasData ? "bg-orange-500" : "bg-slate-400")} />
        </div>
      </div>
    </div>
  );
};

// ── quick stat pill ───────────────────────────────────────────────────────────
const StatPill = ({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) => (
  <div className={cn("flex items-center gap-3 rounded-xl border p-3.5", accent)}>
    <div className="shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-bold text-slate-800">{value || "—"}</p>
    </div>
  </div>
);

// ── main form ─────────────────────────────────────────────────────────────────
export default function BankForm() {
  const { editing } = useOutletContext<SalaryCtx>();
  const { id }      = useParams<{ id: string }>();
  const employeeId  = id ? Number(id) : undefined;

  const [saved,  setSaved]  = useState<BankModel>(SEED);
  const [draft,  setDraft]  = useState<BankModel>(SEED);
  const [exists, setExists] = useState(false);

  const patch = <K extends keyof BankModel>(k: K, v: BankModel[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const validateForm = (data: BankModel): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.bankName)    errors.bankName    = "Bank name is required";
    if (!data.bankBranch)  errors.bankBranch  = "Bank branch is required";
    if (!data.accountType) errors.accountType = "Account type is required";
    if (!data.accountNo)   errors.accountNo   = "Account number is required";
    if (!data.country)     errors.country     = "Country is required";
    return errors;
  };

  const errors = validateForm(draft);

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSaveBank = useCallback(async () => {
    if (!employeeId) return;

    const requiredFields = [
      { field: "bankName",    label: "Bank Name"    },
      { field: "bankBranch",  label: "Bank Branch"  },
      { field: "accountType", label: "Account Type" },
      { field: "accountNo",   label: "Account No"   },
      { field: "country",     label: "Country"      },
    ];

    const missing = requiredFields.filter(({ field }) => !draft[field as keyof BankModel]?.toString().trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      throw new Error("Missing required fields");
    }

    const api = exists ? bankService.update : bankService.create;
    try {
      await api(employeeId, draft);
      toast.success("Bank details saved");
      setSaved(draft);
      setExists(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save bank details");
      throw err;
    }
  }, [employeeId, exists, draft]);

  // ── load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    bankService.get(employeeId).then((res) => {
      if (!mounted || !res.data) return;
      setDraft(res.data);
      setSaved(res.data);
      setExists(true);
    }).catch((err) => {
      toast.error(err?.response?.data?.message || "Failed to load bank details");
    });
    return () => { mounted = false; };
  }, [employeeId]);

  // ── events ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onCancel = () => setDraft(saved);
    document.addEventListener("salary:save",   handleSaveBank as EventListener);
    document.addEventListener("salary:cancel", onCancel as EventListener);
    return () => {
      document.removeEventListener("salary:save",   handleSaveBank as EventListener);
      document.removeEventListener("salary:cancel", onCancel as EventListener);
    };
  }, [draft, saved, employeeId, exists, handleSaveBank]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-50/60 min-h-screen p-5 space-y-5">

      {/* ── Page header ── */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600" />
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-md">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Bank Details</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Provide banking information for salary disbursement</p>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">

        {/* ── LEFT: form ── */}
        <div className="space-y-4">

          {/* Bank Information */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <SectionHeading
              icon={<Building2 className="h-3.5 w-3.5" />}
              label="Bank Information"
              accent="from-violet-600 to-blue-600"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank Name" required error={errors.bankName}>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50"
                    disabled={!editing}
                    value={draft.bankName}
                    onChange={(e) => patch("bankName", e.target.value)}
                    placeholder="e.g. CIMB Bank"
                  />
                </div>
              </Field>

              <Field label="Bank Branch" required error={errors.bankBranch}>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50"
                    disabled={!editing}
                    value={draft.bankBranch}
                    onChange={(e) => patch("bankBranch", e.target.value)}
                    placeholder="e.g. Sunway Branch"
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Account Details */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <SectionHeading
              icon={<CreditCard className="h-3.5 w-3.5" />}
              label="Account Details"
              accent="from-emerald-500 to-teal-600"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Account Type" required error={errors.accountType}>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50"
                    disabled={!editing}
                    value={draft.accountType}
                    onChange={(e) => patch("accountType", e.target.value)}
                    placeholder="Savings / Current"
                  />
                </div>
              </Field>

              <Field label="Account Number" required error={errors.accountNo}>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50 font-mono"
                    disabled={!editing}
                    value={draft.accountNo}
                    onChange={(e) => patch("accountNo", e.target.value)}
                    placeholder="e.g. 1234567890"
                  />
                </div>
              </Field>

              <Field label="IBAN / SWIFT Code">
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50 font-mono uppercase"
                    disabled={!editing}
                    value={draft.iban}
                    onChange={(e) => patch("iban", e.target.value.toUpperCase())}
                    placeholder="e.g. MY123456"
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Location Details */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <SectionHeading
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Bank Location"
              accent="from-amber-500 to-orange-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="City">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50"
                    disabled={!editing}
                    value={draft.city}
                    onChange={(e) => patch("city", e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
              </Field>

              <Field label="State">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50"
                    disabled={!editing}
                    value={draft.state}
                    onChange={(e) => patch("state", e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
              </Field>

              <Field label="Country" required error={errors.country}>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50"
                    disabled={!editing}
                    value={draft.country}
                    onChange={(e) => patch("country", e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Remarks */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <SectionHeading
              icon={<StickyNote className="h-3.5 w-3.5" />}
              label="Remarks"
              accent="from-slate-500 to-slate-700"
            />
            <Field label="Additional Notes / Instructions">
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  className="min-h-[90px] pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 resize-none disabled:bg-slate-50"
                  disabled={!editing}
                  value={draft.remarks}
                  onChange={(e) => patch("remarks", e.target.value)}
                  placeholder="Any special payment instructions or notes…"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* ── RIGHT: live preview ── */}
        <div className="xl:sticky xl:top-5 space-y-4">

          {/* Virtual bank card */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Card Preview
            </p>
            <BankCard data={draft} />
            <p className="text-[10px] text-center text-muted-foreground">
              Updates live as you fill in the form
            </p>
          </div>

          {/* Quick stats */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Summary
            </p>
            <StatPill
              icon={<Building2 className="h-4 w-4 text-violet-600" />}
              label="Bank"
              value={draft.bankName}
              accent="border-violet-100 bg-violet-50/50"
            />
            <StatPill
              icon={<CreditCard className="h-4 w-4 text-emerald-600" />}
              label="Account Type"
              value={draft.accountType}
              accent="border-emerald-100 bg-emerald-50/50"
            />
            <StatPill
              icon={<Hash className="h-4 w-4 text-blue-600" />}
              label="Account No"
              value={draft.accountNo ? `•••• ${draft.accountNo.slice(-4)}` : ""}
              accent="border-blue-100 bg-blue-50/50"
            />
            {draft.iban && (
              <StatPill
                icon={<Globe className="h-4 w-4 text-amber-600" />}
                label="IBAN / SWIFT"
                value={draft.iban}
                accent="border-amber-100 bg-amber-50/50"
              />
            )}
            {draft.country && (
              <StatPill
                icon={<MapPin className="h-4 w-4 text-rose-500" />}
                label="Country"
                value={draft.country}
                accent="border-rose-100 bg-rose-50/50"
              />
            )}
          </div>

          {/* Required fields status */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Required Fields
            </p>
            <div className="space-y-1.5">
              {[
                { label: "Bank Name",    ok: !!draft.bankName    },
                { label: "Bank Branch",  ok: !!draft.bankBranch  },
                { label: "Account Type", ok: !!draft.accountType },
                { label: "Account No",   ok: !!draft.accountNo   },
                { label: "Country",      ok: !!draft.country     },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2">
                  <ShieldCheck className={cn("h-3.5 w-3.5 shrink-0 transition-colors", ok ? "text-emerald-500" : "text-slate-300")} />
                  <span className={cn("text-xs transition-colors", ok ? "text-slate-700" : "text-slate-400")}>
                    {label}
                  </span>
                  {ok && <span className="ml-auto text-[10px] font-semibold text-emerald-600">✓</span>}
                </div>
              ))}
            </div>

            {/* Overall progress bar */}
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${([draft.bankName, draft.bankBranch, draft.accountType, draft.accountNo, draft.country].filter(Boolean).length / 5) * 100}%`
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground text-right">
                {[draft.bankName, draft.bankBranch, draft.accountType, draft.accountNo, draft.country].filter(Boolean).length}/5 completed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
