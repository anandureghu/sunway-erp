import { DashboardKpiSkeleton } from "@/components/dashboard";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import type { HrDashboardKpis } from "@/types/hrDashboard";
import {
  AlertTriangle,
  CalendarOff,
  FileWarning,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Timer,
} from "lucide-react";

export function HrDashboardKpisPanel({
  kpis,
  loading,
}: {
  kpis: HrDashboardKpis | null;
  loading: boolean;
}) {
  if (loading || !kpis) {
    return <DashboardKpiSkeleton count={8} />;
  }

  const n = (v: number) => (Number.isFinite(v) ? v.toLocaleString() : "0");

  return (
    <KpiSummaryStrip
      className="sm:grid-cols-2 xl:grid-cols-4"
      items={[
        {
          label: "Total Employees",
          value: n(kpis.totalEmployees),
          hint: "All employees",
          accent: "violet",
          icon: Users,
        },
        {
          label: "Active Employees",
          value: n(kpis.activeEmployees),
          hint: "Currently employed",
          accent: "emerald",
          icon: UserCheck,
        },
        {
          label: "On Leave Today",
          value: n(kpis.employeesOnLeave),
          hint: "Approved leave",
          accent: "amber",
          icon: CalendarOff,
        },
        {
          label: "New Joiners",
          value: n(kpis.newJoinersThisMonth),
          hint: "This month",
          accent: "sky",
          icon: UserPlus,
        },
        {
          label: "Resignations",
          value: n(kpis.resignationsThisMonth),
          hint: "This month",
          accent: "rose",
          icon: UserMinus,
        },
        {
          label: "QID Expiring (30d)",
          value: n(kpis.qidExpiring30d),
          hint: "Needs renewal",
          accent: kpis.qidExpiring30d > 0 ? "orange" : "slate",
          icon: FileWarning,
        },
        {
          label: "Contracts Expiring (30d)",
          value: n(kpis.contractsExpiring30d),
          hint: "Needs renewal",
          accent: kpis.contractsExpiring30d > 0 ? "orange" : "slate",
          icon: AlertTriangle,
        },
        {
          label: "Probation Ending Soon",
          value: n(kpis.probationEndingSoon),
          hint: "Review required",
          accent: kpis.probationEndingSoon > 0 ? "amber" : "slate",
          icon: Timer,
        },
      ]}
    />
  );
}
