import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  appraisalConfigService,
  type AppraisalConfigResponse,
} from "@/service/appraisalConfigService";
import { useAuth } from "@/context/AuthContext";
import { jobCodeService, type JobCode } from "@/service/jobCodeService";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import type { CycleConfig, Goal, RatingScale, Phase } from "./appraisal-types";
import {
  CURRENT_YEAR,
  FALLBACK_RATING_SCALE,
  FALLBACK_PHASES,
  TABS,
} from "./appraisal-constants";
import { CycleSetupPanel } from "./CycleSetupPanel";
import { GoalsPanel } from "./GoalsPanel";
import { RatingScalePanel } from "./RatingScalePanel";
import { PhasesPanel } from "./PhasesPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ManagerRatingsPanel } from "./ManagerRatingsPanel";

// ── Main Component ─────────────────────────────────────────────────────────
export default function AppraisalTab() {
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]["id"]>("cycle");
  const [saved, setSaved] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  // Job codes configured for this cycle — NOT hardcoded
  const [jobCodes, setJobCodes] = useState<string[]>([]);
  const [selectedJobCode, setSelectedJobCode] = useState<string>("");

  // Active company job codes fetched from API for the KPI-config dropdown
  const { company } = useAuth();
  const [availableJobCodes, setAvailableJobCodes] = useState<JobCode[]>([]);

  // Fetch active company job codes from API
  useEffect(() => {
    const fetchJobCodes = async () => {
      if (!company?.id) return;
      try {
        const codes = await jobCodeService.getActive();
        setAvailableJobCodes(codes.filter((c) => c.active !== false));
      } catch (err) {
        console.error("Failed to fetch job codes:", err);
      }
    };
    fetchJobCodes();
  }, [company?.id]);

  const [cycleConfig, setCycleConfig] = useState<CycleConfig>({
    appraisalYear: String(CURRENT_YEAR),
    appraisalName: `FY${CURRENT_YEAR} Annual Performance Appraisal`,
    startMonth: "January",
    endMonth: "December",
    minGoals: 3,
    maxGoals: 7,
    enableSelfAssessment: true,
    enableMidYear: true,
    enablePIP: true,
    status: "DRAFT",
  });

  // Goals keyed by job code — populated from backend, starts empty
  const [goalsByJobCode, setGoalsByJobCode] = useState<Record<string, Goal[]>>(
    {},
  );
  const [ratingScale, setRatingScale] = useState<RatingScale[]>(
    FALLBACK_RATING_SCALE,
  );
  const [phases, setPhases] = useState<Phase[]>(FALLBACK_PHASES);

  // All cycles for the selected year (multiple cycles per year are supported)
  const [cyclesForYear, setCyclesForYear] = useState<AppraisalConfigResponse[]>(
    [],
  );

  // Load one cycle into the editor
  function populateFromCfg(cfg: AppraisalConfigResponse) {
    setCycleConfig((p) => ({
      ...p,
      id: cfg.id,
      appraisalName: cfg.cycleName || p.appraisalName,
      startMonth: cfg.startMonth || p.startMonth,
      endMonth: cfg.endMonth || p.endMonth,
      minGoals: cfg.minGoals ?? p.minGoals,
      maxGoals: cfg.maxGoals ?? p.maxGoals,
      enableSelfAssessment: cfg.enableSelfAssessment ?? p.enableSelfAssessment,
      enableMidYear: cfg.enableMidYear ?? p.enableMidYear,
      enablePIP: cfg.enablePIP ?? p.enablePIP,
      status: cfg.status || p.status,
    }));

    if (cfg.ratingScale && cfg.ratingScale.length > 0) {
      setRatingScale(cfg.ratingScale);
    }
    if (cfg.phases && cfg.phases.length > 0) {
      setPhases(
        cfg.phases.map((ph: any) => ({
          id: ph.id || "",
          label: ph.label || "",
          icon: ph.icon || "",
          description: ph.description || "",
          startDate: ph.startDate || "",
          endDate: ph.endDate || "",
          enabled: ph.enabled ?? true,
        })),
      );
    }

    if (cfg.jobConfigs && cfg.jobConfigs.length > 0) {
      const codes = cfg.jobConfigs.map((r: any) => r.jobCode);
      setJobCodes(codes);
      setSelectedJobCode(codes[0] || "");
      const map: Record<string, Goal[]> = {};
      cfg.jobConfigs.forEach((r: any) => {
        map[r.jobCode] = (r.goals || []).map((g: any, i: number) => ({
          id: g.goalId || i + 1,
          kpi: g.kpi || "",
          description: g.description || "",
          weight: g.weight || 0,
          active: true,
        }));
      });
      setGoalsByJobCode(map);
    } else {
      setGoalsByJobCode({});
      setJobCodes([]);
      setSelectedJobCode("");
    }
    setSaved(false);
  }

  // Reset the editor to a blank, unsaved new cycle (keeps the current year)
  function resetEditorForNew() {
    setCycleConfig((p) => ({
      ...p,
      id: undefined,
      appraisalName: "",
      status: "DRAFT",
    }));
    setGoalsByJobCode({});
    setJobCodes([]);
    setSelectedJobCode("");
    setSaved(false);
  }

  // Load the cycle list for a year and select one (prefer a specific id)
  async function refreshCycles(year: number, preferId?: number) {
    setConfigLoading(true);
    try {
      const list = await appraisalConfigService.listByYear(year);
      setCyclesForYear(list);
      const pick =
        (preferId && list.find((c) => c.id === preferId)) || list[0];
      if (pick) populateFromCfg(pick);
      else resetEditorForNew();
    } catch {
      setCyclesForYear([]);
      resetEditorForNew();
    } finally {
      setConfigLoading(false);
    }
  }

  // ── Load cycles when the year changes ──
  useEffect(() => {
    const year = parseInt(cycleConfig.appraisalYear);
    if (!year) return;
    void refreshCycles(year, cycleConfig.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleConfig.appraisalYear]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    if (type === "error") toast.error(msg);
    else toast.success(msg);
  }

  function buildPayload() {
    return {
      year: parseInt(cycleConfig.appraisalYear),
      cycleName: cycleConfig.appraisalName,
      startMonth: cycleConfig.startMonth,
      endMonth: cycleConfig.endMonth,
      minGoals: cycleConfig.minGoals,
      maxGoals: cycleConfig.maxGoals,
      enableSelfAssessment: cycleConfig.enableSelfAssessment,
      enableMidYear: cycleConfig.enableMidYear,
      enablePIP: cycleConfig.enablePIP,
      jobConfigs: jobCodes.map((jobCode) => ({
        jobCode,
        goals: (goalsByJobCode[jobCode] || [])
          .filter((g) => g.active)
          .map((g) => ({
            kpi: g.kpi,
            description: g.description,
            weight: g.weight,
            active: g.active,
          })),
      })),
    };
  }

  async function handleSaveDraft() {
    if (!cycleConfig.appraisalYear || !cycleConfig.appraisalName) {
      showToast("Appraisal year and name are required", "error");
      setActiveTab("cycle");
      return;
    }
    const invalid = jobCodes.find((code) => {
      const active = (goalsByJobCode[code] || []).filter((g) => g.active);
      const total = active.reduce((s, g) => s + (g.weight || 0), 0);
      return active.length > 0 && total !== 100;
    });
    if (invalid) {
      showToast(`Goal weights for "${invalid}" must total 100%`, "error");
      setActiveTab("goals");
      setSelectedJobCode(invalid);
      return;
    }
    try {
      const payload = buildPayload();
      const result = cycleConfig.id
        ? await appraisalConfigService.update(cycleConfig.id, payload)
        : await appraisalConfigService.create(payload);
      setCycleConfig((p) => ({ ...p, id: result.id, status: result.status }));
      setSaved(true);
      showToast("Configuration saved as draft ✓");
      await refreshCycles(parseInt(cycleConfig.appraisalYear), result.id);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Failed to save configuration",
        "error",
      );
    }
  }

  async function handleSaveAndActivate() {
    if (!cycleConfig.appraisalYear || !cycleConfig.appraisalName) {
      showToast("Appraisal year and name are required", "error");
      setActiveTab("cycle");
      return;
    }
    const invalid = jobCodes.find((code) => {
      const active = (goalsByJobCode[code] || []).filter((g) => g.active);
      const total = active.reduce((s, g) => s + (g.weight || 0), 0);
      return active.length > 0 && total !== 100;
    });
    if (invalid) {
      showToast(`Goal weights for "${invalid}" must total 100%`, "error");
      setActiveTab("goals");
      setSelectedJobCode(invalid);
      return;
    }
    try {
      const payload = buildPayload();
      const savedCfg = cycleConfig.id
        ? await appraisalConfigService.update(cycleConfig.id, payload)
        : await appraisalConfigService.create(payload);
      const result = await appraisalConfigService.activate(savedCfg.id);
      setCycleConfig((p) => ({ ...p, id: result.id, status: result.status }));
      setSaved(true);
      showToast("Configuration saved and activated! 🎉");
      await refreshCycles(parseInt(cycleConfig.appraisalYear), result.id);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to activate", "error");
    }
  }

  async function handleActivate() {
    if (!cycleConfig.id) return;
    try {
      const result = await appraisalConfigService.activate(cycleConfig.id);
      setCycleConfig((p) => ({ ...p, status: result.status }));
      showToast("Appraisal configuration activated! ✓");
      await refreshCycles(parseInt(cycleConfig.appraisalYear), result.id);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to activate", "error");
    }
  }

  async function handleClose() {
    if (!cycleConfig.id) return;
    try {
      const result = await appraisalConfigService.close(cycleConfig.id);
      setCycleConfig((p) => ({ ...p, status: result.status }));
      showToast("Appraisal configuration closed ✓");
      await refreshCycles(parseInt(cycleConfig.appraisalYear), result.id);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to close", "error");
    }
  }

  // ── Add a new job code ──
  function handleAddJobCode(jobCode: string) {
    if (!jobCode || jobCodes.includes(jobCode)) return;
    setJobCodes((p) => [...p, jobCode]);
    setGoalsByJobCode((p) => ({ ...p, [jobCode]: [] }));
    setSelectedJobCode(jobCode);
  }

  // ── Remove a job code ──
  function handleRemoveJobCode(jobCode: string) {
    setJobCodes((p) => p.filter((c) => c !== jobCode));
    setGoalsByJobCode((p) => {
      const next = { ...p };
      delete next[jobCode];
      return next;
    });
    setSelectedJobCode((prev) =>
      prev === jobCode ? jobCodes.filter((c) => c !== jobCode)[0] || "" : prev,
    );
  }

  const panels = {
    cycle: <CycleSetupPanel config={cycleConfig} setConfig={setCycleConfig} />,
    goals: (
      <GoalsPanel
        goalsByJobCode={goalsByJobCode}
        setGoalsByJobCode={setGoalsByJobCode}
        jobCodes={jobCodes}
        selectedJobCode={selectedJobCode}
        setSelectedJobCode={setSelectedJobCode}
        maxGoals={cycleConfig.maxGoals}
        minGoals={cycleConfig.minGoals}
        onAddJobCode={handleAddJobCode}
        onRemoveJobCode={handleRemoveJobCode}
        availableJobCodes={availableJobCodes}
      />
    ),
    ratings: (
      <RatingScalePanel
        ratingScale={ratingScale}
        setRatingScale={setRatingScale}
      />
    ),
    phases: <PhasesPanel phases={phases} setPhases={setPhases} />,
    manager: <ManagerRatingsPanel ratingScale={ratingScale} />,
    preview: (
      <PreviewPanel
        config={cycleConfig}
        goalsByJobCode={goalsByJobCode}
        jobCodes={jobCodes}
        ratingScale={ratingScale}
        phases={phases}
        saved={saved}
        onSave={handleSaveAndActivate}
      />
    ),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}

      <SecondaryPageHeader
        title="Appraisal Configuration"
        description="Configure the appraisal cycle"
        icon={<Settings className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-3">
            {cycleConfig.status === "CLOSED" && (
              <Button
                variant="outline"
                onClick={handleActivate}
                className="border-green-200 text-green-600 hover:bg-green-50"
              >
                Activate
              </Button>
            )}
            {cycleConfig.status === "ACTIVE" && (
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Close
              </Button>
            )}
            {saved && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" /> Saved
              </Badge>
            )}
            <Button
              onClick={handleSaveDraft}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Save Configuration
            </Button>
          </div>
        }
      />

      {/* Loading state */}
      {configLoading && (
        <div className="text-center py-6">
          <div className="animate-spin w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            Loading configuration from backend...
          </p>
        </div>
      )}

      {/* Cycle selector — multiple cycles can run per year */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 p-3">
        <span className="text-sm font-semibold text-slate-600">Cycle:</span>
        <select
          value={cycleConfig.id ?? "new"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "new") {
              resetEditorForNew();
              setActiveTab("cycle");
              return;
            }
            const cfg = cyclesForYear.find((c) => c.id === Number(v));
            if (cfg) populateFromCfg(cfg);
          }}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm min-w-[240px]"
        >
          {cyclesForYear.length === 0 && (
            <option value="new">No cycles yet — create one</option>
          )}
          {cyclesForYear.map((c) => (
            <option key={c.id} value={c.id}>
              {c.cycleName} · {c.status}
            </option>
          ))}
          {cyclesForYear.length > 0 && (
            <option value="new">➕ New cycle…</option>
          )}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetEditorForNew();
            setActiveTab("cycle");
          }}
        >
          + New cycle
        </Button>
        <span className="text-xs text-slate-400">
          {cyclesForYear.length} cycle{cyclesForYear.length === 1 ? "" : "s"} in{" "}
          {cycleConfig.appraisalYear}
        </span>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab, i) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-none cursor-pointer transition-all ${
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    : "bg-transparent text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      active
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {tab.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel */}
      <div className="min-h-[400px]">{panels[activeTab]}</div>

      {/* Bottom Nav */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const i = TABS.findIndex((t) => t.id === activeTab);
            if (i > 0) setActiveTab(TABS[i - 1].id);
          }}
          disabled={activeTab === TABS[0].id}
        >
          ← Previous
        </Button>
        {activeTab !== "preview" ? (
          <Button
            onClick={() => {
              const i = TABS.findIndex((t) => t.id === activeTab);
              if (i < TABS.length - 1) setActiveTab(TABS[i + 1].id);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Next →
          </Button>
        ) : (
          <Button
            onClick={handleSaveAndActivate}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
          >
            ✓ Save & Activate Configuration
          </Button>
        )}
      </div>
    </div>
  );
}
