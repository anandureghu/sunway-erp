import { NavLink, Outlet, useParams } from "react-router-dom";
import { Banknote, Landmark, BadgeIndianRupee } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { EMPLOYEES } from "@/pages/employees.mock";
import EditUpdateButton from "@/components/EditUpdateButton";

interface SalaryCtx {
  editing: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;
}

export default function SalaryShell() {
  const { id } = useParams<{ id: string }>();
  const emp = useMemo(() => EMPLOYEES.find((e) => e.id === id), [id]);
  const title = emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeNo})` : "";

  const [editing, setEditing] = useState(false);

  const startEdit = useCallback(() => {
    setEditing(true);
    document.dispatchEvent(new CustomEvent("salary:start-edit"));
  }, []);

  const cancel = useCallback(() => {
    document.dispatchEvent(new CustomEvent("salary:cancel"));
    setEditing(false);
  }, []);

  const save = useCallback(() => {
    document.dispatchEvent(new CustomEvent("salary:save"));
    setEditing(false);
  }, []);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Blue title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Banknote className="h-5 w-5" />
          <span>Salary Info – {title}</span>
        </div>
      </div>

      {/* Action row under the header */}
      <div className="px-4 pt-3 flex justify-end">
        <EditUpdateButton editing={editing} onEdit={startEdit} onCancel={cancel} onSave={save} />
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="flex gap-2 px-4 py-2">
          <Tab to="" icon={<BadgeIndianRupee className="h-4 w-4" />} label="Salary" />
          <Tab to="bank" icon={<Landmark className="h-4 w-4" />} label="Bank" />
          <Tab to="payroll" icon={<Banknote className="h-4 w-4" />} label="Payroll" />
        </div>
      </div>

      {/* Active tab content */}
      <div className="p-4">
        <Outlet context={{
          editing,
          startEdit,
          cancelEdit: cancel,
          saveEdit: save
        } satisfies SalaryCtx} />
      </div>
    </div>
  );
}

function Tab({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
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
      {label}
    </NavLink>
  );
}
