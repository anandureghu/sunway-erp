import { useMemo, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { canView } from "@/service/companyService";
import {
  Lock,
  ArrowLeft,
  Briefcase,
  KeyRound,
  Calendar,
  Users,
  Building,
  FileText,
  Share2,
  Building2,
  Network,
  Shield,
  Hash,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import LeaveCustomizationForm from "@/modules/hr/leaves/admin/LeaveCustomizationForm";
import HrPoliciesForm from "@/modules/hr/policies/HrPoliciesForm";
import PublicHolidaysPanel from "@/modules/hr/policies/PublicHolidaysPanel";
import { AppTab } from "@/components/app-tab";
import { PageHeader } from "@/components/PageHeader";
import SocialSettingsPage from "@/pages/admin/hr/company/social-settings-page";
import DepartmentListPage from "@/pages/admin/hr/department/department-list-page";
import OrgStructurePanel from "@/modules/hr/organization/OrgStructurePanel";
import SettingsRolesPage from "@/pages/settings/settings-role-page";
import { JobCodesTab } from "./settings/job-codes-tab";
import { PermissionsTab } from "./settings/permissions-tab";
import type { JobCode, Role } from "./settings/shared";
import NumberSequencesPage from "@/pages/admin/hr/company/number-sequences-page";

type SubTab = {
  value: string;
  label: string;
  icon: ReactNode;
  element: () => ReactNode;
  /** Whether the current user may see this tab. */
  guard?: boolean;
};

type GroupTab = {
  value: string;
  label: string;
  icon: ReactNode;
  element?: () => ReactNode;
  children?: SubTab[];
};

/** Map legacy flat / pre-regroup tab ids onto group + sub. */
const legacyTabMap: Record<string, { tab: string; sub?: string }> = {
  leaves: { tab: "policies-access", sub: "leaves" },
  "hr-policies": { tab: "policies-access", sub: "hr-policies" },
  "public-holidays": { tab: "policies-access", sub: "public-holidays" },
  social: { tab: "policies-access", sub: "social" },
  policies: { tab: "policies-access", sub: "hr-policies" },
  organization: { tab: "organizational", sub: "org-structure" },
  "org-structure": { tab: "organizational", sub: "org-structure" },
  jobs: { tab: "organizational", sub: "jobs" },
  department: { tab: "organizational", sub: "department" },
  "number-sequences": { tab: "organizational", sub: "number-sequences" },
  administration: { tab: "permissions" },
  permissions: { tab: "permissions" },
  roles: { tab: "roles" },
};

export default function HRSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, permissions, permissionsLoading } = useAuth();
  const [jobs, setJobs] = useState<JobCode[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  // Authorized if admin, the HR_SETTINGS umbrella, or ANY per-tab HRS_* permission.
  const HRS_MODULES = [
    "HRS_ORG_STRUCTURE",
    "HRS_DEPARTMENTS",
    "HRS_JOB_CODES",
    "HRS_ROLES",
    "HRS_CONFIRMATIONS",
    "HRS_CONTRACT_RENEWALS",
    "HRS_APPRAISAL_CONFIG",
    "HRS_LEAVE_TYPES",
    "HRS_LEAVE_APPROVALS",
    "HRS_LOAN_APPROVALS",
    "HRS_POLICIES",
    "HRS_SOCIAL",
    "HRS_PERMISSIONS",
  ];
  const isAuthorized =
    isAdmin ||
    canView(permissions, "HR_SETTINGS") ||
    HRS_MODULES.some((m) => canView(permissions, m));


  // Each HR Settings tab has its own permission; the HR_SETTINGS umbrella (and admin)
  // grants all of them. Approval tabs also honour their existing approval permission.
  const hasSettingsUmbrella = isAdmin || canView(permissions, "HR_SETTINGS");
  const canTab = (mod: string) => hasSettingsUmbrella || canView(permissions, mod);

  const groups = useMemo<GroupTab[]>(() => {
    const list: GroupTab[] = [
      {
        value: "organizational",
        label: "Organizational",
        icon: <Network className="h-4 w-4" />,
        children: [
          {
            value: "org-structure",
            label: "Org Structure",
            icon: <Network className="h-4 w-4" />,
            element: () => <OrgStructurePanel />,
            guard: canTab("HRS_ORG_STRUCTURE"),
          },
          {
            value: "department",
            label: "Departments",
            icon: <Building2 className="h-4 w-4" />,
            element: () => <DepartmentListPage hrSettings />,
            guard: canTab("HRS_DEPARTMENTS"),
          },
          {
            value: "jobs",
            label: "Job Codes",
            icon: <Briefcase className="h-4 w-4" />,
            element: () => <JobCodesTab jobs={jobs} setJobs={setJobs} />,
            guard: canTab("HRS_JOB_CODES"),
          },
          {
            value: "number-sequences",
            label: "Number Sequences",
            icon: <Hash className="h-4 w-4" />,
            element: () => <NumberSequencesPage hrSettings />,
            guard: hasSettingsUmbrella,
          },
        ],
      },
      {
        value: "policies-access",
        label: "Policies and access Administration",
        icon: <Shield className="h-4 w-4" />,
        children: [
          {
            value: "hr-policies",
            label: "HR Policies",
            icon: <FileText className="h-4 w-4" />,
            element: () => <HrPoliciesForm />,
            guard: canTab("HRS_POLICIES"),
          },
          {
            value: "public-holidays",
            label: "Public Holidays",
            icon: <CalendarDays className="h-4 w-4" />,
            element: () => <PublicHolidaysPanel />,
            guard: canTab("HRS_POLICIES"),
          },
          {
            value: "leaves",
            label: "Leave types",
            icon: <Calendar className="h-4 w-4" />,
            element: () => <LeaveCustomizationForm />,
            guard: canTab("HRS_LEAVE_TYPES"),
          },
          {
            value: "social",
            label: "Social",
            icon: <Share2 className="h-4 w-4" />,
            element: () => <SocialSettingsPage hrSettings />,
            guard: canTab("HRS_SOCIAL"),
          },
        ],
      },
      {
        value: "permissions",
        label: "Permissions",
        icon: <KeyRound className="h-4 w-4" />,
        element: () => <PermissionsTab roles={roles} setRoles={setRoles} />,
      },
      {
        value: "roles",
        label: "Roles",
        icon: <Users className="h-4 w-4" />,
        element: () => <SettingsRolesPage hrSettings />,
      },
    ];

    const withGuards = list
      .map((g) => {
        if (g.value === "permissions") {
          return isAdmin || canView(permissions, "HRS_PERMISSIONS") ? g : null;
        }
        if (g.value === "roles") {
          return canTab("HRS_ROLES") ? g : null;
        }
        return {
          ...g,
          children: g.children?.filter((c) => c.guard !== false),
        };
      })
      .filter((g): g is GroupTab => g != null);

    return withGuards.filter(
      (g) => (g.children?.length ?? 0) > 0 || !!g.element,
    );
  }, [permissions, isAdmin, jobs, roles, hasSettingsUmbrella]);

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

  // Lifecycle & approval tabs moved to HR Operations — forward old links there.
  const movedToOperations: Record<string, string> = {
    lifecycle: "confirmations",
    "leave-loans": "leave-approvals",
    "confirm-employees": "confirmations",
    "contract-renewables": "contract-renewals",
    appraisal: "appraisals",
    "leave-approvals": "leave-approvals",
    "loan-approvals": "loan-approvals",
    "position-approvals": "position-approvals",
  };
  const movedSub = searchParams.get("sub");
  const movedTarget =
    (movedSub && movedToOperations[movedSub]) ||
    movedToOperations[searchParams.get("tab") ?? ""];
  if (movedTarget && searchParams.get("sub") !== "leaves") {
    return <Navigate to={`/hr/operations?tab=${movedTarget}`} replace />;
  }

  const groupValues = groups.map((g) => g.value);
  const rawTab = searchParams.get("tab");
  const legacy = rawTab ? legacyTabMap[rawTab] : undefined;
  const requestedGroup = legacy?.tab ?? rawTab;
  const activeGroup =
    requestedGroup && groupValues.includes(requestedGroup)
      ? requestedGroup
      : (groups[0]?.value ?? "organizational");

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
        description="Organizational, policies and access, permissions, and roles"
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
