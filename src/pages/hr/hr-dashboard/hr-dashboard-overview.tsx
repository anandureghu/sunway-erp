import {
  DashboardCardSkeletonGrid,
  DashboardCountListCard,
  DashboardDonutCard,
} from "@/components/dashboard";
import type {
  HrLeaveSummaryThisMonth,
  HrPendingApprovals,
  HrWorkforceStatusToday,
} from "@/types/hrDashboard";
import {
  CalendarDays,
  ClipboardList,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";

export function HrDashboardOverview({
  workforce,
  leaveSummary,
  pendingApprovals,
  loading,
}: {
  workforce: HrWorkforceStatusToday | null;
  leaveSummary: HrLeaveSummaryThisMonth | null;
  pendingApprovals: HrPendingApprovals | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <DashboardCardSkeletonGrid
        count={3}
        className="md:grid-cols-2 xl:grid-cols-3"
        cardClassName="h-[320px] rounded-xl"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <DashboardDonutCard
        title="Workforce Status Today"
        description="Attendance snapshot"
        slices={[
          {
            name: "Present",
            value: workforce?.present ?? 0,
            fill: "#22c55e",
          },
          {
            name: "On Leave",
            value: workforce?.onLeave ?? 0,
            fill: "#eab308",
          },
          {
            name: "Absent",
            value: workforce?.absent ?? 0,
            fill: "#ef4444",
          },
        ]}
        centerLabel="Total"
        centerValue={workforce?.total ?? 0}
        emptyMessage="No attendance data for today."
        size="sm"
      />

      <DashboardDonutCard
        title="Leave Summary (This Month)"
        description="Request outcomes"
        slices={[
          {
            name: "Approved",
            value: leaveSummary?.approved ?? 0,
            fill: "#22c55e",
          },
          {
            name: "Pending",
            value: leaveSummary?.pending ?? 0,
            fill: "#f59e0b",
          },
          {
            name: "Rejected",
            value: leaveSummary?.rejected ?? 0,
            fill: "#ef4444",
          },
        ]}
        centerLabel="Requests"
        centerValue={leaveSummary?.totalRequests ?? 0}
        emptyMessage="No leave requests this month."
        size="sm"
      />

      <DashboardCountListCard
        title="Pending Approvals"
        description="Items waiting for action"
        emptyMessage="Nothing pending."
        items={[
          {
            key: "leave",
            label: "Leave Requests",
            count: pendingApprovals?.leaveRequests ?? 0,
            icon: CalendarDays,
            color: "bg-amber-100 text-amber-800",
          },
          {
            key: "overtime",
            label: "Overtime Requests",
            count: pendingApprovals?.overtimeRequests ?? 0,
            icon: ClipboardList,
            color: "bg-violet-100 text-violet-700",
          },
          {
            key: "transfers",
            label: "Employee Transfers",
            count: pendingApprovals?.employeeTransfers ?? 0,
            icon: Users,
            color: "bg-sky-100 text-sky-700",
          },
          {
            key: "registrations",
            label: "Employee Registrations",
            count: pendingApprovals?.employeeRegistrations ?? 0,
            icon: UserPlus,
            color: "bg-emerald-100 text-emerald-700",
          },
          {
            key: "contracts",
            label: "Contract Renewals",
            count: pendingApprovals?.contractRenewals ?? 0,
            icon: RefreshCw,
            color: "bg-orange-100 text-orange-700",
          },
        ]}
      />
    </div>
  );
}
