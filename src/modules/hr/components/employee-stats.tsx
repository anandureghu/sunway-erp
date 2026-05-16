import { useMemo } from "react";

import { UsersRound, UserCheck, CalendarClock, UserX } from "lucide-react";
import type { Employee } from "@/types/hr";

const normalize = (s?: string | null) =>
  String(s ?? "").trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");

import { KpiSummaryStrip } from "@/components/kpi-summary-strip";

interface EmployeeStatsProps {
  employees: Employee[];
  onFilter?: (status: string | null) => void;
  activeFilter?: string | null;
}

export function EmployeeStats({
  employees,
  onFilter,
  activeFilter,
}: EmployeeStatsProps) {
  const stats = useMemo(() => {
    const total    = employees.length;
    const active   = employees.filter((e) => normalize(e.status) === "ACTIVE").length;
    const onLeave  = employees.filter((e) => normalize(e.status) === "ON_LEAVE").length;
    const inactive = employees.filter((e) => normalize(e.status) === "INACTIVE").length;
    return { total, active, onLeave, inactive };
  }, [employees]);

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
            active: activeFilter === null,
          },
          {
            label: "Active",
            value: stats.active,
            hint: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% of workforce` : "0% of workforce",
            accent: "emerald",
            icon: UserCheck,
            onClick: () => onFilter?.("ACTIVE"),
            active: activeFilter === "ACTIVE",
          },
          {
            label: "On Leave",
            value: stats.onLeave,
            hint: stats.total > 0 ? `${Math.round((stats.onLeave / stats.total) * 100)}% of workforce` : "0% of workforce",
            accent: "amber",
            icon: CalendarClock,
            onClick: () => onFilter?.("ON_LEAVE"),
            active: activeFilter === "ON_LEAVE",
          },
          {
            label: "Inactive",
            value: stats.inactive,
            hint: stats.total > 0 ? `${Math.round((stats.inactive / stats.total) * 100)}% of workforce` : "0% of workforce",
            accent: "rose",
            icon: UserX,
            onClick: () => onFilter?.("INACTIVE"),
            active: activeFilter === "INACTIVE",
          },
        ]}
      />
    </div>
  );
}
