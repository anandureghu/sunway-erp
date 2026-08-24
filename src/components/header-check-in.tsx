import { useEffect, useState } from "react";
import { LogIn, LogOut, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  timesheetService,
  type TimesheetEntry,
} from "@/service/timesheetService";
import { cn } from "@/lib/utils";
import { notifyTimesheetChanged, onTimesheetChanged } from "@/lib/timesheet-sync";
import { diffMs, formatDurationCompact, resolveCompanyTimezone } from "@/lib/timesheet-time";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

/** "Xh Ym" elapsed since check-in. */
function elapsedLabel(
  checkInIso?: string | null,
  timeZone?: string | null,
): string {
  if (!checkInIso) return "";
  return formatDurationCompact(
    diffMs(checkInIso, undefined, resolveCompanyTimezone(timeZone)),
  );
}

/**
 * Header shift widget — lets an employee start (check in) or end (check out) their
 * shift from anywhere. Only shown for users linked to an employee record, and only
 * when the active company requires punch in/out (`requireCheckIn`).
 */
export function HeaderCheckIn() {
  const { user } = useAuth();
  const { confirm } = useConfirmDialog();
  const empIdRaw = (user as { employeeId?: number | string } | null)
    ?.employeeId;
  const empId = empIdRaw != null ? Number(empIdRaw) : null;
  const companyId = user?.companyId != null ? Number(user.companyId) : null;

  // Companies that don't punch in/out have no shift to start — hide the widget.

  const [today, setToday] = useState<TimesheetEntry | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    if (empId == null) {
      setToday(null);
      setLoaded(false);
      return;
    }
    let mounted = true;
    setLoaded(false);
    const refresh = () => {
      timesheetService
        .getToday(empId)
        .then((t) => {
          if (mounted) {
            setToday(t);
            setLoaded(true);
          }
        })
        .catch(() => {
          if (mounted) {
            setToday(null);
            setLoaded(true);
          }
        });
    };
    refresh();
    // Re-sync when a check-in/out happens elsewhere (e.g. the Timesheet page).
    const off = onTimesheetChanged(refresh);
    return () => {
      mounted = false;
      off();
    };
  }, [empId, companyId]);

  const checkedIn = !!(today?.checkInTime && !today?.checkOutTime);
  const punchRequired = today?.requireCheckIn !== false;

  // Refresh the elapsed label while checked in.
  useEffect(() => {
    if (!checkedIn) return;
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [checkedIn]);

  if (empId == null || !loaded || !punchRequired) return null;

  const complete = !!(today?.checkInTime && today?.checkOutTime);

  const handle = async () => {
    if (busy) return;
    if (checkedIn) {
      const ok = await confirm({
        title: "Check out?",
        description:
          "End your shift for today? You will not be able to check in again until tomorrow.",
        confirmLabel: "Check Out",
        cancelLabel: "Stay clocked in",
        variant: "destructive",
      });
      if (!ok) return;
    }

    setBusy(true);
    try {
      if (!today?.checkInTime) {
        setToday(await timesheetService.checkIn(empId));
        toast.success("Checked in — shift started");
        notifyTimesheetChanged();
      } else if (checkedIn) {
        setToday(await timesheetService.checkOut(empId));
        toast.success("Checked out — shift ended");
        notifyTimesheetChanged();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Attendance update failed");
    } finally {
      setBusy(false);
    }
  };

  if (complete) {
    return (
      <span className="hidden items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
        <CheckCircle2 className="h-3.5 w-3.5" /> Shift done
      </span>
    );
  }

  return (
    <button
      onClick={handle}
      disabled={busy}
      title={checkedIn ? "End your shift" : "Start your shift"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-60",
        checkedIn
          ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700"
          : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : checkedIn ? (
        <LogOut className="h-3.5 w-3.5" />
      ) : (
        <LogIn className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">
        {checkedIn ? `Check Out · ${elapsedLabel(today?.checkInTime, today?.timezone)}` : "Check In"}
      </span>
      <span className="sm:hidden">{checkedIn ? "Out" : "In"}</span>
    </button>
  );
}

export default HeaderCheckIn;
