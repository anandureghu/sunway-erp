import { Card, CardContent } from "@/components/ui/card";
import { UsersRound, UserCheck, UserCog2, UserRoundCog } from "lucide-react";
import type { Employee } from "@/types/hr";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const StatCard = ({ label, value, icon, className = "", onClick }: StatCardProps) => (
  <Card className={className}>
    <CardContent className="pt-4">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left"
        aria-label={`Filter by ${label}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <h2 className="text-2xl font-bold">{value}</h2>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </button>
    </CardContent>
  </Card>
);

interface EmployeeStatsProps {
  employees: Employee[];
}

export function EmployeeStats({ employees, onFilter }: EmployeeStatsProps & { onFilter?: (status: string | null) => void }) {
  const normalize = (s?: string | null) =>
    String(s ?? "").trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");

  const stats = {
    total: employees.length,
    active: employees.filter((e) => normalize(e.status) === "ACTIVE").length,
    onLeave: employees.filter((e) => normalize(e.status) === "ON_LEAVE").length,
    inactive: employees.filter((e) => normalize(e.status) === "INACTIVE").length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <StatCard
        label="Total Employees"
        value={stats.total}
        icon={<UsersRound size={24} />}
        className="border-blue-200 bg-blue-50"
        onClick={() => onFilter && onFilter(null)}
      />
      <StatCard
        label="Active Employees"
        value={stats.active}
        icon={<UserCheck size={24} />}
        className="border-green-200 bg-green-50"
        onClick={() => onFilter && onFilter("ACTIVE")}
      />
      <StatCard
        label="On Leave"
        value={stats.onLeave}
        icon={<UserCog2 size={24} />}
        className="border-amber-200 bg-amber-50"
        onClick={() => onFilter && onFilter("ON_LEAVE")}
      />
      <StatCard
        label="Inactive"
        value={stats.inactive}
        icon={<UserRoundCog size={24} />}
        className="border-red-200 bg-red-50"
        onClick={() => onFilter && onFilter("INACTIVE")}
      />
    </div>
  );
}
