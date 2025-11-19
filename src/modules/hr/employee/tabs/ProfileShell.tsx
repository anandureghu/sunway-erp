// modules/hr/employee/tabs/ProfileShell.tsx
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";
import { IdCard, Contact } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMPLOYEES } from "@/pages/employees.mock"; // used as fallback seed
import type { ReactElement } from "react";

interface EditUpdateBarProps {
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

function EditUpdateBar({
  editing,
  onEdit,
  onCancel,
  onSave,
}: EditUpdateBarProps): ReactElement {
  return !editing ? (
    <Button
      variant="outline"
      className="rounded-full shadow-sm bg-white hover:shadow gap-2"
      onClick={onEdit}
      aria-label="Edit profile information"
    >
      <span className="text-[16px]" aria-hidden="true">✏️</span> Edit/Update
    </Button>
  ) : (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={onCancel}
        aria-label="Cancel editing profile"
      >
        Cancel
      </Button>
      <Button 
        onClick={onSave} 
        className="bg-emerald-600 hover:bg-emerald-700"
        aria-label="Save profile changes"
      >
        Save
      </Button>
    </div>
  );
}

export interface ProfileCtx {
  editing: boolean;
}

export default function ProfileShell(): ReactElement {
  const { id } = useParams<{ id: string }>();

  const emp = useMemo(() => {
    // read from localStorage first so edits persist across pages
    const stored = localStorage.getItem("employees");
    const list = stored ? JSON.parse(stored) : EMPLOYEES;
    return list.find((e: any) => e.id === id);
  }, [id]);

  const title = emp
    ? `Employee Profile – ${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : "Employee Profile";

  const [editing, setEditing] = useState(false);

  // Event dispatcher for form state management
  const fire = useCallback((name: string) => {
    document.dispatchEvent(new Event(name));
  }, []);

  const startEdit = useCallback(() => {
    setEditing(true);
    fire("profile:edit");
  }, [fire]);

  const save = useCallback(() => {
    fire("profile:save");
    setEditing(false);
  }, [fire]);

  const cancel = useCallback(() => {
    fire("profile:cancel");
    setEditing(false);
  }, [fire]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden" role="region" aria-label="Employee profile section">
      {/* Blue title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div className="text-lg font-semibold" role="heading" aria-level={1}>{title}</div>
      </div>

      {/* Action bar under header */}
      <div className="px-4 pt-3 flex justify-end">
        <EditUpdateBar
          editing={editing}
          onEdit={startEdit}
          onSave={save}
          onCancel={cancel}
        />
      </div>

      {/* Tabs */}
      <div className="border-b bg-white" role="navigation" aria-label="Profile sections">
        <div className="flex gap-2 px-4 py-2">
          <Tab to="" icon={<IdCard className="h-4 w-4" aria-hidden="true" />} label="Employee Profile" />
          <Tab to="contact" icon={<Contact className="h-4 w-4" aria-hidden="true" />} label="Contact Info" />
        </div>
      </div>

      {/* Active tab content */}
      <div className="p-4" role="tabpanel">
        <Outlet context={{ editing } satisfies ProfileCtx} />
      </div>
    </div>
  );
}

interface TabProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function Tab({ to, icon, label }: TabProps): ReactElement {
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
      role="tab"
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
