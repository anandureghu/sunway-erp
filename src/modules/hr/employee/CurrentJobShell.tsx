import { NavLink, Outlet, useParams, useSearchParams } from "react-router-dom";
import { BriefcaseBusiness, GraduationCap, Hourglass } from "lucide-react";
import { useState, useEffect } from "react";
import { hrService } from "@/service/hr.service";
import EditUpdateButton from "@/components/EditUpdateButton";
import type { Employee } from "@/types/hr";

export default function CurrentJobShell() {
  const { id } = useParams<{ id: string }>();
  const [emp, setEmp] = useState<Employee | null>(null);
  const employeeTitle = emp
    ? `${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : id;

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => {
      mounted = false;
    };
  }, [id]);

  const [sp, setSp] = useSearchParams();

  const editing = sp.get("edit") === "1";

  const setEditing = (val: boolean) => {
    const next = new URLSearchParams(sp);
    if (val) next.set("edit", "1");
    else next.delete("edit");
    setSp(next, { replace: true });
  };

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Title bar shows the employee NAME */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="w-5 h-5" />
          <span className="font-semibold">Current Job Info – {employeeTitle}</span>
        </div>
      </div>

      {/* Action row BELOW header + Tabs */}
      <div className="px-4 pt-3 flex justify-between items-center border-b bg-white">
        <div className="flex gap-2">
          <TabLink to="" end icon={<BriefcaseBusiness className="w-4 h-4" />}>
            Current Job
          </TabLink>
          <TabLink to="previous-experiences" icon={<Hourglass className="w-4 h-4" />}>
            Previous Experiences
          </TabLink>
          <TabLink to="education" icon={<GraduationCap className="w-4 h-4" />}>
            Education and Qualifications
          </TabLink>
        </div>

        <EditUpdateButton
          editing={editing}
          onEdit={() => {
            try { document.dispatchEvent(new CustomEvent("current-job:start-edit")); } catch { /* ignore */ }
            setEditing(true);
          }}
          onCancel={() => {
            try { document.dispatchEvent(new CustomEvent("current-job:cancel")); } catch { /* ignore */ }
            setEditing(false);
          }}
          onSave={() => {
            try { document.dispatchEvent(new CustomEvent("current-job:save")); } catch { /* ignore */ }
            setEditing(false);
          }}
        />
      </div>

      <div className="p-4">
        <Outlet context={{ editing, setEditing }} />
      </div>
    </div>
  );
}

function TabLink({
  to,
  end,
  icon,
  children,
}: {
  to: string;
  end?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}              
      end={end}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm",
          isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100",
        ].join(" ")
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
