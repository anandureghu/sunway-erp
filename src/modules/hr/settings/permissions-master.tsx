import PermissionsTab from "@/components/permissions-tab";

const HR_MODULES = [
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
];

export default function PermissionsMaster() {
  return <PermissionsTab moduleType="HR" modules={HR_MODULES} />;
}

