import {
  DashboardCardSkeletonGrid,
  DashboardCountListCard,
  DashboardEmpty,
  DashboardSectionCard,
  formatShortDate,
  formatTime,
} from "@/components/dashboard";
import { cn } from "@/lib/utils";
import type {
  HrComplianceAlerts,
  HrDocumentsExpiring,
  HrRecentActivity,
  HrUpcomingEvent,
} from "@/types/hrDashboard";
import {
  AlertTriangle,
  FileBadge,
  FileText,
  IdCard,
  Plane,
  ScrollText,
  Timer,
} from "lucide-react";

export function HrDashboardLists({
  compliance,
  documents,
  upcomingEvents,
  recentActivities,
  loading,
}: {
  compliance: HrComplianceAlerts | null;
  documents: HrDocumentsExpiring | null;
  upcomingEvents: HrUpcomingEvent[];
  recentActivities: HrRecentActivity[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <DashboardCardSkeletonGrid
        count={4}
        className="md:grid-cols-2 xl:grid-cols-4"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardCountListCard
        title="Compliance Alerts"
        description="Expiring within 30 days"
        emptyMessage="No compliance alerts."
        items={[
          {
            key: "qid",
            label: "QID Expiring",
            count: compliance?.qidExpiring30d ?? 0,
            icon: IdCard,
            color: "bg-orange-100 text-orange-700",
          },
          {
            key: "passport",
            label: "Passport Expiring",
            count: compliance?.passportExpiring30d ?? 0,
            icon: Plane,
            color: "bg-violet-100 text-violet-700",
          },
          {
            key: "vaccination",
            label: "Vaccination Expiring",
            count: compliance?.vaccinationExpiring30d ?? 0,
            icon: AlertTriangle,
            color: "bg-amber-100 text-amber-800",
          },
          {
            key: "contracts",
            label: "Contracts Expiring",
            count: compliance?.contractsExpiring30d ?? 0,
            icon: ScrollText,
            color: "bg-rose-100 text-rose-700",
          },
          {
            key: "probation",
            label: "Probation Ending",
            count: compliance?.probationEndingSoon ?? 0,
            icon: Timer,
            color: "bg-sky-100 text-sky-700",
          },
        ]}
      />

      <DashboardCountListCard
        title="Documents Expiring"
        description="Document renewals due"
        emptyMessage="No documents expiring."
        items={[
          {
            key: "qid-doc",
            label: "QID",
            count: documents?.qidExpiring ?? 0,
            icon: IdCard,
            color: "bg-orange-100 text-orange-700",
          },
          {
            key: "passport-doc",
            label: "Passport",
            count: documents?.passportExpiring ?? 0,
            icon: Plane,
            color: "bg-violet-100 text-violet-700",
          },
          {
            key: "visa-doc",
            label: "Visa",
            count: documents?.visaExpiring ?? 0,
            icon: FileBadge,
            color: "bg-blue-100 text-blue-700",
          },
          {
            key: "contract-doc",
            label: "Contracts",
            count: documents?.contractsExpiring ?? 0,
            icon: ScrollText,
            color: "bg-rose-100 text-rose-700",
          },
          {
            key: "other-doc",
            label: "Other Documents",
            count: documents?.otherDocsExpiring ?? 0,
            icon: FileText,
            color: "bg-slate-100 text-slate-700",
          },
        ]}
      />

      <DashboardSectionCard
        title="Upcoming HR Events"
        description="Soonest first"
      >
        {upcomingEvents.length === 0 ? (
          <DashboardEmpty message="No upcoming events." />
        ) : (
          <div className="space-y-2">
            {upcomingEvents.slice(0, 8).map((event, idx) => (
              <div
                key={`${event.employeeId}-${event.type}-${event.eventDate}-${idx}`}
                className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {event.employeeName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {event.type}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatShortDate(event.eventDate)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    event.daysLeft <= 7
                      ? "bg-red-100 text-red-700"
                      : event.daysLeft <= 30
                        ? "bg-amber-100 text-amber-800"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {event.daysLeft}d
                </span>
              </div>
            ))}
          </div>
        )}
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Recent HR Activities"
        description="Latest updates"
      >
        {recentActivities.length === 0 ? (
          <DashboardEmpty message="No recent activity." />
        ) : (
          <div className="space-y-2">
            {recentActivities.slice(0, 8).map((activity, idx) => (
              <div
                key={`${activity.occurredAt}-${idx}`}
                className="rounded-lg border px-3 py-2.5"
              >
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
            ))}
          </div>
        )}
      </DashboardSectionCard>
    </div>
  );
}
