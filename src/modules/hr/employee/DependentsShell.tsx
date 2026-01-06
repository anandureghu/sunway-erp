import { Outlet, useParams, useSearchParams } from "react-router-dom";
import { Users2 } from "lucide-react";
import { useState, useEffect } from "react";
import { hrService } from "@/service/hr.service";
import EditUpdateButton from "@/components/EditUpdateButton";
import type { Employee } from "@/types/hr";

export default function DependentsShell() {
  const { id } = useParams<{ id: string }>();
  const [sp, setSp] = useSearchParams();

  const [emp, setEmp] = useState<Employee | null>(null);
  const employeeTitle = emp
    ? `${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : id ?? "";

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => {
      mounted = false;
    };
  }, [id]);

  const editing = sp.get("edit") === "1";

  const setEditing = (val: boolean) => {
    const next = new URLSearchParams(sp);
    if (val) next.set("edit", "1");
    else next.delete("edit");
    setSp(next, { replace: true });
  };

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Blue title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div className="flex items-center gap-2">
          <Users2 className="w-5 h-5" />
          <span className="font-semibold">Dependents – {employeeTitle}</span>
        </div>
      </div>

      {/* Action row BELOW header (same pill button you use elsewhere) */}
      <div className="px-4 pt-3 flex justify-end">
        <EditUpdateButton
          editing={editing}
          onEdit={() => setEditing(true)}
          onCancel={() => setEditing(false)}
          onSave={() => {
            window.dispatchEvent(new CustomEvent("dependents:save-click"));
            setEditing(false);
          }}
        />
      </div>

      {/* Body */}
      <div className="p-4">
        <Outlet />
      </div>
    </div>
  );
}
