import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  timesheetService,
  type TimesheetEntry,
} from "@/service/timesheetService";
import { notifyTimesheetChanged, onTimesheetChanged } from "@/lib/timesheet-sync";

/**
 * Warns when the employee reaches max shift (standard hours + OT cap), then
 * auto check-outs after the company grace period (15/20/30 min, or immediately
 * when grace is 0).
 */
export function MaxShiftCheckoutGuard() {
  const { user, isAuthenticated } = useAuth();
  const empIdRaw = (user as { employeeId?: number | string } | null)?.employeeId;
  const empId = empIdRaw != null ? Number(empIdRaw) : null;

  const [today, setToday] = useState<TimesheetEntry | null>(null);
  const [phase, setPhase] = useState<"idle" | "warning" | "checked_out">("idle");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const checkingOutRef = useRef(false);

  const refresh = useCallback(() => {
    if (empId == null) {
      setToday(null);
      return;
    }
    timesheetService
      .getToday(empId)
      .then((entry) => setToday(entry))
      .catch(() => {});
  }, [empId]);

  useEffect(() => {
    if (!isAuthenticated || empId == null) {
      setToday(null);
      setPhase("idle");
      return;
    }
    refresh();
    const off = onTimesheetChanged(refresh);
    const poll = window.setInterval(refresh, 30_000);
    return () => {
      off();
      window.clearInterval(poll);
    };
  }, [isAuthenticated, empId, refresh]);

  const performAutoCheckout = useCallback(async () => {
    if (empId == null || checkingOutRef.current) return;
    checkingOutRef.current = true;
    try {
      const entry = await timesheetService.checkOut(empId);
      setToday(entry);
      setPhase("checked_out");
      setSecondsLeft(null);
      notifyTimesheetChanged();
      toast.message("Checked out as per company policy", {
        description:
          "Your maximum shift (including overtime) has ended. Please stop work for this session.",
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not auto check-out";
      // Already checked out elsewhere — treat as done.
      if (/already checked out/i.test(message)) {
        setPhase("checked_out");
        refresh();
        notifyTimesheetChanged();
      } else {
        toast.error(message);
        checkingOutRef.current = false;
      }
    }
  }, [empId, refresh]);

  // Tick while checked in.
  useEffect(() => {
    const checkedIn = !!(today?.checkInTime && !today?.checkOutTime);
    if (!checkedIn || !today?.checkInTime || !today.maxShiftMinutes) {
      setSecondsLeft(null);
      checkingOutRef.current = false;
      return;
    }

    const maxShiftMs = today.maxShiftMinutes * 60_000;
    const graceMs = Math.max(0, (today.maxShiftCheckoutGraceMinutes ?? 0) * 60_000);
    const checkInAt = new Date(today.checkInTime).getTime();

    const tick = () => {
      if (checkingOutRef.current) return;
      const elapsed = Date.now() - checkInAt;
      if (elapsed < maxShiftMs) {
        setPhase((p) => (p === "checked_out" ? p : "idle"));
        setSecondsLeft(null);
        return;
      }

      const untilCheckout = maxShiftMs + graceMs - elapsed;
      if (untilCheckout <= 0) {
        setSecondsLeft(0);
        void performAutoCheckout();
        return;
      }

      setPhase((p) => (p === "checked_out" ? p : "warning"));
      setSecondsLeft(Math.ceil(untilCheckout / 1000));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [today, performAutoCheckout]);

  if (phase === "checked_out") {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-rose-200/70 bg-white shadow-2xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-orange-500" />
          <div className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  You have been checked out as per company policy
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Your maximum allowed shift (standard working hours plus overtime)
                  has ended. Please stop work for this session. You can continue
                  using the app, but attendance for today is closed.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  setPhase("idle");
                  refresh();
                }}
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase !== "warning" || secondsLeft == null) return null;

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const maxHours = today?.maxShiftMinutes
    ? (today.maxShiftMinutes / 60).toFixed(today.maxShiftMinutes % 60 === 0 ? 0 : 1)
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="max-shift-title"
      aria-describedby="max-shift-desc"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="max-shift-title"
                className="text-base font-bold text-slate-900"
              >
                Maximum shift reached
              </h2>
              <p
                id="max-shift-desc"
                className="mt-1 text-sm leading-relaxed text-slate-600"
              >
                You have reached the company limit
                {maxHours ? ` of ${maxHours} hours` : ""} (standard day
                {today?.otMaxHoursPerDay
                  ? ` + ${today.otMaxHoursPerDay}h overtime`
                  : ""}
                ). Finish wrapping up — you will be checked out automatically when
                the grace period ends.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              {mm}:{ss}
            </span>
            <span className="text-xs font-medium text-slate-500">
              until auto check-out
            </span>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              className="gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700"
              onClick={() => void performAutoCheckout()}
            >
              <LogOut className="h-4 w-4" />
              Check out now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MaxShiftCheckoutGuard;
