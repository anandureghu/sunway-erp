import { NavLink, Outlet, useParams } from "react-router-dom";
import { Briefcase, Package } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { hrService } from "@/service/hr.service";
import type { Employee } from "@/types/hr";
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
      <Button onClick={onSave} className="bg-orange-500 hover:bg-orange-600 text-white">Save</Button>
    </div>
  );
}

export default function LoansShell() {
  const { id } = useParams<{ id: string }>();
  const [emp, setEmp] = useState<Employee | null>(null);
  const title = emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeNo})` : "";

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => {
      mounted = false;
    };
  }, [id]);

  const [editing, setEditing] = useState(false);
  const saveRef = useRef<(() => Promise<void> | void) | null>(null);
  const registerSave = (fn: (() => Promise<void> | void) | null) => {
    saveRef.current = fn;
  };

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg text-lg font-semibold">
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
            onSave={async () => {
              try {
                if (saveRef.current) await saveRef.current();
              } finally {
                setEditing(false);
              }
            }}
          />
        </div>
      </div>

      {/* Active tab content; provide edit state to children via context-like props */}
      <div className="p-4">
        <Outlet context={{ editing, setEditing, registerSave }} />
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
          "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 ease-in-out",
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
            : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-sm hover:transform hover:scale-102",
        ].join(" ")
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
