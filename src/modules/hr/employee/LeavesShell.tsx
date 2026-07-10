import { NavLink, Outlet, useParams, useSearchParams, useLocation, Link } from "react-router-dom";
import { CalendarDays, BarChart2, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { hrService } from "@/service/hr.service";
import EditUpdateButton from "@/components/EditUpdateButton";
import type { Employee } from "@/types/hr";
import {
  useShellFormBridge,
  type ShellFormHandlers,
} from "@/modules/hr/hooks/use-shell-form-bridge";

export interface LeavesCtx {
  editing: boolean;
  setEditing: (val: boolean) => void;
  registerHandlers: (handlers: ShellFormHandlers | null) => void;
}

export default function LeavesShell() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [sp, setSp] = useSearchParams();
  const { registerHandlers, runBeginEdit, runSave, runCancel } = useShellFormBridge();

  const [emp, setEmp] = useState<Employee | null>(null);
  const employeeTitle = emp
    ? `${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : id ?? "";

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => { mounted = false; };
  }, [id]);

  const editing = sp.get("edit") === "1";

  const setEditing = useCallback(
    (val: boolean) => {
      setSp((prev) => {
        const next = new URLSearchParams(prev);
        if (val) next.set("edit", "1");
        else next.delete("edit");
        return next;
      }, { replace: true });
    },
    [setSp],
  );

  const isHistoryTab   = location.pathname.endsWith("/history");
  const isTimesheetTab = location.pathname.endsWith("/timesheet");

  const handleSave = useCallback(async () => {
    const ok = await runSave();
    if (ok) setEditing(false);
  }, [runSave, setEditing]);

  const handleCancel = useCallback(() => {
    runCancel();
    setEditing(false);
  }, [runCancel, setEditing]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg" asChild>
            <Link to="/hr/employees" aria-label="Back to employees"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <CalendarDays className="w-5 h-5" />
          <span className="text-lg font-semibold">Employee Leaves – {employeeTitle}</span>
        </div>
      </div>

      {/* Tabs + Action row */}
      <div className="px-4 pt-3 flex justify-between items-center border-b bg-white" role="navigation" aria-label="Leaves sections">
        <div className="flex gap-2">
          <Tab to="." icon={<CalendarDays className="h-4 w-4" />}>
            Employee Leaves
          </Tab>
          <Tab to="history" icon={<BarChart2 className="h-4 w-4" />}>
            Leave History
          </Tab>
          <Tab to="timesheet" icon={<Clock className="h-4 w-4" />}>
            Time Sheet
          </Tab>
        </div>
        {!isHistoryTab && !isTimesheetTab && (
          <EditUpdateButton
            module="LEAVES"
            label="Request Leave"
            editing={editing}
            onEdit={() => {
              runBeginEdit();
              setEditing(true);
            }}
            onCancel={handleCancel}
            onSave={() => { void handleSave(); }}
          />
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <Outlet
          context={{ editing, setEditing, registerHandlers } satisfies LeavesCtx}
        />
      </div>
    </div>
  );
}

function Tab({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <NavLink
      end
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 ease-in-out",
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
            : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-sm",
        ].join(" ")
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
