import { DashboardCardSkeletonGrid } from "@/components/dashboard";
import type { HrDashboardInsights } from "@/lib/hr-dashboard-analytics";
import { Link } from "react-router-dom";
import {
  AppraisalCycleCard,
  ProbationTrackerCard,
  QatarizationCard,
} from "./hr-dashboard-insight-cards";
import {
  ContractTypesCard,
  LeaveUtilizationCard,
  WorkforceNationalityCard,
} from "./hr-dashboard-insight-cards-workforce";

export function HrDashboardInsightsPanels({
  insights,
  loading,
  error,
  onRetry,
}: {
  insights: HrDashboardInsights;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <DashboardCardSkeletonGrid
        count={6}
        className="md:grid-cols-2 xl:grid-cols-3"
        cardClassName="h-[360px] rounded-xl"
      />
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}. Showing partial insights where possible.
          {onRetry ? (
            <>
              {" "}
              <button
                type="button"
                className="font-medium underline"
                onClick={onRetry}
              >
                Retry
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AppraisalCycleCard data={insights.appraisalCycle} />
        <ProbationTrackerCard data={insights.probation} />
        <QatarizationCard data={insights.qatarization} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <WorkforceNationalityCard slices={insights.workforceByNationality} />
        <ContractTypesCard slices={insights.contractTypes} />
        <LeaveUtilizationCard data={insights.leaveUtilization} />
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        HR analytics use live employee, appraisal, probation, and leave data.{" "}
        <Link to="/hr/reports" className="underline underline-offset-2">
          Open HR reports
        </Link>{" "}
        for deeper analysis.
      </p>
    </div>
  );
}
