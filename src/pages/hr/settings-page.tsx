import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { canView } from "@/service/companyService";
import { leaveService } from "@/service/leaveService";
import {
  Lock,
  ArrowLeft,
  Briefcase,
  KeyRound,
  Calendar,
  Users,
  Star,
  Building,
  FileText,
  CalendarCheck,
  CalendarClock,
  Wallet,
  Share2,
  Building2,
  UserCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LeaveCustomizationForm from "@/modules/hr/leaves/admin/LeaveCustomizationForm";
import LeaveApprovalPanel from "@/modules/hr/leaves/approval/LeaveApprovalPanel";
import LoanApprovalPanel from "@/modules/hr/loans/approval/LoanApprovalPanel";
import HrPoliciesForm from "@/modules/hr/policies/HrPoliciesForm";
import ContractRenewablesPanel from "@/modules/hr/contracts/ContractRenewablesPanel";
import { ConfirmEmployeesPanel } from "@/modules/hr/reports/ConfirmEmployeesPanel";
import AppraisalTab from "@/modules/hr/appraisal/AppraisalTab";
import { AppTab } from "@/components/app-tab";
import { PageHeader } from "@/components/PageHeader";
import SocialSettingsPage from "@/pages/admin/hr/company/social-settings-page";
import DepartmentListPage from "@/pages/admin/hr/department/department-list-page";
import SettingsRolesPage from "@/pages/settings/settings-role-page";
import { JobCodesTab } from "./settings/job-codes-tab";
import { PermissionsTab } from "./settings/permissions-tab";
import type { JobCode, Role } from "./settings/shared";

export const TABS = [
  { id: "leaves", label: "Leave Types", icon: Calendar },
  { id: "jobs", label: "Job Codes", icon: Briefcase },
  { id: "perms", label: "Permissions", icon: KeyRound },
  { id: "appraisal", label: "Appraisal", icon: Star },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export default function HRSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, permissions, permissionsLoading } = useAuth();
  const [jobs, setJobs] = useState<JobCode[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  // Gate the page on the HR_SETTINGS module permission instead of matching
  // the company-role name. ADMIN/SUPER_ADMIN keep their bypass via canView's
  // null-permissions branch (AuthContext sets permissions=null for admins).
  const isAuthorized = isAdmin || canView(permissions, "HR_SETTINGS");

  // Whether to show the "Leave Approvals" tab — mirrors the backend's
  // canActAsApprover (LEAVES.APPROVE permission OR department-manager). We
  // can't tell from the JWT/permissions alone whether the user is a dept
  // manager, so ask the BE.
  const [canApproveLeaves, setCanApproveLeaves] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    leaveService.fetchCanApprove().then((ok) => {
      if (!cancelled) setCanApproveLeaves(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Whether to show the "Loan Approvals" tab — purely permission-driven
  // (no department-manager fallback for loans today).
  const canApproveLoans =
    isAdmin || !!(permissions?.LOANS?.approve || permissions?.LOANS?.APPROVE);

  // Confirm Employees (probation → active) needs the EMPLOYEE_PROFILE approve grant;
  // ADMIN/SUPER_ADMIN keep their bypass (permissions is null for them).
  const canConfirmEmployees =
    isAdmin ||
    !!(
      permissions?.EMPLOYEE_PROFILE?.approve ||
      permissions?.EMPLOYEE_PROFILE?.APPROVE
    );

  if (permissionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading permissions…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-center">
              You do not have permission to access HR Settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabIcon = (Icon: React.ElementType) => <Icon className="h-4 w-4" />;

  const tabsList = [
    {
      value: "leaves",
      label: "Leave Types",
      icon: tabIcon(Calendar),
      element: () => <LeaveCustomizationForm />,
    },
    {
      value: "hr-policies",
      label: "HR Policies",
      icon: tabIcon(FileText),
      element: () => <HrPoliciesForm />,
    },
    {
      value: "contract-renewables",
      label: "Contract Renewables",
      icon: tabIcon(CalendarClock),
      element: () => <ContractRenewablesPanel />,
    },
    ...(canApproveLeaves
      ? [
          {
            value: "leave-approvals",
            label: "Leave Approvals",
            icon: tabIcon(CalendarCheck),
            element: () => <LeaveApprovalPanel />,
          },
        ]
      : []),
    ...(canApproveLoans
      ? [
          {
            value: "loan-approvals",
            label: "Loan Approvals",
            icon: tabIcon(Wallet),
            element: () => <LoanApprovalPanel />,
          },
        ]
      : []),
    ...(canConfirmEmployees
      ? [
          {
            value: "confirm-employees",
            label: "Confirm Employees",
            icon: tabIcon(UserCheck),
            element: () => <ConfirmEmployeesPanel />,
          },
        ]
      : []),
    {
      value: "jobs",
      label: "Job Codes",
      icon: tabIcon(Briefcase),
      element: () => <JobCodesTab jobs={jobs} setJobs={setJobs} />,
    },
    {
      value: "social",
      label: "Social",
      icon: tabIcon(Share2),
      element: () => <SocialSettingsPage hrSettings />,
    },
    {
      value: "department",
      label: "Department",
      icon: tabIcon(Building2),
      element: () => <DepartmentListPage hrSettings />,
    },
    {
      value: "roles",
      label: "Roles",
      icon: tabIcon(Users),
      element: () => <SettingsRolesPage hrSettings />,
    },
    // Permissions is system-security config — restrict to ADMIN/SUPER_ADMIN.
    // HR Manager keeps HR_SETTINGS for operational tabs but should not be
    // able to escalate by editing permission grants.
    ...(isAdmin
      ? [
          {
            value: "permissions",
            label: "Permissions",
            icon: tabIcon(KeyRound),
            element: () => <PermissionsTab roles={roles} setRoles={setRoles} />,
          },
        ]
      : []),
    {
      value: "appraisal",
      label: "Appraisal",
      icon: tabIcon(Star),
      element: () => <AppraisalTab />,
    },
  ];

  const tabParam = searchParams.get("tab");
  const tabValues = tabsList.map((tab) => tab.value);
  const activeTab =
    tabParam && tabValues.includes(tabParam) ? tabParam : "leaves";

  const handleTabChange = (value: string) => {
    setSearchParams(value === "leaves" ? {} : { tab: value }, { replace: true });
  };

  return (
    <div className="p-6 bg-slate-50/60 min-h-screen">
      <PageHeader
        title="HR Settings"
        description="Manage leave policies, org structure, roles, permissions, and appraisal"
        variant="default"
        icon={<Building className="w-6 h-6" />}
      />
      <AppTab
        tabs={tabsList}
        value={activeTab}
        onValueChange={handleTabChange}
      />
    </div>
  );
}
