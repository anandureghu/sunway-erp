import { NavLink, Outlet, useParams, useSearchParams, Link } from "react-router-dom";
import { BriefcaseBusiness, GraduationCap, Hourglass, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { hrService } from "@/service/hr.service";
import EditUpdateButton from "@/components/EditUpdateButton";
import type { Employee } from "@/types/hr";
import {
  useShellFormBridge,
  type ShellFormHandlers,
} from "@/modules/hr/hooks/use-shell-form-bridge";

export interface CurrentJobShellCtx {
  editing: boolean;
  setEditing: (val: boolean) => void;
  registerHandlers: (handlers: ShellFormHandlers | null) => void;
}

export default function CurrentJobShell() {
  const { id } = useParams<{ id: string }>();
  const [emp, setEmp] = useState<Employee | null>(null);
  const employeeTitle = emp
    ? `${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : id;

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => { mounted = false; };
  }, [id]);

  const [sp, setSp] = useSearchParams();
  const { registerHandlers, runBeginEdit, runSave, runCancel } = useShellFormBridge();
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

  const handleEdit = useCallback(() => {
    runBeginEdit();
    setEditing(true);
  }, [runBeginEdit, setEditing]);

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
          <BriefcaseBusiness className="w-5 h-5" />
          <span className="text-lg font-semibold">Current Job Info – {employeeTitle}</span>
        </div>
      </div>

      {/* Tabs + Edit button */}
      <div className="px-4 pt-3 flex justify-between items-center border-b bg-white">
        <div className="flex gap-2">
          <TabLink to="" end icon={<BriefcaseBusiness className="w-4 h-4" />}>Current Job</TabLink>
          <TabLink to="contract"              icon={<FileText       className="w-4 h-4" />}>Employee Contract</TabLink>
          <TabLink to="previous-experiences"  icon={<Hourglass      className="w-4 h-4" />}>Previous Experiences</TabLink>
          <TabLink to="education"             icon={<GraduationCap  className="w-4 h-4" />}>Education and Qualifications</TabLink>
        </div>

        <EditUpdateButton
          module="CURRENT_JOB"
          editing={editing}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSave={() => { void handleSave(); }}
        />
      </div>

      <div className="p-4">
        <Outlet
          context={{ editing, setEditing, registerHandlers } satisfies CurrentJobShellCtx}
        />
      </div>
    </div>
  );
}

function TabLink({ to, end, icon, children }: { to: string; end?: boolean; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
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
