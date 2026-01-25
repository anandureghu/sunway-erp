import { NavLink, Outlet, useParams } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { IdCard, Contact } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hrService } from "@/service/hr.service";
import type { ReactElement } from "react";
import type { Employee } from "@/types/hr";


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
        className="bg-orange-500 hover:bg-orange-600 text-white transition-colors duration-200"
        aria-label="Save profile changes"
      >
        Save
      </Button>
    </div>
  );
}

export interface ProfileCtx {
  editing: boolean;
  setEditing?: (v: boolean) => void;
}

export default function ProfileShell(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const [emp, setEmp] = useState<Employee | null>(null);

  useEffect(() => {
    let mounted = true;
    if (id) {
      hrService.getEmployee(id).then((e) => {
        if (mounted) setEmp(e ?? null);
      });
    }
    return () => {
      mounted = false;
    };
  }, [id]);

  const title = emp
    ? `Employee Profile – ${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : "Employee Profile";

  const [editing, setEditing] = useState(false);

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
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg text-lg font-semibold">
        <div className="text-lg font-semibold" role="heading" aria-level={1}>{title}</div>
      </div>

      {/* Tabs + Action row (tabs left, edit controls right) */}
      <div className="px-4 pt-3 flex justify-between items-center border-b bg-white" role="navigation" aria-label="Profile sections">
        <div className="flex gap-2">
          <Tab to="" icon={<IdCard className="h-4 w-4" aria-hidden="true" />} label="Employee Profile" />
          <Tab to="contact" icon={<Contact className="h-4 w-4" aria-hidden="true" />} label="Contact Info" />
        </div>

        <EditUpdateBar
          editing={editing}
          onEdit={startEdit}
          onSave={save}
          onCancel={cancel}
        />
      </div>

      {/* Active tab content */}
      <div className="p-4" role="tabpanel">
        <Outlet context={{ editing, setEditing } satisfies ProfileCtx} />
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
          "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 ease-in-out",
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
            : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-sm hover:transform hover:scale-102",
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
