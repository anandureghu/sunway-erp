import { useEffect, useState, useCallback } from "react";
import type { ReactElement } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams } from "react-router-dom";
import { leaveService } from "@/service/leaveService";
import { toast } from "sonner";
import type { LeavePreview } from "@/service/leaveService";
import { Calendar, Clock, CheckCircle, AlertCircle, FileText, TrendingUp } from "lucide-react";

type Ctx = { editing: boolean; setEditing?: (b: boolean) => void };

type LeaveStatus = "Pending" | "Approved" | "Rejected";
type LeaveType =
  | "Annual Leave"
  | "Sick Leave"
  | "Emergency Leave"
  | "Unpaid Leave";

const STATUS: LeaveStatus[] = ["Pending", "Approved", "Rejected"];
const TYPES: LeaveType[] = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Unpaid Leave",
];

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

  useEffect(() => {
    if (!preview) return;
    setDraft((d) =>
      d.leaveBalance === String(preview.currentBalance)
        ? d
        : { ...d, leaveBalance: String(preview.currentBalance) }
    );
  }, [preview]);

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

  useEffect(() => {
    if (!employeeId) return;
    if (!draft.leaveType || !draft.startDate || !draft.endDate) {
      setPreview(null);
      return;
    }
    let mounted = true;
    leaveService
      .previewLeave(employeeId, draft.leaveType, draft.startDate, draft.endDate)
      .then((res) => mounted && setPreview(res.data))
      .catch((err) => {
        console.error("Preview error", err);
        setPreview(null);
        toast.error(err?.response?.data?.message || "Preview failed");
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
    const payload = {
      leaveType: draft.leaveType,
      startDate: draft.startDate,
      endDate: draft.endDate,
    };
    leaveService
      .applyLeave(employeeId, payload)
      .then(() => {
        toast.success("Leave applied successfully");
        setPreview(null);
        setSaved(draft);
        try {
          document.dispatchEvent(new CustomEvent("leaves:saved"));
        } catch {}
      })
      .catch((err) => {
        console.error("Apply leave failed", err);
        toast.error(err?.response?.data?.message || "Failed to apply leave");
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

  const getStatusColor = () => {
    switch (draft.leaveStatus) {
      case "Approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getStatusIcon = () => {
    switch (draft.leaveStatus) {
      case "Approved": return <CheckCircle className="h-4 w-4" />;
      case "Rejected": return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-800">Leave Management</h2>
            <p className="text-sm text-slate-500 mt-1">Apply for and track employee leave requests</p>
          </div>
          {draft.leaveStatus && (
            <div className={`px-4 py-2 rounded-lg border font-medium text-sm flex items-center gap-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              {draft.leaveStatus}
            </div>
          )}
        </div>
      </div>

      {/* Leave Application Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <h3 className="text-base font-semibold text-slate-800">Leave Application</h3>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Stats Cards - Always Visible */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-200">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Available Balance</p>
                  <p className="text-2xl font-bold text-blue-900">{preview?.currentBalance ?? (draft.leaveBalance || "—")}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2.5 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 font-medium">Days Requested</p>
                  <p className="text-2xl font-bold text-emerald-900">{draft.totalDays ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-5 border border-violet-200">
              <div className="flex items-center gap-3">
                <div className="bg-violet-600 p-2.5 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-violet-600 font-medium">Balance After</p>
                  <p className="text-2xl font-bold text-violet-900">{preview?.balanceAfterLeave ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
              Leave Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Leave Code" required>
                <div className="relative">
                  <Input
                    disabled={!editing}
                    value={draft.leaveCode}
                    onChange={(e) => patch("leaveCode", e.target.value)}
                    placeholder="e.g., L001"
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    required
                  />
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Leave Type" required>
                <div className="relative">
                  <select
                    disabled={!editing}
                    className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm disabled:bg-slate-50 disabled:text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all appearance-none"
                    value={draft.leaveType}
                    onChange={(e) => patch("leaveType", e.target.value as LeaveType)}
                    required
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </Field>

              <Field label="Leave Status" required>
                <div className="relative">
                  <select
                    disabled={!editing}
                    className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm disabled:bg-slate-50 disabled:text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all appearance-none"
                    value={draft.leaveStatus}
                    onChange={(e) => patch("leaveStatus", e.target.value as LeaveStatus)}
                    required
                  >
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </Field>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Leave Period */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-600 rounded-full"></div>
              Leave Period
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Start Date" required>
                <div className="relative">
                  <Input
                    type="date"
                    disabled={!editing}
                    value={draft.startDate}
                    onChange={(e) => patch("startDate", e.target.value)}
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="End Date" required>
                <div className="relative">
                  <Input
                    type="date"
                    disabled={!editing}
                    value={draft.endDate}
                    onChange={(e) => patch("endDate", e.target.value)}
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Date Reported">
                <div className="relative">
                  <Input
                    type="date"
                    disabled={!editing}
                    value={draft.dateReported}
                    onChange={(e) => patch("dateReported", e.target.value)}
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Leave Summary */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-violet-600 rounded-full"></div>
              Leave Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Total Days">
                <div className="relative">
                  <Input 
                    disabled 
                    value={String(draft.totalDays)} 
                    className="h-10 pl-10 border-slate-300 bg-slate-50 font-semibold text-slate-700"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Leave Balance">
                <div className="relative">
                  <Input
                    disabled={!editing}
                    value={draft.leaveBalance}
                    onChange={(e) => patch("leaveBalance", e.target.value)}
                    placeholder="Auto-calculated"
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                  />
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-600 p-3 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Leave Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-600 mb-1">Total Days</p>
                  <p className="text-2xl font-bold text-slate-800">{preview.totalDays}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-600 mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-slate-800">{preview.currentBalance}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-600 mb-1">Balance After Leave</p>
                  <p className="text-2xl font-bold text-slate-800">{preview.balanceAfterLeave}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}