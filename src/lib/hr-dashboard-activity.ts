import type { HrRecentActivity } from "@/types/hrDashboard";

export function currentYearMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthLabel(date = new Date()): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function isInYearMonth(iso: string, yearMonth: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return currentYearMonth(d) === yearMonth;
}

/** Stable key for archive storage when the API omits an id. */
export function hrActivityKey(activity: HrRecentActivity, index?: number): string {
  if (activity.id != null && String(activity.id).trim() !== "") {
    return String(activity.id);
  }
  const base = `${activity.occurredAt}|${activity.employeeName}|${activity.description}`;
  return index != null ? `${base}|${index}` : base;
}

export function filterHrActivitiesForMonth(
  activities: HrRecentActivity[],
  yearMonth: string,
): HrRecentActivity[] {
  return activities.filter((activity) => isInYearMonth(activity.occurredAt, yearMonth));
}
