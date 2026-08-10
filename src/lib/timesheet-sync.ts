// Lightweight cross-component sync for attendance check-in/out. The header shift
// widget and the Timesheet page each hold their own copy of "today's" entry;
// whichever one performs a check-in/out broadcasts here so the other refetches
// and both stay in step.

const EVENT = "timesheet:changed";

/** Broadcast that today's attendance changed (after a check-in / check-out). */
export function notifyTimesheetChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

/** Subscribe to attendance changes; returns an unsubscribe function. */
export function onTimesheetChanged(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
