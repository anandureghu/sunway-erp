import { useEffect, useState } from "react";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatClock(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function diffMs(from: string | null | undefined, to?: string | null): number {
  if (!from) return 0;
  const end = to ? new Date(to).getTime() : Date.now();
  return Math.max(0, end - new Date(from).getTime());
}

function msToDuration(ms: number): { h: number; m: number; s: number } {
  const s = Math.floor(ms / 1000);
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function formatDurationFull(ms: number): string {
  const { h, m, s } = msToDuration(ms);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatDuration(ms: number): string {
  const { h, m } = msToDuration(ms);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function ElapsedTimer({
  checkInTime,
  compact,
  small,
}: {
  checkInTime: string;
  compact?: boolean;
  small?: boolean;
}) {
  const [elapsed, setElapsed] = useState(diffMs(checkInTime));
  useEffect(() => {
    const t = setInterval(() => setElapsed(diffMs(checkInTime)), 1000);
    return () => clearInterval(t);
  }, [checkInTime]);

  if (compact) {
    return (
      <span className="shrink-0 font-mono text-xs tabular-nums text-white/70">
        {formatDurationFull(elapsed)}
      </span>
    );
  }

  if (small) {
    return (
      <div className="flex flex-col items-center gap-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
          Working
        </p>
        <p className="font-mono text-sm font-bold tabular-nums text-white">
          {formatDurationFull(elapsed)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
        Working for
      </p>
      <p className="font-mono text-3xl font-bold tabular-nums tracking-tight text-white">
        {formatDurationFull(elapsed)}
      </p>
    </div>
  );
}

export function ActionButton({
  isCheckedIn,
  loading,
  canCheckIn = true,
  onCheckIn,
  onCheckOut,
  compact,
  mini,
  small,
}: {
  isCheckedIn: boolean;
  loading: boolean;
  canCheckIn?: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  compact?: boolean;
  mini?: boolean;
  small?: boolean;
}) {
  const isCheckOut = isCheckedIn;
  const blocked = !isCheckOut && !canCheckIn;
  const size = mini
    ? "h-7 w-7"
    : small
      ? "h-16 w-16"
      : compact
        ? "h-32 w-32"
        : "h-40 w-40";
  const border = mini || small ? "border-2" : "border-4";
  const iconSize = mini ? "h-3.5 w-3.5" : small ? "h-5 w-5" : "h-6 w-6";
  const loaderSize = mini ? "h-3.5 w-3.5" : small ? "h-5 w-5" : "h-9 w-9";
  const iconWrap = small ? "h-7 w-7" : "h-12 w-12";
  const labelClass = small
    ? "text-[8px] font-bold uppercase tracking-wider text-white/90"
    : "text-xs font-bold uppercase tracking-widest text-white/90";

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      {!mini && !small && isCheckOut && !loading && (
        <>
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-30 animate-ping"
            style={{ animationDuration: "2.4s" }}
          />
          <span
            className="absolute inline-flex rounded-full bg-rose-300 opacity-20 animate-ping"
            style={{ width: "130%", height: "130%", animationDuration: "2.4s", animationDelay: "0.8s" }}
          />
        </>
      )}
      {!mini && !small && !isCheckOut && !loading && !blocked && (
        <span
          className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30 animate-ping"
          style={{ animationDuration: "2.4s" }}
        />
      )}

      <button
        type="button"
        onClick={isCheckOut ? onCheckOut : onCheckIn}
        disabled={loading || blocked}
        title={
          blocked
            ? "Check-in is only available for active employees"
            : isCheckOut
              ? "Check Out"
              : "Check In"
        }
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-95",
          !mini && "flex-col",
          size,
          border,
          isCheckOut
            ? "border-rose-300/50 bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 shadow-rose-500/40 hover:scale-105 hover:shadow-rose-500/60"
            : "border-emerald-300/50 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-emerald-500/40 hover:scale-105 hover:shadow-emerald-500/60",
          (loading || blocked) && "cursor-not-allowed opacity-60",
          blocked && "grayscale hover:scale-100",
        )}
      >
        {loading ? (
          <Loader2 className={cn(loaderSize, "animate-spin text-white")} />
        ) : isCheckOut ? (
          mini ? (
            <LogOut className={cn(iconSize, "text-white")} />
          ) : (
            <>
              <div
                className={cn(
                  "mb-0.5 flex items-center justify-center rounded-full bg-white/10",
                  iconWrap,
                )}
              >
                <LogOut className={cn(iconSize, "text-white")} />
              </div>
              <span className={labelClass}>Check Out</span>
            </>
          )
        ) : mini ? (
          <LogIn className={cn(iconSize, "text-white")} />
        ) : (
          <>
            <div
              className={cn(
                "mb-0.5 flex items-center justify-center rounded-full bg-white/10",
                iconWrap,
              )}
            >
              <LogIn className={cn(iconSize, "text-white")} />
            </div>
            <span className={labelClass}>Check In</span>
          </>
        )}
      </button>
    </div>
  );
}
