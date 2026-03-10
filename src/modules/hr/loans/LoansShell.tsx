import { NavLink, Outlet, useParams } from "react-router-dom";
import { Briefcase, Package } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { hrService } from "@/service/hr.service";
import type { Employee } from "@/types/hr";
import EditUpdateButton from "@/components/EditUpdateButton";

export default function LoansShell() {
  const { id } = useParams<{ id: string }>();
  const [emp, setEmp] = useState<Employee | null>(null);
  const title = emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeNo})` : "";

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => { mounted = false; };
  }, [id]);

  const [editing, setEditing] = useState(false);
  const saveRef = useRef<(() => Promise<void> | void) | null>(null);
  const registerSave = (fn: (() => Promise<void> | void) | null) => {
    saveRef.current = fn;
  };

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white overflow-hidden shadow-xl">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg text-lg font-semibold">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Briefcase className="h-5 w-5" />
          <span>Employee Loans and Company Properties – {title}</span>
        </div>
      </div>

      {/* Tabs + Edit/Update bar */}
      <div className="border-b bg-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex gap-2">
            <Tab to=""                   icon={<Briefcase className="h-4 w-4" />} label="Loans"               />
            <Tab to="company-properties" icon={<Package   className="h-4 w-4" />} label="Company Properties"  />
          </div>

          <EditUpdateButton
            module="LOANS"
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

      {/* Active tab content */}
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
          "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm",
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
            : "text-gray-700",
        ].join(" ")
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}