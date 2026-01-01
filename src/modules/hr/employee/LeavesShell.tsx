import { NavLink, Outlet, useParams, useSearchParams } from "react-router-dom";
import { CalendarDays, BarChart2 } from "lucide-react";
import { useState, useEffect } from "react";
import { hrService } from "@/service/hr.service";
import EditUpdateButton from "@/components/EditUpdateButton";
import type { Employee } from "@/types/hr";

export default function LeavesShell() {
  const { id } = useParams<{ id: string }>();
  const [sp, setSp] = useSearchParams();

  const [emp, setEmp] = useState<Employee | null>(null);
  const employeeTitle = emp
    ? `${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : id ?? "";

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => {
      mounted = false;
    };
  }, [id]);

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

      {/* Tabs + Action row (tabs left, edit controls right) */}
      <div className="px-4 pt-3 flex justify-between items-center border-b bg-white" role="navigation" aria-label="Leaves sections">
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
          "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm",
          isActive ? "bg-blue-600 text-white" : "text-black hover:bg-gray-100",
        ].join(" ")
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
