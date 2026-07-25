import { Progress } from "@/components/ui/progress";
import { DashboardEmpty } from "./dashboard-empty";
import { DashboardSectionCard } from "./dashboard-section-card";

export type DashboardProgressRow = {
  id: string | number;
  label: string;
  percent: number;
  leftHint?: string;
  rightHint?: string;
};

export function DashboardProgressListCard({
  title,
  description,
  viewAllTo,
  rows,
  emptyMessage = "No data.",
}: {
  title: string;
  description?: string;
  viewAllTo?: string;
  rows: DashboardProgressRow[];
  emptyMessage?: string;
}) {
  return (
    <DashboardSectionCard
      title={title}
      description={description}
      viewAllTo={viewAllTo}
    >
      {rows.length === 0 ? (
        <DashboardEmpty message={emptyMessage} />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium">{row.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {Math.round(row.percent)}%
                </span>
              </div>
              <Progress
                value={Math.min(100, Math.max(0, row.percent))}
                className="h-2"
              />
              {(row.leftHint || row.rightHint) && (
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{row.leftHint}</span>
                  <span>{row.rightHint}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardSectionCard>
  );
}
