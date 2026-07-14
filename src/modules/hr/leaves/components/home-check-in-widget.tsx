import { useCallback, useEffect, useState } from "react";
import {
  timesheetService,
  type TimesheetEntry,
} from "@/service/timesheetService";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Sun,
  Moon,
  Coffee,
} from "lucide-react";
import { hrService } from "@/service/hr.service";
import {
  ActionButton,
  ElapsedTimer,
  formatClock,
} from "./timesheet-check-in-ui";

function getGreeting(h: number): { label: string; icon: typeof Sun } {
  if (h < 12) return { label: "Good Morning", icon: Sun };
  if (h < 17) return { label: "Good Afternoon", icon: Coffee };
  return { label: "Good Evening", icon: Moon };
}

type Props = {
  employeeId: number;
  employeeName?: string;
};

export function HomeCheckInWidget({ employeeId, employeeName }: Props) {
  const [now, setNow] = useState(new Date());
  const [todayEntry, setTodayEntry] = useState<TimesheetEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [employeeActive, setEmployeeActive] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    hrService
      .getEmployee(String(employeeId))
      .then((emp) => {
        if (!mounted) return;
        const s = String((emp as { status?: string })?.status ?? "").toUpperCase();
        const inactive = [
          "INACTIVE",
          "ON_LEAVE",
          "RESIGNED",
          "TERMINATED",
          "RETIRED",
        ].includes(s);
        setEmployeeActive(!inactive);
      })
      .catch(() => {
        if (mounted) setEmployeeActive(true);
      });
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = await timesheetService.getToday(employeeId);
      setTodayEntry(today);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isCheckedIn = !!(todayEntry?.checkInTime && !todayEntry?.checkOutTime);
  const isComplete = !!(todayEntry?.checkInTime && todayEntry?.checkOutTime);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const entry = await timesheetService.checkIn(employeeId);
      setTodayEntry(entry);
      toast.success("Checked in successfully!");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to check in"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const entry = await timesheetService.checkOut(employeeId);
      setTodayEntry(entry);
      toast.success("Checked out successfully!");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to check out"));
    } finally {
      setActionLoading(false);
    }
  };

  const greeting = getGreeting(now.getHours());
  const GreetIcon = greeting.icon;

  if (loading) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-2xl border bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div
      className="relative h-[120px] overflow-hidden rounded-2xl shadow-xl"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,0.3) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="pointer-events-none absolute -top-16 left-1/4 h-40 w-40 rounded-full bg-indigo-600/20 blur-3xl" />

      <div className="relative grid h-[120px] grid-cols-2">
        <div className="flex flex-col justify-center gap-1.5 border-b border-white/10 px-5 py-3 md:border-b-0 md:border-r md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10">
              <GreetIcon className="h-3.5 w-3.5 text-yellow-300" />
            </div>
            <span className="text-xs font-semibold tracking-wide text-white/60">
              {greeting.label}
              {employeeName ? `, ${employeeName.split(" ")[0]}` : ""}
            </span>
          </div>

          <div className="font-mono text-3xl font-black leading-none tracking-tighter text-white tabular-nums">
            {formatClock(now)}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-white/40">
              <MapPin className="h-3 w-3" />
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>


          </div>

        </div>

        <div className="flex items-center justify-center gap-4 px-5 py-3">
          {isComplete ? (
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400/30 bg-emerald-500/20">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="max-w-[140px] text-xs text-white/40">
                You have completed your shift for today.
              </p>
            </div>
          ) : (
            <>
              <ActionButton
                isCheckedIn={isCheckedIn}
                loading={actionLoading}
                canCheckIn={employeeActive}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                small
              />
              {isCheckedIn && todayEntry?.checkInTime && (
                <ElapsedTimer checkInTime={todayEntry.checkInTime} small />
              )}
              {!isCheckedIn && employeeActive && (
                <p className="text-[10px] font-medium tracking-wide text-white/30">
                  Tap to start your shift
                </p>
              )}
              {!isCheckedIn && !employeeActive && (
                <p className="text-[10px] font-medium tracking-wide text-amber-300/80">
                  Check-in disabled — not active
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
