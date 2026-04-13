import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UsersRound, UserCheck, CalendarClock, UserX } from "lucide-react";
import type { Employee } from "@/types/hr";
import { cn } from "@/lib/utils";

const normalize = (s?: string | null) =>
  String(s ?? "").trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");

interface StatCardProps {
  label: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  iconBg: string;
  barColor: string;
  borderColor: string;
  onClick?: () => void;
  active?: boolean;
  isTotal?: boolean;
}

const StatCard = ({
  label,
  value,
  total,
  icon,
  iconBg,
  barColor,
  borderColor,
  onClick,
  active,
  isTotal,
}: StatCardProps) => {
  const pct = total > 0 && !isTotal ? Math.round((value / total) * 100) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      aria-label={`Filter by ${label}`}
    >
      <Card
        className={cn(
          "transition-all duration-200 cursor-pointer select-none border-l-4 hover:shadow-md hover:-translate-y-0.5",
          borderColor,
          active && "ring-2 ring-primary/40 shadow-md",
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                {label}
              </p>
              <h2 className="mt-1.5 text-3xl font-bold leading-none tabular-nums">
                {value}
              </h2>
              {pct !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {pct}% of workforce
                </p>
              )}
              {isTotal && (
                <p className="mt-1 text-xs text-muted-foreground">
                  All employees
                </p>
              )}
            </div>

            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                iconBg,
              )}
            >
              {icon}
            </div>
          </div>

          {/* Progress bar */}
          {pct !== null && (
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  barColor,
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </button>
  );
};

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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Employees"
        value={stats.total}
        total={stats.total}
        isTotal
        icon={<UsersRound className="h-5 w-5 text-blue-600" />}
        iconBg="bg-blue-100"
        barColor="bg-blue-500"
        borderColor="border-l-blue-500"
        onClick={() => onFilter?.(null)}
        active={activeFilter === null}
      />
      <StatCard
        label="Active"
        value={stats.active}
        total={stats.total}
        icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
        iconBg="bg-emerald-100"
        barColor="bg-emerald-500"
        borderColor="border-l-emerald-500"
        onClick={() => onFilter?.("ACTIVE")}
        active={activeFilter === "ACTIVE"}
      />
      <StatCard
        label="On Leave"
        value={stats.onLeave}
        total={stats.total}
        icon={<CalendarClock className="h-5 w-5 text-amber-600" />}
        iconBg="bg-amber-100"
        barColor="bg-amber-500"
        borderColor="border-l-amber-500"
        onClick={() => onFilter?.("ON_LEAVE")}
        active={activeFilter === "ON_LEAVE"}
      />
      <StatCard
        label="Inactive"
        value={stats.inactive}
        total={stats.total}
        icon={<UserX className="h-5 w-5 text-rose-600" />}
        iconBg="bg-rose-100"
        barColor="bg-rose-500"
        borderColor="border-l-rose-500"
        onClick={() => onFilter?.("INACTIVE")}
        active={activeFilter === "INACTIVE"}
      />
    </div>
  );
}
