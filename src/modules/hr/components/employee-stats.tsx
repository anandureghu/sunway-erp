import { Card, CardContent } from "@/components/ui/card";
import { UsersRound, UserCheck, UserCog2, UserRoundCog } from "lucide-react";
import type { Employee } from "@/types/hr";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}

const StatCard = ({ label, value, icon, className = "" }: StatCardProps) => (
  <Card className={className}>
    <CardContent className="pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h2 className="text-2xl font-bold">{value}</h2>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

interface EmployeeStatsProps {
  employees: Employee[];
}

export function EmployeeStats({ employees }: EmployeeStatsProps) {
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status.toLowerCase() === "active").length,
    onLeave: employees.filter(e => e.status.toLowerCase() === "on leave").length,
    inactive: employees.filter(e => e.status.toLowerCase() === "inactive").length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <StatCard 
        label="Total Employees" 
        value={stats.total}
        icon={<UsersRound size={24} />} 
      />
      <StatCard 
        label="Active Employees" 
        value={stats.active}
        icon={<UserCheck size={24} />} 
        className="border-green-200"
      />
      <StatCard 
        label="On Leave" 
        value={stats.onLeave}
        icon={<UserCog2 size={24} />} 
        className="border-amber-200"
      />
      <StatCard 
        label="Inactive" 
        value={stats.inactive}
        icon={<UserRoundCog size={24} />} 
        className="border-red-200"
      />
    </div>
  );
}