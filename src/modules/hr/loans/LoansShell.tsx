import { NavLink, Outlet, useParams } from "react-router-dom";
import { Briefcase, Package } from "lucide-react";
import { EMPLOYEES } from "@/pages/employees.mock";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

/** Small “Edit/Update ↔ Save/Cancel” control kept consistent with your other screens */
export function EditUpdateBar(props: {
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { editing, onEdit, onCancel, onSave } = props;
  return !editing ? (
    <Button
      variant="outline"
      className="rounded-full shadow-sm hover:shadow bg-white"
      onClick={onEdit}
    >
      <span className="mr-2">✏️</span> Edit/Update
    </Button>
  ) : (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
      <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
    </div>
  );
}

export default function LoansShell() {
  const { id } = useParams<{ id: string }>();
  const emp = useMemo(() => EMPLOYEES.find((e) => e.id === id), [id]);
  const title = emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeNo})` : "";

  // expose edit state to children via route context
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* blue title strip (NO edit button here) */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Briefcase className="h-5 w-5" />
          <span>Employee Loans and Company Properties – {title}</span>
        </div>
      </div>

      {/* Tabs + Edit/Update bar UNDER the header (same row) */}
      <div className="border-b bg-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex gap-2">
            <Tab to="" icon={<Briefcase className="h-4 w-4" />} label="Loans" />
            <Tab
              to="company-properties"
              icon={<Package className="h-4 w-4" />}
              label="Company Properties"
            />
          </div>

          {/* the button sits to the right, under the blue strip */}
          <EditUpdateBar
            editing={editing}
            onEdit={() => setEditing(true)}
            onCancel={() => setEditing(false)}
            onSave={() => setEditing(false)}
          />
        </div>
      </div>

      {/* Active tab content; provide edit state to children via context-like props */}
      <div className="p-4">
        <Outlet context={{ editing, setEditing }} />
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
