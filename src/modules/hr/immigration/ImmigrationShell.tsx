import { NavLink, Outlet, useParams, Link } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { Contact2, Landmark, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hrService } from "@/service/hr.service";
import EditUpdateButton from "@/components/EditUpdateButton";
import type { ReactElement } from "react";
import type { Employee } from "@/types/hr";

export interface ImmigrationCtx {
  editing: boolean;
}

type ImmigrationEvent = "immigration:edit" | "immigration:save" | "immigration:cancel";

export default function ImmigrationShell(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const [emp, setEmp] = useState<Employee | null>(null);

  const title = emp
    ? `Immigration Services - ${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : "Immigration Services";

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => { mounted = false; };
  }, [id]);

  const [editing, setEditing] = useState(false);

  const fire = useCallback((name: ImmigrationEvent) => {
    try { document.dispatchEvent(new CustomEvent(name)); } catch { document.dispatchEvent(new Event(name)); }
  }, []);

  const startEdit  = useCallback(() => { setEditing(true);  fire("immigration:edit");   }, [fire]);
  const save       = useCallback(() => { fire("immigration:save");   setEditing(false); }, [fire]);
  const cancel     = useCallback(() => { fire("immigration:cancel"); setEditing(false); }, [fire]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden" role="region" aria-label="Immigration information section">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg" asChild>
            <Link to="/hr/employees" aria-label="Back to employees"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <span className="text-lg font-semibold" role="heading" aria-level={1}>{title}</span>
        </div>
      </div>

      {/* Tabs + Edit button */}
      <div className="px-4 pt-3 flex justify-between items-center border-b bg-white" role="navigation" aria-label="Immigration sections">
        <div className="flex gap-2">
          <Tab to=""                 icon={<Contact2 className="h-4 w-4" />} label="Passport"         />
          <Tab to="residence-permit" icon={<Landmark className="h-4 w-4" />} label="Residence Permit" />
        </div>

        <EditUpdateButton
          module="IMMIGRATION"
          editing={editing}
          onEdit={startEdit}
          onSave={save}
          onCancel={cancel}
        />
      </div>

      {/* Tab content */}
      <div className="p-4" role="tabpanel">
        <Outlet context={{ editing } satisfies ImmigrationCtx} />
      </div>
    </div>
  );
}

function Tab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }): ReactElement {
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
      role="tab"
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}