import { NavLink, Outlet, useParams } from "react-router-dom";
import { ClipboardList, FileText } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { EMPLOYEES } from "@/pages/employees.mock";

/** Shared “Edit/Update ↔ Save/Cancel” bar used under the blue header */
function EditUpdateBar(props: {
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}): ReactElement {
  const { editing, onEdit, onCancel, onSave } = props;

  if (!editing) {
    return (
      <Button
        variant="outline"
        className="rounded-full shadow-sm hover:shadow bg-white"
        onClick={onEdit}
        aria-label="Edit appraisal"
      >
        <span className="mr-2">✏️</span> Edit/Update
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onCancel} aria-label="Cancel editing">
        Cancel
      </Button>
      <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700" aria-label="Save changes">
        Save
      </Button>
    </div>
  );
}

export type AppraisalCtx = {
  editing: boolean;
  setEditing?: (b: boolean) => void;
};

export default function AppraisalShell(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const emp = useMemo(() => EMPLOYEES.find((e) => e.id === id), [id]);
  const title = emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeNo})` : "";

  const [editing, setEditing] = useState(false);

  const handleEdit = useCallback(() => setEditing(true), []);
  const handleCancel = useCallback(() => setEditing(false), []);
  const handleSave = useCallback(() => setEditing(false), []);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Blue header */}
      <div className="px-4 py-3 bg-blue-600 text-white text-lg font-semibold rounded-t-xl">
        Employee Appraisal – {title}
      </div>

      {/* Action row UNDER the header */}
      <div className="px-4 pt-3 flex justify-end">
        <EditUpdateBar editing={editing} onEdit={handleEdit} onCancel={handleCancel} onSave={handleSave} />
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="flex gap-2 px-4 py-2">
          <Tab to="" icon={<ClipboardList className="h-4 w-4" />} label="Employee Performance" />
          <Tab to="form" icon={<FileText className="h-4 w-4" />} label="Appraisal Form" />
        </div>
      </div>

      {/* Active tab content */}
      <div className="p-4">
        <Outlet context={{ editing, setEditing } satisfies AppraisalCtx} />
      </div>
    </div>
  );
}

function Tab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
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
      {label}
    </NavLink>
  );
}
