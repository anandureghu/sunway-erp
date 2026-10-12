import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Lock,
  Star,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canView } from "@/service/companyService";
import { leaveService } from "@/service/leaveService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppTab } from "@/components/app-tab";
import { PageHeader } from "@/components/PageHeader";
import LeaveApprovalPanel from "@/modules/hr/leaves/approval/LeaveApprovalPanel";
import LoanApprovalPanel from "@/modules/hr/loans/approval/LoanApprovalPanel";
import ContractRenewablesPanel from "@/modules/hr/contracts/ContractRenewablesPanel";
import { ConfirmEmployeesPanel } from "@/modules/hr/reports/ConfirmEmployeesPanel";
import AppraisalTab from "@/modules/hr/appraisal/AppraisalTab";
import { PositionApprovalsPanel } from "@/pages/hr/settings/position-approvals-panel";

type OpsTab = {
  value: string;
  label: string;
  icon: ReactNode;
  element: () => ReactNode;
  guard: boolean;
};

/**
 * HR Operations — the day-to-day HR work that used to sit inside HR Settings:
 * employee lifecycle (confirmations, contract renewals, appraisals) and the
 * leave / loan approval queues. Each tab keeps its own permission.
 */
export default function HROperationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, permissions, permissionsLoading } = useAuth();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const hasSettingsUmbrella = isAdmin || canView(permissions, "HR_SETTINGS");
  const canTab = (mod: string) => hasSettingsUmbrella || canView(permissions, mod);

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
  // Position (job-code hold) approvals — HR Settings or Job Codes "Approve".
  const canApprovePositions =
    isAdmin ||
    !!(
      permissions?.HR_SETTINGS?.approve ||
      permissions?.HR_SETTINGS?.APPROVE ||
      permissions?.HRS_JOB_CODES?.approve ||
      permissions?.HRS_JOB_CODES?.APPROVE
    );
  const canConfirmEmployees =
    isAdmin ||
    !!(permissions?.EMPLOYEE_PROFILE?.approve || permissions?.EMPLOYEE_PROFILE?.APPROVE);

  const tabs = useMemo<OpsTab[]>(
    () =>
      [
        {
          value: "confirmations",
          label: "Confirmations",
          icon: <UserCheck className="h-4 w-4" />,
          element: () => <ConfirmEmployeesPanel />,
          guard: canTab("HRS_CONFIRMATIONS") || canConfirmEmployees,
        },
        {
          value: "contract-renewals",
          label: "Contract renewals",
          icon: <CalendarClock className="h-4 w-4" />,
          element: () => <ContractRenewablesPanel />,
          guard: canTab("HRS_CONTRACT_RENEWALS"),
        },
        {
          value: "appraisals",
          label: "Appraisals",
          icon: <Star className="h-4 w-4" />,
          element: () => <AppraisalTab />,
          guard: canTab("HRS_APPRAISAL_CONFIG"),
        },
        {
          value: "leave-approvals",
          label: "Leave approvals",
          icon: <CalendarCheck className="h-4 w-4" />,
          element: () => <LeaveApprovalPanel />,
          guard: canTab("HRS_LEAVE_APPROVALS") || canApproveLeaves,
        },
        {
          value: "loan-approvals",
          label: "Loan approvals",
          icon: <Wallet className="h-4 w-4" />,
          element: () => <LoanApprovalPanel />,
          guard: canTab("HRS_LOAN_APPROVALS") || canApproveLoans,
        },
        {
          value: "position-approvals",
          label: "Position approvals",
          icon: <ClipboardCheck className="h-4 w-4" />,
          element: () => <PositionApprovalsPanel />,
          guard: canApprovePositions,
        },
      ].filter((t) => t.guard),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions, isAdmin, canApproveLeaves, canApproveLoans, canConfirmEmployees, canApprovePositions],
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

  if (tabs.length === 0) {
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
              You do not have permission to access HR Operations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requested = searchParams.get("tab");
  const active = tabs.some((t) => t.value === requested) ? requested! : tabs[0].value;

  return (
    <div className="space-y-6 p-6 bg-slate-50/60 min-h-screen">
      <PageHeader
        title="HR Operations"
        description="Confirmations, contract renewals, appraisals, and leave, loan & position approvals"
        variant="default"
        icon={<ClipboardList className="w-6 h-6" />}
      />
      <AppTab
        title=""
        variant="primary"
        tabs={tabs.map(({ value, label, icon, element }) => ({ value, label, icon, element }))}
        value={active}
        onValueChange={(v: string) =>
          setSearchParams(v === tabs[0].value ? {} : { tab: v }, { replace: true })
        }
      />
    </div>
  );
}
