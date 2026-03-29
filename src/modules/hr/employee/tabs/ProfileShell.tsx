import { NavLink, Outlet, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useCallback, useEffect } from "react";
import { IdCard, Contact } from "lucide-react";
import EditUpdateButton from "@/components/EditUpdateButton";
import { hrService } from "@/service/hr.service";
import type { ReactElement } from "react";
import type { Employee } from "@/types/hr";

export interface ProfileCtx {
  editing: boolean;
  setEditing?: (v: boolean) => void;
  isAdmin?: boolean;
}

export default function ProfileShell(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [emp, setEmp] = useState<Employee | null>(null);

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => { if (mounted) setEmp(e ?? null); });
    return () => { mounted = false; };
  }, [id]);

  const title = emp
    ? `Employee Profile – ${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : "Employee Profile";

  const [editing, setEditing] = useState(false);

  const fire = useCallback((name: string) => {
    document.dispatchEvent(new Event(name));
  }, []);

  const startEdit = useCallback(() => { setEditing(true);  fire("profile:edit");   }, [fire]);
  const save      = useCallback(() => { fire("profile:save");   setEditing(false); }, [fire]);
  const cancel    = useCallback(() => { fire("profile:cancel"); setEditing(false); }, [fire]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden" role="region" aria-label="Employee profile section">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg text-lg font-semibold">
        <div className="text-lg font-semibold" role="heading" aria-level={1}>{title}</div>
      </div>

      {/* Tabs + Edit button */}
      <div className="px-4 pt-3 flex justify-between items-center border-b bg-white" role="navigation" aria-label="Profile sections">
        <div className="flex gap-2">
          <Tab to=""        icon={<IdCard   className="h-4 w-4" />} label="Employee Profile" />
          <Tab to="contact" icon={<Contact  className="h-4 w-4" />} label="Contact Info"     />
        </div>

        <EditUpdateButton
          module="EMPLOYEE_PROFILE"
          editing={editing}
          onEdit={startEdit}
          onSave={save}
          onCancel={cancel}
        />
      </div>

      {/* Active tab content */}
      <div className="p-4" role="tabpanel">
      <Outlet context={{ editing, setEditing, isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' } satisfies ProfileCtx & {isAdmin: boolean}} />
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