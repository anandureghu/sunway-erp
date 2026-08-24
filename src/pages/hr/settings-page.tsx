import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Network,
  UserRoundCog,
  Umbrella,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
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

type SubTab = {
  value: string;
  label: string;
  icon: ReactNode;
  element: () => ReactNode;
};

type GroupTab = {
  value: string;
  label: string;
  icon: ReactNode;
  element?: () => ReactNode;
  children?: SubTab[];
};

/** Map legacy flat tab ids (pre-grouping) onto group + sub. */
const legacyTabMap: Record<string, { tab: string; sub?: string }> = {
  leaves: { tab: "leave-loans", sub: "leaves" },
  "leave-approvals": { tab: "leave-loans", sub: "leave-approvals" },
  "loan-approvals": { tab: "leave-loans", sub: "loan-approvals" },
  "hr-policies": { tab: "policies", sub: "hr-policies" },
  "contract-renewables": { tab: "lifecycle", sub: "contract-renewables" },
  "confirm-employees": { tab: "lifecycle", sub: "confirm-employees" },
  appraisal: { tab: "lifecycle", sub: "appraisal" },
  jobs: { tab: "organization", sub: "jobs" },
  department: { tab: "organization", sub: "department" },
  roles: { tab: "organization", sub: "roles" },
  social: { tab: "policies", sub: "social" },
  permissions: { tab: "policies", sub: "permissions" },
};

export default function HRSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, permissions, permissionsLoading } = useAuth();
  const [jobs, setJobs] = useState<JobCode[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isAuthorized = isAdmin || canView(permissions, "HR_SETTINGS");

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

  const canApproveLoans =
    isAdmin || !!(permissions?.LOANS?.approve || permissions?.LOANS?.APPROVE);

  const canConfirmEmployees =
    isAdmin ||
    !!(
      permissions?.EMPLOYEE_PROFILE?.approve ||
      permissions?.EMPLOYEE_PROFILE?.APPROVE
    );

  const groups = useMemo<GroupTab[]>(() => {
    const list: GroupTab[] = [
      {
        value: "organization",
        label: "Organization",
        icon: <Network className="h-4 w-4" />,
        children: [
          {
            value: "department",
            label: "Departments",
            icon: <Building2 className="h-4 w-4" />,
            element: () => <DepartmentListPage hrSettings />,
          },
          {
            value: "jobs",
            label: "Job Codes",
            icon: <Briefcase className="h-4 w-4" />,
            element: () => <JobCodesTab jobs={jobs} setJobs={setJobs} />,
          },
          {
            value: "roles",
            label: "Roles",
            icon: <Users className="h-4 w-4" />,
            element: () => <SettingsRolesPage hrSettings />,
          },
        ],
      },
      {
        value: "lifecycle",
        label: "Employee lifecycle",
        icon: <UserRoundCog className="h-4 w-4" />,
        children: [
          ...(canConfirmEmployees
            ? [
                {
                  value: "confirm-employees",
                  label: "Confirmations",
                  icon: <UserCheck className="h-4 w-4" />,
                  element: () => <ConfirmEmployeesPanel />,
                },
              ]
            : []),
          {
            value: "contract-renewables",
            label: "Contract renewals",
            icon: <CalendarClock className="h-4 w-4" />,
            element: () => <ContractRenewablesPanel />,
          },
          {
            value: "appraisal",
            label: "Appraisals",
            icon: <Star className="h-4 w-4" />,
            element: () => <AppraisalTab />,
          },
        ],
      },
      {
        value: "leave-loans",
        label: "Leave & loans",
        icon: <Umbrella className="h-4 w-4" />,
        children: [
          {
            value: "leaves",
            label: "Leave types",
            icon: <Calendar className="h-4 w-4" />,
            element: () => <LeaveCustomizationForm />,
          },
          ...(canApproveLeaves
            ? [
                {
                  value: "leave-approvals",
                  label: "Leave approvals",
                  icon: <CalendarCheck className="h-4 w-4" />,
                  element: () => <LeaveApprovalPanel />,
                },
              ]
            : []),
          ...(canApproveLoans
            ? [
                {
                  value: "loan-approvals",
                  label: "Loan approvals",
                  icon: <Wallet className="h-4 w-4" />,
                  element: () => <LoanApprovalPanel />,
                },
              ]
            : []),
        ],
      },
      {
        value: "policies",
        label: "Policies & access",
        icon: <Shield className="h-4 w-4" />,
        children: [
          {
            value: "hr-policies",
            label: "HR Policies",
            icon: <FileText className="h-4 w-4" />,
            element: () => <HrPoliciesForm />,
          },
          {
            value: "social",
            label: "Social",
            icon: <Share2 className="h-4 w-4" />,
            element: () => <SocialSettingsPage hrSettings />,
          },
          ...(isAdmin
            ? [
                {
                  value: "permissions",
                  label: "Permissions",
                  icon: <KeyRound className="h-4 w-4" />,
                  element: () => (
                    <PermissionsTab roles={roles} setRoles={setRoles} />
                  ),
                },
              ]
            : []),
        ],
      },
    ];

    return list.filter((g) => (g.children?.length ?? 0) > 0 || !!g.element);
  }, [
    canApproveLeaves,
    canApproveLoans,
    canConfirmEmployees,
    isAdmin,
    jobs,
    roles,
  ]);

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

  const groupValues = groups.map((g) => g.value);
  const rawTab = searchParams.get("tab");
  const legacy = rawTab ? legacyTabMap[rawTab] : undefined;
  const requestedGroup = legacy?.tab ?? rawTab;
  const activeGroup =
    requestedGroup && groupValues.includes(requestedGroup)
      ? requestedGroup
      : (groups[0]?.value ?? "organization");

  const activeGroupDef =
    groups.find((g) => g.value === activeGroup) ?? groups[0];
  const subValues = (activeGroupDef?.children ?? []).map((c) => c.value);
  const requestedSub = searchParams.get("sub") ?? legacy?.sub;
  const activeSub =
    requestedSub && subValues.includes(requestedSub)
      ? requestedSub
      : (subValues[0] ?? "");

  const setGroup = (value: string) => {
    const next = groups.find((g) => g.value === value);
    const firstSub = next?.children?.[0]?.value;
    const params: Record<string, string> = {};
    if (value !== groups[0]?.value) params.tab = value;
    if (firstSub) params.sub = firstSub;
    setSearchParams(params, { replace: true });
  };

  const setSub = (value: string) => {
    const params: Record<string, string> = {};
    if (activeGroup !== groups[0]?.value) params.tab = activeGroup;
    if (value) params.sub = value;
    setSearchParams(params, { replace: true });
  };

  const tabsList = groups.map((group) => ({
    value: group.value,
    label: group.label,
    icon: group.icon,
    element: () => {
      if (!group.children?.length) {
        return group.element?.() ?? null;
      }

      const sub = group.children.some((c) => c.value === activeSub)
        ? activeSub
        : group.children[0].value;

      return (
        <Tabs value={sub} onValueChange={setSub} className="w-full">
          <div className="mb-4 w-full overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200/80 bg-slate-50/80 p-1 [scrollbar-width:thin]">
            <TabsList className="inline-flex min-w-max w-max flex-nowrap gap-1 bg-transparent p-0">
              {group.children.map((child) => (
                <StyledTabsTrigger
                  key={child.value}
                  value={child.value}
                  className="flex items-center gap-2 shrink-0 whitespace-nowrap"
                >
                  <span className="size-4 flex items-center justify-center">
                    {child.icon}
                  </span>
                  {child.label}
                </StyledTabsTrigger>
              ))}
            </TabsList>
          </div>
          {group.children.map((child) => (
            <TabsContent
              key={child.value}
              value={child.value}
              className="mt-0 focus-visible:outline-none"
            >
              {child.element()}
            </TabsContent>
          ))}
        </Tabs>
      );
    },
  }));

  return (
    <div className="space-y-6 p-6 bg-slate-50/60 min-h-screen">
      <PageHeader
        title="HR Settings"
        description="Organization, employee lifecycle, leave & loans, and policies & access"
        variant="default"
        icon={<Building className="w-6 h-6" />}
      />

      <AppTab
        title=""
        variant="primary"
        tabs={tabsList}
        value={activeGroup}
        onValueChange={setGroup}
      />
    </div>
  );
}
