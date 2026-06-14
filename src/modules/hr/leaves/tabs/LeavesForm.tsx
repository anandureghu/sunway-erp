import { useEffect, useState, useCallback, useRef } from "react";
import type { ReactElement } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams } from "react-router-dom";
import { leaveService } from "@/service/leaveService";
import { toast } from "sonner";
import type { LeavePreview } from "@/service/leaveService";
import {
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  TrendingUp,
  CalendarDays,
  Layers,
  Upload,
  X,
  AlertCircle,
  Users,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SummaryCard } from "@/modules/hr/components/summary-card";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { hrService } from "@/service/hr.service";
import type { Employee } from "@/types/hr";

type Ctx = { editing: boolean; setEditing?: (b: boolean) => void };

type LeaveStatus = "Pending for Approval" | "Approved" | "Rejected";
type LeaveType = string;

// Default leave types as fallback when API fails
const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Unpaid Leave",
  "Maternity Leave",
  "Hajj Leave",
];

// Leave types that require a supporting document
const REQUIRES_DOCUMENT = ["Sick Leave"];

/** Count working days (Mon–Fri) between two ISO date strings. */
function countWorkingDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

type LeaveRecord = {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  dateReported: string;
  returnDate: string;
  leaveBalance: string;
  leaveStatus: LeaveStatus;
  totalDays: number;
  includeWeekends: boolean;
  delegateId: number | null;
};

const SEED: LeaveRecord = {
  leaveType: "Annual Leave",
  startDate: "",
  endDate: "",
  // Stamped server-side on apply; shown read-only as "Applied On".
  dateReported: new Date().toISOString().slice(0, 10),
  returnDate: "",
  leaveBalance: "",
  leaveStatus: "Pending for Approval",
  totalDays: 0,
  includeWeekends: false,
  delegateId: null,
};

/** Exited employees should not appear as delegate options. */
function isExited(status?: string | null): boolean {
  if (!status) return false;
  return ["TERMINATED", "RESIGNED", "RETIRED", "INACTIVE"].includes(
    String(status).toUpperCase(),
  );
}

/** Pill styling for a leave status, mirroring the Loan Status field. */
function leaveStatusMeta(status: string) {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "REJECTED":
      return { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    case "CANCELLED":
      return { label: "Cancelled", cls: "bg-gray-50 text-gray-700 border-gray-200" };
    default:
      return { label: "Pending for Approval", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  }
}

export default function LeavesForm(): ReactElement {
  const { editing } = useOutletContext<Ctx>();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<LeaveRecord>({ ...SEED });
  const [saved, setSaved] = useState<LeaveRecord | null>(null);
  const [preview, setPreview] = useState<LeavePreview | null>(null);
  const [availableTypes, setAvailableTypes] =
    useState<string[]>(DEFAULT_LEAVE_TYPES);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  // Delegation: colleagues in the same department as the requestor
  const [colleagues, setColleagues] = useState<Employee[]>([]);
  const [loadingColleagues, setLoadingColleagues] = useState(false);
  const [deptLabel, setDeptLabel] = useState<string>("");

  const needsDoc = REQUIRES_DOCUMENT.some((t) =>
    draft.leaveType?.toLowerCase().includes(t.toLowerCase()),
  );

  // ============================================================
  // ✅ FIX: Fetch available leave types with proper error handling
  // ============================================================
  useEffect(() => {
    if (!employeeId) {
      setLoadingTypes(false);
      return;
    }

    setLoadingTypes(true);

    leaveService
      .fetchAvailableLeaveTypes(employeeId)
      .then((result) => {
        // Use API-returned types if successful and non-empty, else fall back to defaults
        const types =
          result.success && result.data && result.data.length > 0
            ? result.data
            : DEFAULT_LEAVE_TYPES;

        setAvailableTypes(types as string[]);

        // Auto-select first leave type if current draft type isn't in the list
        if (types && types.length > 0 && !types.includes(draft.leaveType)) {
          setDraft((d) => ({ ...d, leaveType: types[0] }));
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

  // Load same-department colleagues for the delegation selector
  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    setLoadingColleagues(true);
    hrService
      .listEmployees()
      .then((list) => {
        if (!mounted) return;
        const me = list.find((e) => Number(e.id) === employeeId);
        const myDeptId =
          me?.departmentId != null ? String(me.departmentId) : null;
        const myDeptName = me?.department ?? null;
        setDeptLabel(myDeptName ?? "");

        const peers = list.filter((e) => {
          if (Number(e.id) === employeeId) return false;
          if (isExited(e.status)) return false;
          if (myDeptId) return String(e.departmentId ?? "") === myDeptId;
          if (myDeptName) return (e.department ?? "") === myDeptName;
          return false; // no department on requestor → no peers to delegate to
        });
        setColleagues(peers);
      })
      .catch(() => {
        if (mounted) setColleagues([]);
      })
      .finally(() => {
        if (mounted) setLoadingColleagues(false);
      });
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  // Update leave balance when preview changes
  useEffect(() => {
    if (!preview) return;

    const avail =
      preview.availableBalance ?? (preview as any).available_balance ?? 0;
    const availStr = avail === null || avail === undefined ? "" : String(avail);
    setDraft((d) =>
      d.leaveBalance === availStr ? d : { ...d, leaveBalance: availStr },
    );
  }, [preview]);

  // Clear leaveBalance when preview is removed
  useEffect(() => {
    if (!preview) {
      setDraft((d) => ({ ...d, leaveBalance: "" }));
    }
  }, [preview]);

  // Calculate total days based on start and end dates
  useEffect(() => {
    if (!editing) return;
    let days = 0;
    if (draft.startDate && draft.endDate) {
      if (draft.includeWeekends) {
        const sd = Date.parse(draft.startDate);
        const ed = Date.parse(draft.endDate);
        if (!Number.isNaN(sd) && !Number.isNaN(ed) && ed >= sd) {
          days = Math.floor((ed - sd) / (1000 * 60 * 60 * 24)) + 1;
        }
      } else {
        days = countWorkingDays(draft.startDate, draft.endDate);
      }
    }
    setDraft((prev) =>
      prev.totalDays === days ? prev : { ...prev, totalDays: days },
    );
  }, [draft.startDate, draft.endDate, draft.includeWeekends, editing]);

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

  const patch = useCallback(
    <K extends keyof LeaveRecord>(k: K, v: LeaveRecord[K]) => {
      setDraft((d) => ({ ...d, [k]: v }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!employeeId) return;

    // Validate required fields before sending
    if (!draft.leaveType || !draft.startDate || !draft.endDate) {
      toast.error("Please fill in Leave Type, Start Date, and End Date");
      return;
    }

    // The return-to-office date is optional, but if set it must be after the
    // leave ends (mirrors the backend rule).
    if (draft.returnDate && draft.returnDate <= draft.endDate) {
      toast.error("Reporting to Office date must be after the End Date");
      return;
    }

    // IMPORTANT: Do NOT send leaveStatus to backend
    // New leave requests should always be PENDING by default
    // Only HR/Department managers can approve via the approval panel
    const payload = {
      leaveType: draft.leaveType,
      startDate: draft.startDate,
      endDate: draft.endDate,
      includeWeekends: draft.includeWeekends,
      // Leave status is intentionally omitted so the backend sets it to PENDING.
      // Optional delegation — colleague covering during the leave
      delegateId: draft.delegateId ?? undefined,
      // Optional date the employee returns to the office after the leave.
      returnDate: draft.returnDate || undefined,
    };

    // Validate: sick leave requires a document
    if (needsDoc && !docFile) {
      setDocError(
        "A supporting document (e.g. medical certificate) is required for Sick Leave.",
      );
      return;
    }

    // When a document is attached, create the leave AND upload it in a single
    // multipart request. (The old two-step path passed the string leaveCode as a
    // numeric id, so it resolved to NaN and the upload silently failed.)
    const submit = docFile
      ? leaveService.applyLeaveWithDocument(employeeId, payload, docFile)
      : leaveService.applyLeave(employeeId, payload);

    submit
      .then((result) => {
        // Service never throws — check the success flag explicitly
        if (!result.success) {
          toast.error(result.message || "Failed to apply leave");
          return;
        }

        toast.success("Leave applied successfully");
        setSaved(draft);
        setDocFile(null);
        setDocError(null);

        // Signal the shell to exit edit mode (LeavesShell listens for "leaves:saved")
        document.dispatchEvent(new Event("leaves:saved"));

        // Refresh preview after successful apply
        leaveService
          .previewLeave(
            employeeId,
            draft.leaveType,
            draft.startDate,
            draft.endDate,
          )
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
  }, [draft, employeeId, needsDoc, docFile]);

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
      document.removeEventListener(
        "leaves:cancel",
        onCancelEvent as EventListener,
      );
    };
  }, [handleSave, handleCancel]);

  const availBal = preview ? (preview.availableBalance ?? 0) : 0;
  const daysReq = preview
    ? (preview.totalDays ?? draft.totalDays)
    : draft.totalDays;
  const balAfter = preview ? (preview.remainingAfter ?? 0) : 0;

  return (
    <div className="bg-slate-50/60 min-h-screen space-y-5">
      {/* ── Page header ── */}
      <SecondaryPageHeader
        title="Leave Management"
        description="Apply for and track employee leave requests"
        icon={<CalendarDays className="h-5 w-5 text-white" />}
      />

      {/* ── Balance KPI strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard
          label="Available Balance"
          value={availBal}
          description="Current balance"
          icon={<Clock className="h-5 w-5" />}
          color="blue"
        />
        <SummaryCard
          label="Days Requested"
          value={daysReq}
          description="For this request"
          icon={<Calendar className="h-5 w-5" />}
          color="emerald"
        />
        <SummaryCard
          label="Balance After"
          value={balAfter}
          description={balAfter < 0 ? "Exceeds balance" : "After this request"}
          icon={<TrendingUp className="h-5 w-5" />}
          color={balAfter < 0 ? "rose" : "violet"}
        />
      </div>

      {/* ── Leave Details ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead
          icon={<FileText className="h-3.5 w-3.5" />}
          label="Leave Details"
          accent="from-violet-600 to-blue-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Leave Type */}
          <Field label="Leave Type" required>
            <div className="relative">
              <Layers className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <select
                disabled={!editing || loadingTypes}
                className={cn(
                  "h-9 w-full appearance-none rounded-lg border border-slate-200 pl-9 pr-8 text-sm bg-white",
                  "focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 transition-colors",
                  (!editing || loadingTypes) &&
                    "bg-slate-50 text-slate-600 cursor-not-allowed",
                )}
                value={draft.leaveType}
                onChange={(e) =>
                  patch("leaveType", e.target.value as LeaveType)
                }
              >
                {loadingTypes ? (
                  <option>Loading…</option>
                ) : availableTypes.length === 0 ? (
                  <option disabled>No leave types available</option>
                ) : (
                  availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))
                )}
              </select>
              <ChevronIcon />
            </div>
          </Field>

          {/* Leave Status — read-only, set by the approval workflow */}
          <Field label="Leave Status">
            <div className="mt-0.5 flex h-9 items-center">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border",
                  leaveStatusMeta(draft.leaveStatus).cls,
                )}
              >
                {leaveStatusMeta(draft.leaveStatus).label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              New requests start as Pending for Approval and become Approved
              after an authorized approver decides.
            </p>
          </Field>
        </div>
      </div>

      {/* ── Leave Period ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Leave Period"
          accent="from-emerald-500 to-teal-600"
        />
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

          <Field label="Reporting to Office">
            <div className="relative">
              <UserCheck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                disabled={!editing}
                value={draft.returnDate}
                min={draft.endDate || undefined}
                onChange={(e) => patch("returnDate", e.target.value)}
                className={cn(iCls, "pl-9")}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Date the employee heads back to the office (after the leave ends).
            </p>
          </Field>

          <Field label="Applied On">
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                disabled
                value={draft.dateReported}
                className={cn(iCls, "pl-9 bg-slate-50")}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Set automatically when the request is submitted.
            </p>
          </Field>
        </div>

        {/* Include Weekends toggle + duration */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Toggle */}
          <button
            type="button"
            disabled={!editing}
            onClick={() => patch("includeWeekends", !draft.includeWeekends)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
              draft.includeWeekends
                ? "border-violet-300 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-600",
              !editing && "opacity-50 cursor-not-allowed",
            )}
          >
            <span
              className={cn(
                "inline-flex h-4 w-7 rounded-full transition-colors relative",
                draft.includeWeekends ? "bg-violet-500" : "bg-slate-200",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform",
                  draft.includeWeekends ? "translate-x-3.5" : "translate-x-0.5",
                )}
              />
            </span>
            Include Weekends
          </button>

          {/* Duration pill */}
          {draft.startDate && draft.endDate && draft.totalDays > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-4 py-2 w-fit">
              <CalendarDays className="h-4 w-4 text-violet-600 shrink-0" />
              <span className="text-sm text-violet-800">
                <span className="font-bold">{draft.totalDays}</span>{" "}
                {draft.totalDays === 1 ? "day" : "days"} selected
                {!draft.includeWeekends && (
                  <span className="ml-1 text-[10px] text-violet-500">
                    (working days)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Delegation ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead
          icon={<Users className="h-3.5 w-3.5" />}
          label="Delegation"
          accent="from-indigo-500 to-violet-600"
        />
        <p className="-mt-2 mb-4 text-xs text-slate-500">
          Optionally hand over your responsibilities to a colleague in your
          department while you're away. They cover for you for the duration of
          this leave.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Delegate to">
            <div className="relative">
              <UserCheck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <select
                disabled={!editing || loadingColleagues || colleagues.length === 0}
                className={cn(
                  "h-9 w-full appearance-none rounded-lg border border-slate-200 pl-9 pr-8 text-sm bg-white",
                  "focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 transition-colors",
                  (!editing || loadingColleagues || colleagues.length === 0) &&
                    "bg-slate-50 text-slate-600 cursor-not-allowed",
                )}
                value={draft.delegateId != null ? String(draft.delegateId) : ""}
                onChange={(e) =>
                  patch(
                    "delegateId",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">No delegation</option>
                {colleagues.map((c) => {
                  const name =
                    `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() ||
                    c.employeeNo ||
                    `#${c.id}`;
                  return (
                    <option key={c.id} value={String(c.id)}>
                      {name}
                      {c.designation ? ` — ${c.designation}` : ""}
                    </option>
                  );
                })}
              </select>
              <ChevronIcon />
            </div>
            {loadingColleagues ? (
              <p className="mt-1 text-[11px] text-slate-400">
                Loading colleagues…
              </p>
            ) : colleagues.length === 0 ? (
              <p className="mt-1 text-[11px] text-amber-600">
                No other colleagues found in{" "}
                {deptLabel ? `the ${deptLabel} department` : "your department"}{" "}
                to delegate to.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">
                Showing colleagues from{" "}
                {deptLabel ? `the ${deptLabel} department` : "your department"}.
              </p>
            )}
          </Field>

          {/* Coverage period — derived from the leave dates */}
          <Field label="Coverage period">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
              {draft.startDate && draft.endDate ? (
                <span>
                  {draft.startDate} → {draft.endDate}
                </span>
              ) : (
                <span className="text-slate-400">Set the leave dates above</span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              The delegate covers for the full leave period.
            </p>
          </Field>
        </div>

        {/* Selected delegate confirmation */}
        {draft.delegateId != null &&
          (() => {
            const d = colleagues.find((c) => Number(c.id) === draft.delegateId);
            if (!d) return null;
            const name =
              `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() ||
              d.employeeNo ||
              `#${d.id}`;
            return (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <p className="text-sm text-indigo-800">
                  <span className="font-semibold">{name}</span> will cover your
                  responsibilities
                  {draft.startDate && draft.endDate
                    ? ` from ${draft.startDate} to ${draft.endDate}`
                    : ""}{" "}
                  while you're on leave.
                </p>
              </div>
            );
          })()}
      </div>

      {/* ── Summary ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Leave Summary"
          accent="from-amber-500 to-orange-500"
        />
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

      {/* ── Document Upload (Sick Leave) ── */}
      {needsDoc && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <SectionHead
            icon={<Upload className="h-3.5 w-3.5" />}
            label="Supporting Document"
            accent="from-rose-500 to-pink-600"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setDocFile(f);
              setDocError(null);
              e.target.value = "";
            }}
          />

          {docFile ? (
            /* File selected — show preview row */
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {docFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(docFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setDocFile(null);
                    setDocError(null);
                  }}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            /* Drop zone */
            <button
              type="button"
              disabled={!editing}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8",
                "flex flex-col items-center gap-3 transition-colors",
                editing
                  ? "cursor-pointer hover:border-violet-300 hover:bg-violet-50/60"
                  : "cursor-not-allowed opacity-60",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Upload className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Upload medical certificate
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  PDF, JPG, or PNG · max 5 MB
                </p>
              </div>
            </button>
          )}

          {docError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {docError}
            </div>
          )}
        </div>
      )}

      {/* ── Live preview card (shown when dates + type are set) ── */}
      {preview && (
        <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Leave Preview
              </span>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                Live
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Days Requested",
                  value: preview.totalDays,
                  color: "text-slate-900",
                },
                {
                  label: "Current Balance",
                  value: preview.availableBalance,
                  color: "text-slate-900",
                },
                {
                  label: "Balance After",
                  value: preview.remainingAfter,
                  color:
                    (preview.remainingAfter ?? 0) < 0
                      ? "text-rose-600"
                      : "text-emerald-700",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {label}
                  </p>
                  <p className={cn("text-2xl font-bold tabular-nums", color)}>
                    {value ?? 0}
                  </p>
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
      <svg
        className="h-3.5 w-3.5 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );
}

function SectionHead({
  icon,
  label,
  accent = "from-violet-600 to-blue-600",
}: {
  icon: React.ReactNode;
  label: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
          accent,
        )}
      >
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
    totalDays: pickNumber(
      "totalDays",
      "total_days",
      "total",
      "days",
      "daysRequested",
    ),
    availableBalance: pickNumber(
      "availableBalance",
      "available_balance",
      "available",
      "balance",
      "currentBalance",
      "current_balance",
    ),
    remainingAfter: pickNumber(
      "remainingAfter",
      "remaining_after",
      "remaining",
      "balanceAfter",
      "balance_after",
      "remaining_balance",
      "balanceAfterLeave",
      "balance_after_leave",
    ),
  };
}
