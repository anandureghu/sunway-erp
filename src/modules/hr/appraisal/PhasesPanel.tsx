import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Phase } from "./appraisal-types";

// ── Panel 4: Timeline Phases ───────────────────────────────────────────────
export function PhasesPanel({
  phases,
  setPhases,
}: {
  phases: Phase[];
  setPhases: React.Dispatch<React.SetStateAction<Phase[]>>;
}) {
  function update(id: string, field: keyof Phase, val: string | boolean) {
    setPhases((p) =>
      p.map((ph) => (ph.id === id ? { ...ph, [field]: val } : ph)),
    );
  }

  return (
    <div className="space-y-4">
      {phases.map((phase) => (
        <Card
          key={phase.id}
          className={
            phase.enabled ? "border-indigo-200" : "border-slate-200 opacity-60"
          }
        >
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${phase.enabled ? "bg-indigo-50" : "bg-slate-100"}`}
                >
                  {phase.icon}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{phase.label}</div>
                  <div className="text-xs text-slate-500">
                    {phase.description}
                  </div>
                </div>
              </div>
              <div
                role="switch"
                aria-checked={phase.enabled}
                aria-label={`Toggle ${phase.label} phase`}
                tabIndex={0}
                onClick={() => update(phase.id, "enabled", !phase.enabled)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    update(phase.id, "enabled", !phase.enabled);
                  }
                }}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${phase.enabled ? "bg-indigo-600" : "bg-slate-300"}`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${phase.enabled ? "left-5" : "left-0.5"}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={phase.startDate}
                  onChange={(e) => update(phase.id, "startDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  End Date
                </label>
                <Input
                  type="date"
                  value={phase.endDate}
                  onChange={(e) => update(phase.id, "endDate", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
