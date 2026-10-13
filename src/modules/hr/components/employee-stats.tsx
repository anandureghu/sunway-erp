import { useMemo } from "react";

import {
  UsersRound,
  UserCheck,
  CalendarClock,
  UserCog,
} from "lucide-react";
import type { Employee } from "@/types/hr";

const normalize = (s?: string | null) =>
  String(s ?? "").trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");

import { KpiSummaryStrip } from "@/components/kpi-summary-strip";

interface EmployeeStatsProps {
  employees: Employee[];
  /** Server-side total when the table is paginated (overrides `employees.length`). */
  totalOverride?: number;
  onFilter?: (status: string | null) => void;
  activeFilter?: string | null;
}

export function EmployeeStats({
  employees,
  totalOverride,
  onFilter,
  activeFilter,
}: EmployeeStatsProps) {
  const stats = useMemo(() => {
    const total = totalOverride ?? employees.length;
    const active = employees.filter((e) => normalize(e.status) === "ACTIVE").length;
    const probation = employees.filter(
      (e) => normalize(e.status) === "UNDER_PROBATION",
    ).length;
    const onLeave = employees.filter(
      (e) => normalize(e.status) === "ON_LEAVE",
    ).length;
    return { total, active, probation, onLeave };
  }, [employees, totalOverride]);

  const activeKey = normalize(activeFilter);

  return (
    <div className="mb-6">
      <KpiSummaryStrip
        items={[
          {
            label: "Total Employees",
            value: stats.total,
            hint: "All employees",
            accent: "blue",
            icon: UsersRound,
            onClick: () => onFilter?.(null),
            active: activeFilter == null || activeFilter === "",
          },
          {
            label: "Active",
            value: stats.active,
            hint:
              stats.total > 0
                ? `${Math.round((stats.active / stats.total) * 100)}% of workforce`
                : "0% of workforce",
            accent: "emerald",
            icon: UserCheck,
            onClick: () => onFilter?.("ACTIVE"),
            active: activeKey === "ACTIVE",
          },
          {
            label: "Under Probation",
            value: stats.probation,
            hint:
              stats.total > 0
                ? `${Math.round((stats.probation / stats.total) * 100)}% of workforce`
                : "0% of workforce",
            accent: "violet",
            icon: UserCog,
            onClick: () => onFilter?.("UNDER_PROBATION"),
            active: activeKey === "UNDER_PROBATION",
          },
          {
            label: "On Leave",
            value: stats.onLeave,
            hint:
              stats.total > 0
                ? `${Math.round((stats.onLeave / stats.total) * 100)}% of workforce`
                : "0% of workforce",
            accent: "amber",
            icon: CalendarClock,
            onClick: () => onFilter?.("ON_LEAVE"),
            active: activeKey === "ON_LEAVE",
          },
        ]}
      />
    </div>
  );
}
