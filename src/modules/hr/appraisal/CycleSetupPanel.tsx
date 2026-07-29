import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CycleConfig } from "./appraisal-types";
import { YEARS, MONTHS } from "./appraisal-constants";

// ── Panel 1: Cycle Setup ───────────────────────────────────────────────────
export function CycleSetupPanel({
  config,
  setConfig,
}: {
  config: CycleConfig;
  setConfig: React.Dispatch<React.SetStateAction<CycleConfig>>;
}) {
  const upd = (k: keyof CycleConfig, v: string | number | boolean) =>
    setConfig((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📅</span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Appraisal Cycle Setup
              </h3>
              <p className="text-sm text-slate-500">
                Define the appraisal year and basic configuration.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Appraisal Year *
              </label>
              <Select
                value={config.appraisalYear}
                onValueChange={(v) => upd("appraisalYear", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Cycle Name *
              </label>
              <Input
                value={config.appraisalName}
                onChange={(e) => upd("appraisalName", e.target.value)}
                placeholder="e.g. FY2025 Annual Performance Appraisal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Cycle Start Month
              </label>
              <Select
                value={config.startMonth}
                onValueChange={(v) => upd("startMonth", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Cycle End Month
              </label>
              <Select
                value={config.endMonth}
                onValueChange={(v) => upd("endMonth", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Min Goals per Employee
              </label>
              <Input
                type="number"
                value={config.minGoals}
                onChange={(e) => upd("minGoals", +e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Max Goals per Employee
              </label>
              <Input
                type="number"
                value={config.maxGoals}
                onChange={(e) => upd("maxGoals", +e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔧</span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Module Settings
              </h3>
              <p className="text-sm text-slate-500">
                Enable or disable optional appraisal modules.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              {
                key: "enableSelfAssessment" as const,
                label: "Self-Assessment Module",
                desc: "Allow employees to rate themselves before the manager review.",
              },
              {
                key: "enableMidYear" as const,
                label: "Mid-Year Review",
                desc: "Include a mid-year progress check between manager and employee.",
              },
              {
                key: "enablePIP" as const,
                label: "PIP Auto-Trigger",
                desc: "Automatically initiate a PIP when rating is 1 (Unsatisfactory).",
              },
            ].map((opt) => (
              <div
                key={opt.key}
                role="switch"
                aria-checked={config[opt.key]}
                aria-label={opt.label}
                tabIndex={0}
                onClick={() => upd(opt.key, !config[opt.key])}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    upd(opt.key, !config[opt.key]);
                  }
                }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  config[opt.key]
                    ? "border-indigo-200 bg-indigo-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div
                  className={`w-11 h-6 rounded-full relative transition-colors ${config[opt.key] ? "bg-indigo-600" : "bg-slate-300"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${config[opt.key] ? "left-5" : "left-0.5"}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-slate-900">
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-500">{opt.desc}</div>
                </div>
                <Badge
                  className={
                    config[opt.key]
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-500"
                  }
                >
                  {config[opt.key] ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
