import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CycleConfig, Goal, RatingScale, Phase } from "./appraisal-types";

// ── Panel 5: Preview & Save ────────────────────────────────────────────────
export function PreviewPanel({
  config,
  goalsByJobCode,
  jobCodes,
  ratingScale,
  phases,
  saved,
  onSave,
}: {
  config: CycleConfig;
  goalsByJobCode: Record<string, Goal[]>;
  jobCodes: string[];
  ratingScale: RatingScale[];
  phases: Phase[];
  saved: boolean;
  onSave: () => void;
}) {
  const configuredJobCodes = jobCodes.filter(
    (r) => (goalsByJobCode[r] || []).filter((g) => g.active).length > 0,
  ).length;
  const validJobCodes = jobCodes.filter((r) => {
    const ag = (goalsByJobCode[r] || []).filter((g) => g.active);
    return ag.length > 0 && ag.reduce((s, g) => s + (g.weight || 0), 0) === 100;
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Appraisal Year",
            value: config.appraisalYear,
            icon: "📅",
            color: "text-indigo-600",
          },
          {
            label: "Job Codes Configured",
            value: `${configuredJobCodes}/${jobCodes.length}`,
            icon: "👥",
            color:
              validJobCodes === configuredJobCodes
                ? "text-green-600"
                : "text-amber-600",
          },
          {
            label: "Active Phases",
            value: phases.filter((p) => p.enabled).length,
            icon: "🗓️",
            color: "text-blue-600",
          },
          {
            label: "Rating Levels",
            value: ratingScale.length,
            icon: "⭐",
            color: "text-purple-600",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                {s.icon}
              </div>
              <div>
                <div className={`text-2xl font-black ${s.color}`}>
                  {s.value}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {s.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <h3 className="text-base font-bold text-slate-900">
              Goals by Job Code ({jobCodes.length} job codes)
            </h3>
          </div>
          {jobCodes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No job codes configured yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {jobCodes.map((role) => {
                const ag = (goalsByJobCode[role] || []).filter((g) => g.active);
                const tw = ag.reduce((s, g) => s + (g.weight || 0), 0);
                const ok = ag.length > 0 && tw === 100;
                return (
                  <div
                    key={role}
                    className={`p-4 rounded-xl border-2 ${ok ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-slate-900">
                        {role}
                      </span>
                      <Badge
                        className={
                          ok
                            ? "bg-green-100 text-green-700"
                            : ag.length === 0
                              ? "bg-slate-100 text-slate-500"
                              : "bg-amber-100 text-amber-700"
                        }
                      >
                        {ok
                          ? `✓ ${ag.length} KPIs`
                          : ag.length === 0
                            ? "No KPIs"
                            : `⚠ ${tw}%`}
                      </Badge>
                    </div>
                    {ag.slice(0, 3).map((g) => (
                      <div
                        key={g.id}
                        className="text-xs text-slate-500 flex justify-between py-0.5"
                      >
                        <span>{g.kpi || "Unnamed KPI"}</span>
                        <span className="font-semibold text-slate-400">
                          {g.weight}%
                        </span>
                      </div>
                    ))}
                    {ag.length > 3 && (
                      <div className="text-xs text-slate-400 mt-1">
                        +{ag.length - 3} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 text-center py-8">
        {saved ? (
          <div>
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-lg font-bold text-green-600 mb-2">
              Configuration Saved & Active!
            </div>
            <div className="text-sm text-slate-500">
              Goal templates are published for {config.appraisalYear}.
            </div>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-3">🚀</div>
            <div className="text-lg font-bold text-indigo-600 mb-2">
              Ready to Activate
            </div>
            <div className="text-sm text-slate-500 mb-5">
              Once saved, goal templates will be published and the workflow
              initiated.
            </div>
            <Button
              onClick={onSave}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-2.5"
            >
              ✓ Save & Activate Configuration
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
