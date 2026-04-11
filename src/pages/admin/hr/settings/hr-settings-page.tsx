import PermissionsTab from "@/components/permissions-tab";
import LeaveCustomizationForm from "@/modules/hr/leaves/admin/LeaveCustomizationForm";
import { AppTab } from "@/components/app-tab";

// ─── ROOT COMPONENT (PROTECTED) ──────────────────────────────────────────────
export default function HRSettingsPage() {
  const tabsList = [
    {
      value: "leaves",
      label: "Leave Types",
      element: () => <LeaveCustomizationForm />,
    },
    {
      value: "permissions",
      label: "Permissions",
      element: () => <PermissionsTab moduleType="HR" modules={[
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
      ]} />,
    },
    {
      value: "departments",
      label: "Departments",
      element: () => <div>Departments Master (TBD)</div>,
    },
  ];

  return (
    <div className="p-5">
      <AppTab
        title="HR Settings"
        variant="primary"
        subtitle="Manage leave policies, permissions, and departments"
        tabs={tabsList}
        defaultValue="leaves"
      />
    </div>
  );
}
