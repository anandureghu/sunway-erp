import { useCallback, useEffect, useMemo, useState } from "react";
import {
  currentYearMonth,
  hrActivityKey,
} from "@/lib/hr-dashboard-activity";
import type { HrRecentActivity } from "@/types/hrDashboard";

function storageKey(companyId: string, yearMonth: string) {
  return `hr-dashboard-activity-archive:${companyId}:${yearMonth}`;
}

function readArchivedIds(companyId: string, yearMonth: string): Set<string> {
  if (typeof window === "undefined" || !companyId) return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey(companyId, yearMonth));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(String));
  } catch {
    return new Set();
  }
}

function writeArchivedIds(
  companyId: string,
  yearMonth: string,
  ids: Set<string>,
) {
  if (typeof window === "undefined" || !companyId) return;
  window.localStorage.setItem(
    storageKey(companyId, yearMonth),
    JSON.stringify([...ids]),
  );
}

export function useHrActivityArchive(companyId: string | number | undefined) {
  const companyKey = companyId != null ? String(companyId) : "";
  const yearMonth = currentYearMonth();
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() =>
    readArchivedIds(companyKey, yearMonth),
  );

  useEffect(() => {
    setArchivedIds(readArchivedIds(companyKey, yearMonth));
  }, [companyKey, yearMonth]);

  const archive = useCallback(
    (activity: HrRecentActivity, index: number) => {
      const key = hrActivityKey(activity, index);
      setArchivedIds((prev) => {
        const next = new Set(prev);
        next.add(key);
        writeArchivedIds(companyKey, yearMonth, next);
        return next;
      });
    },
    [companyKey, yearMonth],
  );

  const restore = useCallback(
    (activity: HrRecentActivity, index: number) => {
      const key = hrActivityKey(activity, index);
      setArchivedIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        writeArchivedIds(companyKey, yearMonth, next);
        return next;
      });
    },
    [companyKey, yearMonth],
  );

  const archiveAll = useCallback(
    (activities: HrRecentActivity[]) => {
      setArchivedIds((prev) => {
        const next = new Set(prev);
        activities.forEach((activity, index) => {
          next.add(hrActivityKey(activity, index));
        });
        writeArchivedIds(companyKey, yearMonth, next);
        return next;
      });
    },
    [companyKey, yearMonth],
  );

  const isArchived = useCallback(
    (activity: HrRecentActivity, index: number) =>
      archivedIds.has(hrActivityKey(activity, index)),
    [archivedIds],
  );

  const archivedCount = archivedIds.size;

  return useMemo(
    () => ({
      archive,
      restore,
      archiveAll,
      isArchived,
      archivedCount,
    }),
    [archive, restore, archiveAll, isArchived, archivedCount],
  );
}
