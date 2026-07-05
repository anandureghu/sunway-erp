import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { hrService } from "@/service/hr.service";
import type { Employee } from "@/types/hr";
import { Wrench, Hourglass, GraduationCap } from "lucide-react";
import EditUpdateButton from "@/components/EditUpdateButton";
import {
  useShellFormBridge,
  type ShellFormHandlers,
} from "@/modules/hr/hooks/use-shell-form-bridge";

export interface CurrentJobCtx {
  editing: boolean;
  registerHandlers: (handlers: ShellFormHandlers | null) => void;
}

export default function CurrentJobLayout() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [editing, setEditing] = useState(false);
  const { registerHandlers, runBeginEdit, runSave, runCancel } = useShellFormBridge();

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => { mounted = false; };
  }, [id]);

  const startEdit = useCallback(() => {
    runBeginEdit();
    setEditing(true);
  }, [runBeginEdit]);

  const handleSave = useCallback(async () => {
    const ok = await runSave();
    if (ok) setEditing(false);
  }, [runSave]);

  const handleCancel = useCallback(() => {
    runCancel();
    setEditing(false);
  }, [runCancel]);

  return (
    <div className="p-4">
      <Card className="border-0 shadow-none">
        {/* Title */}
        <div className="bg-blue-600 text-white rounded-t-lg px-4 py-3 text-lg font-semibold">
          {`Current Job Info - ${emp?.firstName ?? ""} ${emp?.lastName ?? ""} ()`}
        </div>

        <div className="border-x border-b rounded-b-lg">
          {/* Tab strip + Edit button */}
          <div className="flex items-center justify-between border-b bg-white px-3">
            <div className="flex items-center gap-2">
              <TabLink to="current-job"          label="Current Job"                    icon={<Wrench        className="w-4 h-4" />} />
              <TabLink to="previous-experiences" label="Previous Experiences"           icon={<Hourglass     className="w-4 h-4" />} />
              <TabLink to="education"            label="Education and Qualifications"   icon={<GraduationCap className="w-4 h-4" />} />
            </div>

            <div className="py-2">
              <EditUpdateButton
                module="CURRENT_JOB"
                editing={editing}
                onEdit={startEdit}
                onCancel={handleCancel}
                onSave={() => { void handleSave(); }}
              />
            </div>
          </div>

          {/* Tab content — pass editing state via Outlet context */}
          <div className="p-4">
            <Outlet context={{ editing, registerHandlers } satisfies CurrentJobCtx} />
          </div>

          {/* Back to Search */}
          <div className="px-4 pb-4">
            <button
              onClick={() => navigate("/hr/employees")}
              className="ml-auto inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-gray-50"
            >
              Back to Search
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TabLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 ease-in-out",
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
            : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-sm",
        ].join(" ")
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
