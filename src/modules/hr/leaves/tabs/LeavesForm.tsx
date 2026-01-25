import { useEffect, useState, useCallback } from "react";
import type { ReactElement } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { leaveService } from "@/service/leaveService";
import { toast } from "sonner";
import type { LeavePreview } from "@/service/leaveService";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full opacity-20 blur-3xl -mr-32 -mt-32"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">🏖️ Employee Leaves</h1>
                <p className="text-slate-600">Manage and apply for employee leave requests</p>
              </div>
            </div>
            <div className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm font-semibold shadow-lg">
              ✨ Smart Leave Management System
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Total Balance</span>
                </div>
                <p className="text-3xl font-bold">{preview?.currentBalance ?? draft.leaveBalance ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Days Requested</span>
                </div>
                <p className="text-3xl font-bold">{draft.totalDays ?? 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Balance After</span>
                </div>
                <p className="text-3xl font-bold">{preview?.balanceAfterLeave ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FORM */}
        <Card className="border-slate-200 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 bg-gradient-to-br from-white to-slate-50 space-y-6">

              {/* Leave Details Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 pb-3 border-b border-slate-200 flex items-center gap-2 flex-1">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Leave Details
                  </h3>
                  {draft.leaveStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor()}`}>
                      {draft.leaveStatus}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="Leave Code" required>
                    <Input
                      disabled={!editing}
                      value={draft.leaveCode}
                      onChange={(e) => patch("leaveCode", e.target.value)}
                      placeholder="e.g., L001"
                      className="rounded-lg border-slate-300"
                      required
                    />
                  </Field>

                  <Field label="Start Date" required>
                    <Input
                      type="date"
                      disabled={!editing}
                      value={draft.startDate}
                      onChange={(e) => patch("startDate", e.target.value)}
                      className="rounded-lg border-slate-300"
                      required
                    />
                  </Field>

                  <Field label="Date Reported">
                    <Input
                      type="date"
                      disabled={!editing}
                      value={draft.dateReported}
                      onChange={(e) => patch("dateReported", e.target.value)}
                      className="rounded-lg border-slate-300"
                    />
                  </Field>
                </div>
              </div>

              {/* Leave Configuration Section */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-purple-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 pb-3 border-b border-purple-200 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                  Leave Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="Leave Type" required>
                    <select
                      disabled={!editing}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 bg-white"
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
                  </Field>

                  <Field label="End Date" required>
                    <Input
                      type="date"
                      disabled={!editing}
                      value={draft.endDate}
                      onChange={(e) => patch("endDate", e.target.value)}
                      className="rounded-lg border-slate-300 bg-white"
                      required
                    />
                  </Field>

                  <Field label="Leave Balance">
                    <Input
                      disabled={!editing}
                      value={draft.leaveBalance}
                      onChange={(e) => patch("leaveBalance", e.target.value)}
                      placeholder="Auto-calculated"
                      className="rounded-lg border-slate-300 bg-white"
                    />
                  </Field>
                </div>
              </div>

              {/* Status and Summary Section */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 shadow-sm border border-blue-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 pb-3 border-b border-blue-200 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Status and Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="Leave Status" required>
                    <select
                      disabled={!editing}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
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
                  </Field>

                  <Field label="Total Days on Vacation">
                    <Input 
                      disabled 
                      value={String(draft.totalDays)} 
                      className="rounded-lg border-slate-300 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 font-semibold text-emerald-700"
                    />
                  </Field>

                  <div />
                </div>
              </div>

              {/* Preview Section */}
              {preview && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-3">Leave Preview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Days</p>
                          <p className="text-base text-slate-800 font-bold">{preview.totalDays}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Current Balance</p>
                          <p className="text-base text-slate-800 font-bold">{preview.currentBalance}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Balance After Leave</p>
                          <p className="text-base text-slate-800 font-bold">{preview.balanceAfterLeave}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      </div>
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