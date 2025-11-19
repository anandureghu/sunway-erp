// src/modules/hr/leaves/LeavesShell.tsx
import { NavLink, Outlet, useParams } from "react-router-dom";
import { CalendarDays, BarChart2 } from "lucide-react";
import { EMPLOYEES } from "@/pages/employees.mock";

export default function LeavesShell() {
  const { id } = useParams<{ id: string }>();
  const emp = EMPLOYEES.find((e) => e.id === id);
  const title =
    emp ? `Employee Leaves – ${emp.firstName} ${emp.lastName} (${emp.employeeNo})` : "Employee Leaves";

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Blue title bar (NO edit button here) */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-xl font-semibold">
        {title}
      </div>

      {/* Tabs under the title */}
      <div className="px-4 py-2 flex gap-2">
        <Tab to="." icon={<CalendarDays className="h-4 w-4" />}>
          Employee Leaves
        </Tab>
        <Tab to="history" icon={<BarChart2 className="h-4 w-4" />}>
          Employee Leave History
        </Tab>
      </div>

      {/* Body */}
      <div className="p-4">
        <Outlet />
      </div>
    </div>
  );
}

function Tab({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      end
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
          isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800",
        ].join(" ")
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
