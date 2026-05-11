import PermissionsTab from "@/components/permissions-tab";
import LeaveCustomizationForm from "@/modules/hr/leaves/admin/LeaveCustomizationForm";
import { AppTab } from "@/components/app-tab";
import { Building, Calendar, Shield } from "lucide-react";

// ─── ROOT COMPONENT (PROTECTED) ──────────────────────────────────────────────
export default function HRSettingsPage() {
  const tabsList = [
    {
      value: "leaves",
      label: "Leave Types",
      icon: <Calendar className="w-6 h-6" />,
      element: () => <LeaveCustomizationForm />,
    },
    {
      value: "permissions",
      label: "Permissions",
      icon: <Shield className="w-6 h-6" />,
      element: () => (
        <PermissionsTab
          moduleType="HR"
          modules={[
            { id: "employee_profile", label: "Employee Profile" },
            { id: "current_job", label: "Current Job" },
            { id: "salary", label: "Salary" },
            { id: "leaves", label: "Leaves" },
            { id: "loans", label: "Loans" },
            { id: "dependents", label: "Dependents" },
            { id: "appraisal", label: "Appraisal" },
            { id: "immigration", label: "Immigration" },
            { id: "hr_reports", label: "HR Reports" },
            { id: "hr_settings", label: "HR Settings" },
          ]}
        />
      ),
    },
    {
      value: "departments",
      label: "Departments",
      icon: <Building className="w-6 h-6" />,
      element: () => <div>Departments Master (TBD)</div>,
    },
  ];

  return (
    <AppTab
      title="HR Settings"
      variant="primary"
      subtitle="Manage leave policies, permissions, and departments"
      tabs={tabsList}
      defaultValue="leaves"
      backTo="/dashboard"
    />
  );
}
