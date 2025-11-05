import { NavLink, Outlet, useParams } from "react-router-dom";
import { BriefcaseBusiness, GraduationCap, Hourglass } from "lucide-react";
import { EMPLOYEES } from "@/pages/employees.mock";

export default function CurrentJobShell() {
  const { id } = useParams<{ id: string }>();

  const emp = EMPLOYEES.find((e) => e.id === id);
  const employeeTitle = emp
    ? `${emp.firstName} ${emp.lastName}${emp.employeeNo ? ` (${emp.employeeNo})` : ""}`
    : id; 

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Title bar shows the employee NAME */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="w-5 h-5" />
          <span className="font-semibold">Current Job Info – {employeeTitle}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="flex gap-2 px-3 py-2">
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
      </div>

      <div className="p-4">
        <Outlet />
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
