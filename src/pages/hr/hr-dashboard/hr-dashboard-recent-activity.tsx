import {
  DashboardCardSkeletonGrid,
  DashboardEmpty,
  DashboardSectionCard,
  formatShortDate,
  formatTime,
} from "@/components/dashboard";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  currentMonthLabel,
  currentYearMonth,
  filterHrActivitiesForMonth,
  hrActivityKey,
} from "@/lib/hr-dashboard-activity";
import type { HrRecentActivity } from "@/types/hrDashboard";
import { Archive, ArchiveRestore } from "lucide-react";
import { useMemo, useState } from "react";
import { useHrActivityArchive } from "./use-hr-activity-archive";

type ActivityRow = { activity: HrRecentActivity; index: number };
type ViewMode = "active" | "archived";

export function HrDashboardRecentActivity({
  activities,
  companyId,
  loading,
}: {
  activities: HrRecentActivity[];
  companyId?: string | number;
  loading: boolean;
}) {
  const yearMonth = currentYearMonth();
  const monthActivities = useMemo(
    () => filterHrActivitiesForMonth(activities, yearMonth),
    [activities, yearMonth],
  );
  const { archive, restore, isArchived, archivedCount } =
    useHrActivityArchive(companyId);
  const [view, setView] = useState<ViewMode>("active");

  const { activeList, archivedList } = useMemo(() => {
    const active: ActivityRow[] = [];
    const archived: ActivityRow[] = [];
    monthActivities.forEach((activity, index) => {
      const row = { activity, index };
      if (isArchived(activity, index)) archived.push(row);
      else active.push(row);
    });
    return { activeList: active, archivedList: archived };
  }, [monthActivities, isArchived]);

  const visibleList = view === "active" ? activeList : archivedList;
  const {
    pageItems,
    pageIndex,
    pageSize,
    pageCount,
    total,
    setPageIndex,
    setPageSize,
  } = usePagination(visibleList, 8);

  if (loading) {
    return (
      <DashboardCardSkeletonGrid
        count={1}
        className="grid-cols-1"
        cardClassName="h-[280px] rounded-xl"
      />
    );
  }

  return (
    <DashboardSectionCard
      title="Recent activity"
      description={`${currentMonthLabel()} only — older months are not shown here.`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setView("active")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "active"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Active ({activeList.length})
          </button>
          <button
            type="button"
            onClick={() => setView("archived")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "archived"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Archived ({archivedList.length})
          </button>
        </div>
        {view === "active" && activeList.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              activeList.forEach((row) => archive(row.activity, row.index))
            }
          >
            <Archive className="h-4 w-4" />
            Archive all
          </Button>
        ) : null}
      </div>

      {monthActivities.length === 0 ? (
        <DashboardEmpty message="No HR activity recorded this month." />
      ) : visibleList.length === 0 ? (
        <DashboardEmpty
          message={
            view === "active"
              ? "All activity for this month has been archived."
              : "No archived activity for this month."
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map((row) => {
              const { activity, index } = row;
              return (
                <div
                  key={hrActivityKey(activity, index)}
                  className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">
                      {activity.description}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {activity.employeeName}
                      {activity.occurredAt
                        ? ` · ${formatShortDate(activity.occurredAt)} ${formatTime(activity.occurredAt)}`
                        : null}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1.5 text-muted-foreground"
                    onClick={() =>
                      view === "active"
                        ? archive(activity, index)
                        : restore(activity, index)
                    }
                  >
                    {view === "active" ? (
                      <>
                        <Archive className="h-4 w-4" />
                        Archive
                      </>
                    ) : (
                      <>
                        <ArchiveRestore className="h-4 w-4" />
                        Restore
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
          <TablePagination
            total={total}
            pageIndex={pageIndex}
            pageSize={pageSize}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 8, 15, 20]}
          />
        </>
      )}

      {archivedCount > 0 && view === "active" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {archivedCount} archived item{archivedCount === 1 ? "" : "s"} hidden
          from this list. Switch to Archived to review or restore.
        </p>
      ) : null}
    </DashboardSectionCard>
  );
}
