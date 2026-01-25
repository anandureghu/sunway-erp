import { NavLink, Outlet, useParams } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { Contact2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hrService } from "@/service/hr.service";
import type { ReactElement } from "react";
import type { Employee } from "@/types/hr";

export interface ImmigrationCtx {
  editing: boolean;
}

/** Small edit bar used across modules (kept inline for simplicity). */
function EditUpdateBar({
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return !editing ? (
    <Button
      variant="outline"
      className="rounded-full shadow-sm bg-white hover:shadow gap-2"
      onClick={onEdit}
    >
      <span className="text-[16px]">✏️</span> Edit/Update
    </Button>
  ) : (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSave} className="bg-orange-500 hover:bg-orange-600 text-white">
        Save
      </Button>
    </div>
  );
}

type ImmigrationEvent = "immigration:edit" | "immigration:save" | "immigration:cancel";

export default function ImmigrationShell(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const [emp, setEmp] = useState<Employee | null>(null);

  const title = emp
    ? `Immigration Services - ${emp.firstName} ${emp.lastName}${
        emp.employeeNo ? ` (${emp.employeeNo})` : ""
      }`
    : "Immigration Services";

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => {
      mounted = false;
    };
  }, [id]);

  const [editing, setEditing] = useState(false);

  const fire = useCallback((name: ImmigrationEvent) => {
    try { document.dispatchEvent(new CustomEvent(name)); } catch { document.dispatchEvent(new Event(name)); }
  }, []);

  const startEdit = useCallback(() => {
    setEditing(true);
    fire("immigration:edit");
  }, [fire]);

  const save = useCallback(() => {
    fire("immigration:save");
    setEditing(false);
  }, [fire]);

  const cancel = useCallback(() => {
    fire("immigration:cancel");
    setEditing(false);
  }, [fire]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden" role="region" aria-label="Immigration information section">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg text-lg font-semibold">
        <div className="text-lg font-semibold" role="heading" aria-level={1}>{title}</div>
      </div>

      {/* Tabs + Action row (tabs left, edit controls right) */}
      <div className="px-4 pt-3 flex justify-between items-center border-b bg-white" role="navigation" aria-label="Immigration sections">
        <div className="flex gap-2 px-0 py-0">
          <Tab to="" icon={<Contact2 className="h-4 w-4" aria-hidden="true" />} label="Passport" />
          <Tab
            to="residence-permit"
            icon={<Landmark className="h-4 w-4" aria-hidden="true" />}
            label="Residence Permit"
          />
        </div>

        <EditUpdateBar
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
