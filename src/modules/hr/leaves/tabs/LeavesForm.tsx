import { useEffect, useState, useCallback } from "react";
import type { ReactElement } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams } from "react-router-dom";
import { leaveService } from "@/service/leaveService";
import { toast } from "sonner";
import type { LeavePreview } from "@/service/leaveService";
import { Calendar, Clock, CheckCircle, FileText, TrendingUp, CalendarDays, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type Ctx = { editing: boolean; setEditing?: (b: boolean) => void };

type LeaveStatus = "Pending" | "Approved" | "Rejected";
type LeaveType = string;

// Default leave types as fallback when API fails
const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Unpaid Leave",
  "Maternity Leave",
];

const STATUS: LeaveStatus[] = ["Pending", "Approved", "Rejected"];

type LeaveRecord = {
  leaveCode: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  dateReported: string;
  leaveBalance: string;
  leaveStatus: LeaveStatus;
  totalDays: number;
};

const SEED: LeaveRecord = {
  leaveCode: "L001",
  leaveType: "Annual Leave",
  startDate: "2025-10-22",
  endDate: "2025-10-31",
  dateReported: "2025-10-22",
  leaveBalance: "",
  leaveStatus: "Pending",
  totalDays: 8,
};

export default function LeavesForm(): ReactElement {
  const { editing } = useOutletContext<Ctx>();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [draft, setDraft] = useState<LeaveRecord>({
    ...SEED,
    startDate: "",
    endDate: "",
    dateReported: new Date().toISOString().slice(0, 10),
    totalDays: 0,
  });
  const [saved, setSaved] = useState<LeaveRecord | null>(null);
  const [preview, setPreview] = useState<LeavePreview | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>(DEFAULT_LEAVE_TYPES);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // ============================================================
  // ✅ FIX: Fetch available leave types with proper error handling
  // ============================================================
  useEffect(() => {
    if (!employeeId) {
      setLoadingTypes(false);
      return;
    }

    setLoadingTypes(true);

        leaveService.fetchAvailableLeaveTypes(employeeId)
      .then((result) => {
        // Use API-returned types if successful and non-empty, else fall back to defaults
        const types =
          result.success && result.data.length > 0
            ? result.data
            : DEFAULT_LEAVE_TYPES;

        setAvailableTypes(types);

        // Auto-select first leave type if current draft type isn't in the list
        if (types.length > 0 && !types.includes(draft.leaveType)) {
          setDraft(d => ({ ...d, leaveType: types[0] }));
        }
      })

      .catch((err) => {
        console.error("Unexpected error fetching leave types:", err);
        setAvailableTypes(DEFAULT_LEAVE_TYPES);
      })
      .finally(() => {
        setLoadingTypes(false);
      });

  }, [employeeId]);

  // Update leave balance when preview changes
  useEffect(() => {
    if (!preview) return;
    
    const avail = preview.availableBalance ?? (preview as any).available_balance ?? 0;
    const availStr = avail === null || avail === undefined ? "" : String(avail);
    setDraft((d) => (d.leaveBalance === availStr ? d : { ...d, leaveBalance: availStr }));
  }, [preview]);

  // Clear leaveBalance when preview is removed
  useEffect(() => {
    if (!preview) {
      setDraft(d => ({ ...d, leaveBalance: "" }));
    }
  }, [preview]);

  // Calculate total days based on start and end dates
  useEffect(() => {
    if (!editing) return;
    const sd = Date.parse(draft.startDate);
    const ed = Date.parse(draft.endDate);
    let days = 0;
    if (!Number.isNaN(sd) && !Number.isNaN(ed) && ed >= sd) {
      days = Math.floor((ed - sd) / (1000 * 60 * 60 * 24)) + 1;
    }
    setDraft((prev) => (prev.totalDays === days ? prev : { ...prev, totalDays: days }));
  }, [draft.startDate, draft.endDate, editing]);

  // Preview leave when dates or type changes
  useEffect(() => {
    if (!employeeId) return;
    if (!draft.leaveType || !draft.startDate || !draft.endDate) {
      setPreview(null);
      return;
    }
    let mounted = true;
    leaveService
      .previewLeave(employeeId, draft.leaveType, draft.startDate, draft.endDate)
      .then((res) => {
        if (!mounted) return;
        // Only render preview when the API actually succeeded — res.data is always
        // an object (service never throws), so we must gate on res.success
        if (res.success && res.data) {
          setPreview(normalizePreview(res.data));
        } else {
          console.warn("Preview unavailable:", res.message);
          setPreview(null);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Preview error", err);
        setPreview(null);
      });

    return () => {
      mounted = false;
    };
  }, [draft.leaveType, draft.startDate, draft.endDate, employeeId]);

  const patch = useCallback(<K extends keyof LeaveRecord>(k: K, v: LeaveRecord[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const handleSave = useCallback(() => {
    if (!employeeId) return;

    // Validate required fields before sending
    if (!draft.leaveType || !draft.startDate || !draft.endDate) {
      toast.error("Please fill in Leave Type, Start Date, and End Date");
      return;
    }

    const payload = {
      leaveType:    draft.leaveType,
      startDate:    draft.startDate,
      endDate:      draft.endDate,
      dateReported: draft.dateReported,
      leaveCode:    draft.leaveCode,
      leaveStatus:  draft.leaveStatus,
      // Send balance so it's stored and visible in history
      leaveBalance: draft.leaveBalance !== "" ? Number(draft.leaveBalance) : undefined,
    };

    leaveService
      .applyLeave(employeeId, payload)
      .then((result) => {
        // Service never throws — check the success flag explicitly
        if (!result.success) {
          toast.error(result.message || "Failed to apply leave");
          return;
        }

        toast.success("Leave applied successfully");
        setSaved(draft);

        // Signal the shell to exit edit mode (LeavesShell listens for "leaves:saved")
        document.dispatchEvent(new Event("leaves:saved"));

        // Refresh preview after successful apply
        leaveService
          .previewLeave(employeeId, draft.leaveType, draft.startDate, draft.endDate)
          .then((res) => {
            if (res.success && res.data) {
              setPreview(normalizePreview(res.data));
            }
          });
      })
      .catch((err) => {
        console.error("Apply leave failed", err);
        toast.error("An unexpected error occurred");
      });
  }, [draft, employeeId]);

  const handleCancel = useCallback(() => {
    if (saved) setDraft(saved);
    else setDraft(SEED);
  }, [saved]);

  /* Listen to shell-level save/cancel events so top Edit/Update buttons control the form */
  useEffect(() => {
    const onSaveEvent = () => handleSave();
    const onCancelEvent = () => handleCancel();
    document.addEventListener("leaves:save", onSaveEvent as EventListener);
    document.addEventListener("leaves:cancel", onCancelEvent as EventListener);
    return () => {
      document.removeEventListener("leaves:save", onSaveEvent as EventListener);
      document.removeEventListener("leaves:cancel", onCancelEvent as EventListener);
    };
  }, [handleSave, handleCancel]);

  /* ── derived status meta ── */
  const statusDot   = draft.leaveStatus === "Approved" ? "bg-emerald-500"
                    : draft.leaveStatus === "Rejected"  ? "bg-rose-500"
                    : "bg-amber-400";
  const statusBadge = draft.leaveStatus === "Approved"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100"
    : draft.leaveStatus === "Rejected"
    ? "bg-rose-50 text-rose-700 border-rose-200 ring-rose-100"
    : "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100";

  const availBal   = preview ? (preview.availableBalance ?? 0) : 0;
  const daysReq    = preview ? (preview.totalDays ?? draft.totalDays) : draft.totalDays;
  const balAfter   = preview ? (preview.remainingAfter ?? 0) : 0;

  return (
    <div className="bg-slate-50/60 min-h-screen p-5 space-y-5">

      {/* ── Page header ── */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600" />
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-md">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Leave Management</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Apply for and track employee leave requests</p>
            </div>
          </div>

          {/* Status badge */}
          {draft.leaveStatus && (
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ring-4",
              statusBadge,
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", statusDot)} />
              {draft.leaveStatus}
            </span>
          )}
        </div>
      </div>

      {/* ── Balance KPI strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <BalanceCard
          icon={<Clock className="h-4 w-4" />}
          label="Available Balance"
          value={availBal}
          accent="text-blue-600 bg-blue-50 border-blue-100"
          iconBg="bg-blue-100 text-blue-600"
        />
        <BalanceCard
          icon={<Calendar className="h-4 w-4" />}
          label="Days Requested"
          value={daysReq}
          accent="text-emerald-600 bg-emerald-50 border-emerald-100"
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <BalanceCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Balance After"
          value={balAfter}
          accent={balAfter < 0
            ? "text-rose-600 bg-rose-50 border-rose-100"
            : "text-violet-600 bg-violet-50 border-violet-100"}
          iconBg={balAfter < 0 ? "bg-rose-100 text-rose-600" : "bg-violet-100 text-violet-600"}
        />
      </div>

      {/* ── Leave Details ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead icon={<FileText className="h-3.5 w-3.5" />} label="Leave Details" accent="from-violet-600 to-blue-600" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Leave Code */}
          <Field label="Leave Code" required>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                disabled={!editing}
                value={draft.leaveCode}
                onChange={(e) => patch("leaveCode", e.target.value)}
                placeholder="e.g., L001"
                className={cn(iCls, "pl-9 font-mono")}
              />
            </div>
          </Field>

          {/* Leave Type */}
          <Field label="Leave Type" required>
            <div className="relative">
              <Layers className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <select
                disabled={!editing || loadingTypes}
                className={cn(
                  "h-9 w-full appearance-none rounded-lg border border-slate-200 pl-9 pr-8 text-sm bg-white",
                  "focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 transition-colors",
                  (!editing || loadingTypes) && "bg-slate-50 text-slate-600 cursor-not-allowed",
                )}
                value={draft.leaveType}
                onChange={(e) => patch("leaveType", e.target.value as LeaveType)}
              >
                {loadingTypes ? (
                  <option>Loading…</option>
                ) : availableTypes.length === 0 ? (
                  <option disabled>No leave types available</option>
                ) : (
                  availableTypes.map((t) => <option key={t} value={t}>{t}</option>)
                )}
              </select>
              <ChevronIcon />
            </div>
          </Field>

          {/* Leave Status */}
          <Field label="Leave Status" required>
            <div className="relative">
              <CheckCircle className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <select
                disabled={!editing}
                className={cn(
                  "h-9 w-full appearance-none rounded-lg border border-slate-200 pl-9 pr-8 text-sm bg-white",
                  "focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 transition-colors",
                  !editing && "bg-slate-50 text-slate-600 cursor-not-allowed",
                )}
                value={draft.leaveStatus}
                onChange={(e) => patch("leaveStatus", e.target.value as LeaveStatus)}
              >
                {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronIcon />
            </div>
          </Field>
        </div>
      </div>

      {/* ── Leave Period ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead icon={<Calendar className="h-3.5 w-3.5" />} label="Leave Period" accent="from-emerald-500 to-teal-600" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Start Date" required>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                disabled={!editing}
                value={draft.startDate}
                onChange={(e) => patch("startDate", e.target.value)}
                className={cn(iCls, "pl-9")}
              />
            </div>
          </Field>

          <Field label="End Date" required>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                disabled={!editing}
                value={draft.endDate}
                onChange={(e) => patch("endDate", e.target.value)}
                className={cn(iCls, "pl-9")}
              />
            </div>
          </Field>

          <Field label="Date Reported">
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                disabled={!editing}
                value={draft.dateReported}
                onChange={(e) => patch("dateReported", e.target.value)}
                className={cn(iCls, "pl-9")}
              />
            </div>
          </Field>
        </div>

        {/* Duration display — shows when both dates are set */}
        {draft.startDate && draft.endDate && draft.totalDays > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-4 py-2.5 w-fit">
            <CalendarDays className="h-4 w-4 text-violet-600 shrink-0" />
            <span className="text-sm text-violet-800">
              <span className="font-bold">{draft.totalDays}</span>{" "}
              {draft.totalDays === 1 ? "day" : "days"} selected
            </span>
          </div>
        )}
      </div>

      {/* ── Summary ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead icon={<TrendingUp className="h-3.5 w-3.5" />} label="Leave Summary" accent="from-amber-500 to-orange-500" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Total Days">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                disabled
                value={String(draft.totalDays)}
                className={cn(iCls, "pl-9 font-semibold bg-slate-50")}
              />
            </div>
          </Field>

          <Field label="Leave Balance">
            <div className="relative">
              <TrendingUp className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                disabled={!editing}
                value={draft.leaveBalance}
                onChange={(e) => patch("leaveBalance", e.target.value)}
                placeholder="Auto-calculated"
                className={cn(iCls, "pl-9")}
              />
            </div>
          </Field>
        </div>
      </div>

      {/* ── Live preview card (shown when dates + type are set) ── */}
      {preview && (
        <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Leave Preview</span>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                Live
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Days Requested",   value: preview.totalDays,        color: "text-slate-900" },
                { label: "Current Balance",  value: preview.availableBalance,  color: "text-slate-900" },
                { label: "Balance After",    value: preview.remainingAfter,    color: (preview.remainingAfter ?? 0) < 0 ? "text-rose-600" : "text-emerald-700" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                  <p className={cn("text-2xl font-bold tabular-nums", color)}>{value ?? 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= UI HELPERS ================= */

const iCls =
  "h-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors";

function ChevronIcon() {
  return (
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
      <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function SectionHead({ icon, label, accent = "from-violet-600 to-blue-600" }: { icon: React.ReactNode; label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white", accent)}>
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function BalanceCard({
  icon, label, value, accent, iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  iconBg: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm", accent)}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconBg)}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

// Helper: normalize preview response from API which may use snake_case or different keys
function normalizePreview(d: any): LeavePreview {
  const pickNumber = (...keys: string[]) => {
    for (const k of keys) {
      if (d == null) break;
      const v = d[k];
      if (v !== undefined && v !== null && v !== "") return Number(v);
    }
    return 0;
  };

  return {
    totalDays: pickNumber("totalDays", "total_days", "total", "days", "daysRequested"),
    availableBalance: pickNumber("availableBalance", "available_balance", "available", "balance", "currentBalance", "current_balance"),
    remainingAfter: pickNumber(
      "remainingAfter",
      "remaining_after",
      "remaining",
      "balanceAfter",
      "balance_after",
      "remaining_balance",
      "balanceAfterLeave",
      "balance_after_leave"
    ),
  }
}
