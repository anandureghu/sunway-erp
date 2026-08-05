import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JobCode } from "@/service/jobCodeService";
import type { Goal } from "./appraisal-types";

// ── Panel 2: Goals & KPIs (per job code) ───────────────────────────────────
export function GoalsPanel({
  goalsByJobCode,
  setGoalsByJobCode,
  jobCodes,
  selectedJobCode,
  setSelectedJobCode,
  maxGoals,
  minGoals,
  onAddJobCode,
  onRemoveJobCode,
  availableJobCodes = [],
}: {
  goalsByJobCode: Record<string, Goal[]>;
  setGoalsByJobCode: React.Dispatch<
    React.SetStateAction<Record<string, Goal[]>>
  >;
  jobCodes: string[];
  selectedJobCode: string;
  setSelectedJobCode: (jobCode: string) => void;
  maxGoals: number;
  minGoals: number;
  onAddJobCode: (jobCode: string) => void;
  onRemoveJobCode: (jobCode: string) => void;
  availableJobCodes?: JobCode[];
}) {
  const [newJobCode, setNewJobCode] = useState("");
  const goals = goalsByJobCode[selectedJobCode] || [];
  const activeGoals = goals.filter((g) => g.active);
  const totalWeight = activeGoals.reduce((s, g) => s + (g.weight || 0), 0);

  // code → title lookup for friendly labels next to the code
  const titleFor = (code: string) =>
    availableJobCodes.find((j) => j.code === code)?.title || "";

  function addGoal() {
    if (activeGoals.length >= maxGoals) return;
    setGoalsByJobCode((p) => ({
      ...p,
      [selectedJobCode]: [
        ...(p[selectedJobCode] || []),
        { id: Date.now(), kpi: "", description: "", weight: 0, active: true },
      ],
    }));
  }

  function removeGoal(id: number) {
    if (activeGoals.length <= minGoals) return;
    setGoalsByJobCode((p) => ({
      ...p,
      [selectedJobCode]: p[selectedJobCode].map((g) =>
        g.id === id ? { ...g, active: false } : g,
      ),
    }));
  }

  function updateGoal(id: number, field: keyof Goal, val: string | number) {
    setGoalsByJobCode((p) => ({
      ...p,
      [selectedJobCode]: p[selectedJobCode].map((g) =>
        g.id === id ? { ...g, [field]: val } : g,
      ),
    }));
  }

  function autoBalance() {
    const count = activeGoals.length;
    if (!count) return;
    const base = Math.floor(100 / count);
    const rem = 100 - base * count;
    setGoalsByJobCode((p) => ({
      ...p,
      [selectedJobCode]: p[selectedJobCode].map((g) => {
        if (!g.active) return g;
        const idx = activeGoals.findIndex((a) => a.id === g.id);
        return {
          ...g,
          weight: base + (idx === activeGoals.length - 1 ? rem : 0),
        };
      }),
    }));
  }

  // Job codes available to add = active company codes not already configured
  const jobCodeOptions = availableJobCodes.filter(
    (j) => !jobCodes.includes(j.code),
  );

  return (
    <div className="flex gap-6">
      {/* Job Code Sidebar */}
      <div className="w-64 shrink-0 space-y-3">
        <Card className="p-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">
            Configured Job Codes ({jobCodes.length})
          </div>

          {jobCodes.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              No job codes yet.
              <br />
              Add a job code below.
            </div>
          ) : (
            jobCodes.map((code) => {
              const rg = (goalsByJobCode[code] || []).filter((g) => g.active);
              const rw = rg.reduce((s, g) => s + (g.weight || 0), 0);
              const ok = rg.length > 0 && rw === 100;
              return (
                <div
                  key={code}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedJobCode === code}
                  aria-label={`Select ${code}`}
                  onClick={() => setSelectedJobCode(code)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedJobCode(code);
                    }
                  }}
                  className={`p-3 rounded-lg cursor-pointer mb-1 transition-all group ${
                    selectedJobCode === code
                      ? "bg-indigo-50 border border-indigo-200"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="font-semibold text-sm truncate"
                      style={{
                        color:
                          selectedJobCode === code ? "#4f46e5" : "#1e293b",
                      }}
                    >
                      {code}
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${code}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveJobCode(code);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs ml-1"
                    >
                      ✕
                    </button>
                  </div>
                  {titleFor(code) && (
                    <div className="text-[11px] text-slate-400 truncate">
                      {titleFor(code)}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">
                      {rg.length} KPIs
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: ok ? "#059669" : rw > 0 ? "#d97706" : "#94a3b8",
                      }}
                    >
                      {rw > 0 ? `${rw}%` : "—"}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Add Job Code */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase mb-2">
              Add Job Code
            </div>
            <Select
              value={newJobCode}
              onValueChange={(v) => {
                onAddJobCode(v);
                setNewJobCode("");
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select job code..." />
              </SelectTrigger>
              <SelectContent>
                {jobCodeOptions.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    All job codes added
                  </SelectItem>
                ) : (
                  jobCodeOptions.map((j) => (
                    <SelectItem key={j.code} value={j.code}>
                      {j.code} — {j.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Goals Editor */}
      <div className="flex-1">
        {!selectedJobCode ? (
          <Card>
            <CardContent className="pt-6 text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">🎯</div>
              <p className="font-medium">No job code selected</p>
              <p className="text-sm mt-1">
                Add a job code from the sidebar to configure KPIs
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎯</span>
                    <h3 className="text-base font-bold text-slate-900">
                      Goals for: {selectedJobCode}
                      {titleFor(selectedJobCode) && (
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          {titleFor(selectedJobCode)}
                        </span>
                      )}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    Min {minGoals}, Max {maxGoals} goals. Weights must total
                    100%.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={autoBalance}>
                    ⚡ Auto Balance
                  </Button>
                  <Button
                    size="sm"
                    onClick={addGoal}
                    disabled={activeGoals.length >= maxGoals}
                    className={
                      activeGoals.length >= maxGoals
                        ? "bg-slate-100 text-slate-400"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }
                  >
                    + Add KPI
                  </Button>
                </div>
              </div>

              {/* Weight bar */}
              <div className="bg-slate-50 rounded-lg p-3 mb-5 flex items-center gap-4">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${totalWeight === 100 ? "bg-green-500" : totalWeight > 100 ? "bg-red-500" : "bg-indigo-500"}`}
                    style={{ width: `${Math.min(totalWeight, 100)}%` }}
                  />
                </div>
                <div
                  className="font-bold text-sm"
                  style={{
                    color:
                      totalWeight === 100
                        ? "#059669"
                        : totalWeight > 100
                          ? "#dc2626"
                          : "#6366f1",
                  }}
                >
                  {totalWeight}%
                </div>
                <Badge
                  className={
                    totalWeight === 100
                      ? "bg-green-100 text-green-700"
                      : totalWeight > 100
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }
                >
                  {totalWeight === 100
                    ? "✓ Balanced"
                    : totalWeight > 100
                      ? "Over 100%"
                      : `${100 - totalWeight}% remaining`}
                </Badge>
              </div>

              <div className="space-y-3">
                {activeGoals.map((goal, idx) => (
                  <div
                    key={goal.id}
                    className="grid grid-cols-[32px_1fr_2fr_80px_36px] gap-3 items-start p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        KPI Name
                      </label>
                      <Input
                        value={goal.kpi}
                        onChange={(e) =>
                          updateGoal(goal.id, "kpi", e.target.value)
                        }
                        placeholder="e.g. Code Quality"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        Success Criteria
                      </label>
                      <Input
                        value={goal.description}
                        onChange={(e) =>
                          updateGoal(goal.id, "description", e.target.value)
                        }
                        placeholder="Measurable target..."
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        Weight %
                      </label>
                      <Input
                        type="number"
                        value={goal.weight}
                        onChange={(e) =>
                          updateGoal(goal.id, "weight", +e.target.value)
                        }
                        className="h-9 text-center font-bold text-indigo-600"
                      />
                    </div>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      disabled={activeGoals.length <= minGoals}
                      className={`mt-6 w-9 h-9 rounded-lg border-none flex items-center justify-center text-lg ${
                        activeGoals.length <= minGoals
                          ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                          : "bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer"
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {activeGoals.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No KPIs yet. Click "+ Add KPI" to start.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
