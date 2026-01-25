import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { hrService } from "@/service/hr.service";
import type { Employee } from "@/types/hr";

import { Wrench, Hourglass, GraduationCap } from "lucide-react";

export default function CurrentJobLayout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [emp, setEmp] = useState<Employee | null>(null);

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="p-4">
      <Card className="border-0 shadow-none">
        {/* Title like your screenshot */}
        <div className="bg-blue-600 text-white rounded-t-lg px-4 py-3 text-lg font-semibold">
          {`Current Job Info - ${emp?.firstName ?? ""} ${emp?.lastName ?? ""} ()`}
        </div>

        <div className="border-x border-b rounded-b-lg">
          {/* Tab strip */}
          <div className="flex items-center gap-2 border-b bg-white px-3">
            <TabLink
              to="current-job"
              label="Current Job"
              icon={<Wrench className="w-4 h-4" />}
            />
            <TabLink
              to="previous-experiences"
              label="Previous Experiences"
              icon={<Hourglass className="w-4 h-4" />}
            />
            <TabLink
              to="education"
              label="Education and Qualifications"
              icon={<GraduationCap className="w-4 h-4" />}
            />
          </div>

          {/* Tab content */}
          <div className="p-4">
            <Outlet />
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

function TabLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end
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
      <span>{label}</span>
    </NavLink>
  );
}
