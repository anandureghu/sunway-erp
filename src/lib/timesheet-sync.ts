// Lightweight cross-component (and cross-tab) sync for attendance check-in/out.
// The header shift widget and the Timesheet page each hold their own copy of
// "today's" entry; whichever one performs a check-in/out broadcasts here so the
// others refetch and everything stays in step.
//
// Same-tab listeners get an in-process CustomEvent; other browser tabs get a
// `storage` event via a localStorage ping — so checking out on the dashboard also
// updates a timesheet open in another tab.

const EVENT = "timesheet:changed";
const LS_KEY = "timesheet:changed:at";

/**
 * Broadcast that today's attendance changed (after a check-in / check-out).
 * Pass the affected employeeId when known so listeners can scope their refresh.
 */
export function notifyTimesheetChanged(employeeId?: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { employeeId } }));
  try {
    // Value must change to fire `storage` in other tabs — timestamp does that.
    window.localStorage.setItem(LS_KEY, `${Date.now()}:${employeeId ?? ""}`);
  } catch {
    /* localStorage may be unavailable (private mode) — same-tab event still fires */
  }
}

/**
 * Subscribe to attendance changes (this tab and other tabs); returns an
 * unsubscribe function. The callback receives the affected employeeId when known.
 */
export function onTimesheetChanged(
  cb: (employeeId?: number) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const onEvent = (e: Event) =>
    cb((e as CustomEvent<{ employeeId?: number }>).detail?.employeeId);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== LS_KEY || !e.newValue) return;
    const raw = e.newValue.split(":")[1];
    cb(raw ? Number(raw) : undefined);
  };
  window.addEventListener(EVENT, onEvent);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onEvent);
    window.removeEventListener("storage", onStorage);
  };
}
