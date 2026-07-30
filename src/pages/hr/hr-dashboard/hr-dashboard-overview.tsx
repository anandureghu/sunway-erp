import {
  DashboardCardSkeletonGrid,
  DashboardCountListCard,
  DashboardDonutCard,
} from "@/components/dashboard";
import type {
  HrDocumentsExpiring,
  HrPendingApprovals,
  HrWorkforceStatusToday,
} from "@/types/hrDashboard";
import {
  CalendarDays,
  ClipboardList,
  FileBadge,
  FileText,
  IdCard,
  Plane,
  RefreshCw,
  ScrollText,
  UserPlus,
  Users,
} from "lucide-react";

export function HrDashboardOverview({
  workforce,
  pendingApprovals,
  documents,
  loading,
}: {
  workforce: HrWorkforceStatusToday | null;
  pendingApprovals: HrPendingApprovals | null;
  documents: HrDocumentsExpiring | null;
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
            to: "/hr/settings?tab=leave-approvals",
          },
          {
            key: "overtime",
            label: "Overtime Requests",
            count: pendingApprovals?.overtimeRequests ?? 0,
            icon: ClipboardList,
            color: "bg-violet-100 text-violet-700",
            to: "/hr/settings?tab=leave-approvals",
          },
          {
            key: "transfers",
            label: "Employee Transfers",
            count: pendingApprovals?.employeeTransfers ?? 0,
            icon: Users,
            color: "bg-sky-100 text-sky-700",
            to: "/hr/employees",
          },
          {
            key: "registrations",
            label: "Employee Registrations",
            count: pendingApprovals?.employeeRegistrations ?? 0,
            icon: UserPlus,
            color: "bg-emerald-100 text-emerald-700",
            to: "/hr/employees",
          },
          {
            key: "contracts",
            label: "Contract Renewals",
            count: pendingApprovals?.contractRenewals ?? 0,
            icon: RefreshCw,
            color: "bg-orange-100 text-orange-700",
            to: "/hr/employees",
          },
        ]}
      />

      <DashboardCountListCard
        title="Expiring Documents"
        description="Document renewals due"
        emptyMessage="No documents expiring."
        items={[
          {
            key: "qid-doc",
            label: "QID",
            count: documents?.qidExpiring ?? 0,
            icon: IdCard,
            color: "bg-orange-100 text-orange-700",
            to: "/hr/reports?tab=immigration",
          },
          {
            key: "passport-doc",
            label: "Passport",
            count: documents?.passportExpiring ?? 0,
            icon: Plane,
            color: "bg-violet-100 text-violet-700",
            to: "/hr/reports?tab=immigration",
          },
          {
            key: "visa-doc",
            label: "Visa",
            count: documents?.visaExpiring ?? 0,
            icon: FileBadge,
            color: "bg-blue-100 text-blue-700",
            to: "/hr/reports?tab=immigration",
          },
          {
            key: "contract-doc",
            label: "Contracts",
            count: documents?.contractsExpiring ?? 0,
            icon: ScrollText,
            color: "bg-rose-100 text-rose-700",
            to: "/hr/employees",
          },
          {
            key: "other-doc",
            label: "Other Documents",
            count: documents?.otherDocsExpiring ?? 0,
            icon: FileText,
            color: "bg-slate-100 text-slate-700",
            to: "/hr/reports?tab=immigration",
          },
        ]}
      />
    </div>
  );
}
