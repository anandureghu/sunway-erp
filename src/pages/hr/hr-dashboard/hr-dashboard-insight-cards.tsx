import {
  DashboardDonutCard,
  DashboardEmpty,
  DashboardSectionCard,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { HrDashboardInsights } from "@/lib/hr-dashboard-analytics";

function InsightStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "muted";
}) {
  return (
    <div>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          tone === "danger" && "text-red-600",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function AppraisalCycleCard({
  data,
}: {
  data: HrDashboardInsights["appraisalCycle"];
}) {
  const total =
    data.finalized + data.inProgress + Math.max(0, data.notStarted);

  return (
    <DashboardSectionCard
      title={`Appraisal cycle — ${data.cycleLabel}`}
      viewAllTo="/hr/settings?tab=appraisal"
    >
      {total === 0 ? (
        <DashboardEmpty message="No appraisals assigned this year." />
      ) : (
        <div className="space-y-4">
          <DashboardDonutCard
            title={`Appraisal cycle — ${data.cycleLabel}`}
            embedded
            slices={[
              { name: "Finalized", value: data.finalized, fill: "#2563eb" },
              { name: "In progress", value: data.inProgress, fill: "#93c5fd" },
              {
                name: "Not started",
                value: Math.max(0, data.notStarted),
                fill: "#e2e8f0",
              },
            ]}
            centerValue={`${data.finalizedPercent}%`}
            emptyMessage="No appraisal data."
            size="sm"
          />
          <div className="grid grid-cols-3 gap-2 text-center">
            <InsightStat
              label="finalized"
              value={`${data.finalized} of ${data.totalAssigned || total}`}
            />
            <InsightStat
              label="in progress"
              value={data.inProgress}
              tone="muted"
            />
            <InsightStat
              label="not started"
              value={data.notStarted}
              tone="danger"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {data.averageRating != null ? (
              <Badge className="bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
                AVG RATING: {data.averageRating}
              </Badge>
            ) : null}
            {data.topDepartment ? (
              <Badge className="bg-amber-50 text-amber-900 hover:bg-amber-50">
                TOP: {data.topDepartment.toUpperCase()}
              </Badge>
            ) : null}
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}

export function ProbationTrackerCard({
  data,
}: {
  data: HrDashboardInsights["probation"];
}) {
  return (
    <DashboardSectionCard
      title="Probation tracker"
      viewAllTo="/hr/reports?tab=confirm-employees"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/50 px-4 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{data.onProbation}</p>
            <p className="text-xs text-muted-foreground">On probation</p>
          </div>
          <div className="rounded-xl bg-red-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums text-red-600">
              {data.dueOrOverdue}
            </p>
            <p className="text-xs text-red-700">Due / overdue</p>
          </div>
        </div>
        <div className="space-y-2 border-t pt-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Confirmed YTD</span>
            <span className="font-semibold tabular-nums">
              {data.confirmedYtd}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Extended</span>
            <span className="font-semibold tabular-nums">{data.extended}</span>
          </div>
        </div>
      </div>
    </DashboardSectionCard>
  );
}

export function QatarizationCard({
  data,
}: {
  data: HrDashboardInsights["qatarization"];
}) {
  return (
    <DashboardSectionCard
      title="Qatarization compliance"
      description={`Target: ${data.targetPercent}% Qatari nationals (company default)`}
    >
      {data.totalWorkforce === 0 ? (
        <DashboardEmpty message="No workforce data." />
      ) : (
        <div className="space-y-4">
          <DashboardDonutCard
            title="Qatarization compliance"
            embedded
            slices={[
              {
                name: "Qatari nationals",
                value: data.qatariCount,
                fill: "#166534",
              },
              {
                name: "Other nationalities",
                value: Math.max(0, data.totalWorkforce - data.qatariCount),
                fill: "#e2e8f0",
              },
            ]}
            centerValue={`${data.currentPercent}%`}
            emptyMessage="No workforce data."
            size="sm"
          />
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold tabular-nums">
                {data.qatariCount}
              </span>{" "}
              Qatari nationals
            </p>
            <p className="text-muted-foreground">
              Target: {data.targetPercent}%
            </p>
            <p className="text-amber-800">
              Gap:{" "}
              <span className="font-semibold tabular-nums">
                {data.gapPositions}
              </span>{" "}
              positions
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Current vs target</span>
              <span className="font-medium tabular-nums">
                {data.progressToTargetPercent}%
              </span>
            </div>
            <Progress
              value={data.progressToTargetPercent}
              className="h-2 bg-emerald-100 [&>div]:bg-emerald-700"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{data.deadlineLabel}</p>
        </div>
      )}
    </DashboardSectionCard>
  );
}
