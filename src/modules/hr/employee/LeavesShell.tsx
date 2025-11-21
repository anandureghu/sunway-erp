// src/modules/hr/leaves/LeavesShell.tsx
import { NavLink, Outlet, useParams, useSearchParams } from "react-router-dom";
import { CalendarDays, BarChart2 } from "lucide-react";
import { EMPLOYEES } from "@/pages/employees.mock";
import EditUpdateButton from "@/components/EditUpdateButton";

export default function LeavesShell() {
  const { id } = useParams<{ id: string }>();
  const [sp, setSp] = useSearchParams();

  const emp = EMPLOYEES.find((e) => e.id === id);
  const employeeTitle = emp
    ? `${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : id ?? "";

  const editing = sp.get("edit") === "1";

  const setEditing = (val: boolean) => {
    const next = new URLSearchParams(sp);
    if (val) next.set("edit", "1");
    else next.delete("edit");
    setSp(next, { replace: true });
  };

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Blue title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          <span className="font-semibold">Employee Leaves – {employeeTitle}</span>
        </div>
      </div>

      {/* Action row BELOW header + Tabs */}
      <div className="px-4 pt-3 flex justify-between items-center">
        <div className="flex gap-2">
          <Tab to="." icon={<CalendarDays className="h-4 w-4" />}>
            Employee Leaves
          </Tab>
          <Tab to="history" icon={<BarChart2 className="h-4 w-4" />}>
            Employee Leave History
          </Tab>
        </div>
        <EditUpdateButton
          editing={editing}
          onEdit={() => setEditing(true)}
          onCancel={() => setEditing(false)}
          onSave={() => setEditing(false)}
        />
      </div>

      {/* Body */}
      <div className="p-4">
        <Outlet context={{ editing, setEditing }} />
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
