import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { fetchHrPolicies } from "@/service/companyService";

const IDLE_OPTIONS = new Set([15, 20, 30]);
/** Warn this many seconds before forced logout. */
const WARN_SECONDS = 60;
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
];

/**
 * Signs the user out after company-configured idle time (HR policies:
 * sessionIdleTimeoutMinutes — 15 / 20 / 30, or off).
 */
export function SessionIdleTimeoutGuard() {
  const { isAuthenticated, activeCompanyId, logout } = useAuth();
  const [timeoutMinutes, setTimeoutMinutes] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivityRef = useRef(Date.now());
  const loggingOutRef = useRef(false);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSecondsLeft(null);
  }, []);

  // Load idle policy for the active company.
  useEffect(() => {
    if (!isAuthenticated || activeCompanyId == null) {
      setTimeoutMinutes(0);
      setSecondsLeft(null);
      return;
    }
    let cancelled = false;
    fetchHrPolicies(activeCompanyId)
      .then((policies) => {
        if (cancelled) return;
        const raw = policies.sessionIdleTimeoutMinutes ?? 0;
        setTimeoutMinutes(IDLE_OPTIONS.has(raw) ? raw : 0);
      })
      .catch(() => {
        if (!cancelled) setTimeoutMinutes(0);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, activeCompanyId]);

  // Track user activity.
  useEffect(() => {
    if (!isAuthenticated || timeoutMinutes <= 0) return;

    markActivity();
    const onActivity = () => markActivity();
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, onActivity, { passive: true });
    }
    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, onActivity);
      }
    };
  }, [isAuthenticated, timeoutMinutes, markActivity]);

  const forceLogout = useCallback(() => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setSecondsLeft(null);
    toast.message("Signed out due to inactivity", {
      description: "Your session ended after the company idle timeout.",
    });
    logout();
  }, [logout]);

  // Countdown / logout tick.
  useEffect(() => {
    if (!isAuthenticated || timeoutMinutes <= 0) {
      setSecondsLeft(null);
      loggingOutRef.current = false;
      return;
    }

    loggingOutRef.current = false;
    const timeoutMs = timeoutMinutes * 60_000;

    const tick = () => {
      if (loggingOutRef.current) return;
      const idleMs = Date.now() - lastActivityRef.current;
      const remainingMs = timeoutMs - idleMs;
      if (remainingMs <= 0) {
        forceLogout();
        return;
      }
      if (remainingMs <= WARN_SECONDS * 1000) {
        setSecondsLeft(Math.ceil(remainingMs / 1000));
      } else {
        setSecondsLeft(null);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, timeoutMinutes, forceLogout]);

  if (secondsLeft == null) return null;

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-timeout-title"
      aria-describedby="idle-timeout-desc"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="idle-timeout-title"
                className="text-base font-bold text-slate-900"
              >
                Session about to expire
              </h2>
              <p
                id="idle-timeout-desc"
                className="mt-1 text-sm leading-relaxed text-slate-600"
              >
                You have been inactive. You will be signed out when the timer
                ends unless you continue working.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              {mm}:{ss}
            </span>
            <span className="text-xs font-medium text-slate-500">
              until sign-out
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void forceLogout()}
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out now
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              onClick={markActivity}
            >
              Stay signed in
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionIdleTimeoutGuard;
