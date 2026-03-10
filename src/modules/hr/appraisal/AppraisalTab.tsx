import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, CheckCircle, Users, Star, Clock, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { appraisalConfigService } from "@/service/appraisalConfigService";
import { appraisalService } from "@/service/appraisalService";
import { useAuth } from "@/context/AuthContext";
import { roleService } from "@/service/roleService";

// ── Constants (UI only, no business data) ─────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

// Default rating scale — purely for display until backend returns one
const FALLBACK_RATING_SCALE: RatingScale[] = [
  { score: 5, label: "Exceptional",           definition: "Consistently exceeds all expectations with outstanding results." },
  { score: 4, label: "Exceeds Expectations",  definition: "Regularly surpasses goals and competency requirements." },
  { score: 3, label: "Meets Expectations",    definition: "Fully meets all goals and competency standards." },
  { score: 2, label: "Needs Improvement",     definition: "Partially meets goals. Specific development actions required." },
  { score: 1, label: "Unsatisfactory",        definition: "Fails to meet minimum requirements. PIP triggered." },
];

const FALLBACK_PHASES: Phase[] = [
  { id: "goal-setting",   label: "Goal Setting",     icon: "🎯", description: "HR defines SMART goals per role.",                        startDate: `${CURRENT_YEAR}-01-01`, endDate: `${CURRENT_YEAR}-01-31`, enabled: true },
  { id: "mid-year",       label: "Mid-Year Review",  icon: "📊", description: "Progress check-in and goal adjustments.",                startDate: `${CURRENT_YEAR}-06-01`, endDate: `${CURRENT_YEAR}-06-30`, enabled: true },
  { id: "self-assessment",label: "Self-Assessment",  icon: "📝", description: "Employee rates themselves against KPIs.",                 startDate: `${CURRENT_YEAR}-11-01`, endDate: `${CURRENT_YEAR}-11-15`, enabled: true },
  { id: "manager-review", label: "Manager Review",   icon: "👤", description: "Manager completes ratings with self-assessment visible.", startDate: `${CURRENT_YEAR}-11-15`, endDate: `${CURRENT_YEAR}-12-05`, enabled: true },
  { id: "review-meeting", label: "Review Meeting",   icon: "🤝", description: "Final one-on-one, sign-off and evaluation locked.",      startDate: `${CURRENT_YEAR}-12-15`, endDate: `${CURRENT_YEAR}-12-31`, enabled: true },
];

const TABS = [
  { id: "cycle",   label: "Cycle Setup",      icon: "📅" },
  { id: "goals",   label: "Goals & KPIs",     icon: "🎯" },
  { id: "ratings", label: "Rating Scale",     icon: "⭐" },
  { id: "phases",  label: "Timeline Phases",  icon: "🗓️" },
  { id: "manager", label: "Manager Ratings",  icon: "👤" },
  { id: "preview", label: "Preview & Save",   icon: "✅" },
] as const;

// ── Types ──────────────────────────────────────────────────────────────────
interface Goal {
  id: number;
  kpi: string;
  description: string;
  weight: number;
  active: boolean;
}

interface CycleConfig {
  id?: number;
  appraisalYear: string;
  appraisalName: string;
  startMonth: string;
  endMonth: string;
  minGoals: number;
  maxGoals: number;
  enableSelfAssessment: boolean;
  enableMidYear: boolean;
  enablePIP: boolean;
  status: string;
}

interface RatingScale {
  score: number;
  label: string;
  definition: string;
}

interface Phase {
  id: string;
  label: string;
  icon: string;
  description: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
}

interface EmployeeAppraisal {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeRole: string;
  year: number;
  status: string;
  overallScore?: number | null;
  goals: GoalWithRating[];
  employeeComments?: string;
  managerComments?: string;
}

interface GoalWithRating {
  goalId: number;
  kpi: string;
  description: string;
  weight: number;
  selfRating: number | null | undefined;
  managerRating: number | null | undefined;
  selfComment: string;
  managerComment: string;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AppraisalTab() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("cycle");
  const [saved, setSaved] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  // Roles derived from backend config — NOT hardcoded
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  
  // Company roles fetched from API
  const { company } = useAuth();
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Fetch company roles from API
  useEffect(() => {
    const fetchCompanyRoles = async () => {
      if (!company?.id) return;
      try {
        const companyRoles = await roleService.getRoles(company.id);
        const roleNames = companyRoles
          .filter(r => r.active !== false)
          .map(r => r.name);
        setAvailableRoles(roleNames);
      } catch (err) {
        console.error("Failed to fetch company roles:", err);
      }
    };
    fetchCompanyRoles();
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

  // Goals keyed by roleName — populated from backend, starts empty
  const [goalsByRole, setGoalsByRole] = useState<Record<string, Goal[]>>({});
  const [ratingScale, setRatingScale] = useState<RatingScale[]>(FALLBACK_RATING_SCALE);
  const [phases, setPhases] = useState<Phase[]>(FALLBACK_PHASES);

  // ── Load config from backend when year changes ──
  useEffect(() => {
    const year = parseInt(cycleConfig.appraisalYear);
    if (!year) return;

    setConfigLoading(true);
    appraisalConfigService.getByYear(year)
      .then(cfg => {
        if (!cfg) {
          // No config for this year — reset to empty (no mock data)
          setGoalsByRole({});
          setRoles([]);
          setSelectedRole("");
          return;
        }

        // Populate cycle config from backend
        setCycleConfig(p => ({
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

        // Populate rating scale from backend if available
        if (cfg.ratingScale && cfg.ratingScale.length > 0) {
          setRatingScale(cfg.ratingScale);
        }

        // Populate phases from backend if available
        if (cfg.phases && cfg.phases.length > 0) {
          setPhases(cfg.phases.map((ph: any) => ({
            id: ph.id || "",
            label: ph.label || "",
            icon: ph.icon || "",
            description: ph.description || "",
            startDate: ph.startDate || "",
            endDate: ph.endDate || "",
            enabled: ph.enabled ?? true,
          })));
        }

        // Populate roles + goals from backend — NO mock data fallback
        if (cfg.roles && cfg.roles.length > 0) {
          const roleNames = cfg.roles.map((r: any) => r.roleName);
          setRoles(roleNames);
          setSelectedRole(roleNames[0] || "");

          const map: Record<string, Goal[]> = {};
          cfg.roles.forEach((r: any) => {
            map[r.roleName] = (r.goals || []).map((g: any, i: number) => ({
              id: g.goalId || (i + 1),
              kpi: g.kpi || "",
              description: g.description || "",
              weight: g.weight || 0,
              active: true,
            }));
          });
          setGoalsByRole(map);
        } else {
          setGoalsByRole({});
          setRoles([]);
          setSelectedRole("");
        }
      })
      .catch(() => {
        // No config found for this year — start fresh, no mock data
        setGoalsByRole({});
        setRoles([]);
        setSelectedRole("");
      })
      .finally(() => setConfigLoading(false));
  }, [cycleConfig.appraisalYear]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    type === "error" ? toast.error(msg) : toast.success(msg);
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
      roles: roles.map(roleName => ({
        roleName,
        goals: (goalsByRole[roleName] || [])
          .filter(g => g.active)
          .map(g => ({ kpi: g.kpi, description: g.description, weight: g.weight, active: g.active })),
      })),
    };
  }

  async function handleSaveDraft() {
    if (!cycleConfig.appraisalYear || !cycleConfig.appraisalName) {
      showToast("Appraisal year and name are required", "error");
      setActiveTab("cycle");
      return;
    }
    const invalid = roles.find(role => {
      const active = (goalsByRole[role] || []).filter(g => g.active);
      const total  = active.reduce((s, g) => s + (g.weight || 0), 0);
      return active.length > 0 && total !== 100;
    });
    if (invalid) {
      showToast(`Goal weights for "${invalid}" must total 100%`, "error");
      setActiveTab("goals");
      setSelectedRole(invalid);
      return;
    }
    try {
      const result = await appraisalConfigService.save(buildPayload());
      setCycleConfig(p => ({ ...p, id: result.id, status: result.status }));
      setSaved(true);
      showToast("Configuration saved as draft ✓");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to save configuration", "error");
    }
  }

  async function handleSaveAndActivate() {
    if (!cycleConfig.appraisalYear || !cycleConfig.appraisalName) {
      showToast("Appraisal year and name are required", "error");
      setActiveTab("cycle");
      return;
    }
    const invalid = roles.find(role => {
      const active = (goalsByRole[role] || []).filter(g => g.active);
      const total  = active.reduce((s, g) => s + (g.weight || 0), 0);
      return active.length > 0 && total !== 100;
    });
    if (invalid) {
      showToast(`Goal weights for "${invalid}" must total 100%`, "error");
      setActiveTab("goals");
      setSelectedRole(invalid);
      return;
    }
    try {
      const result = await appraisalConfigService.saveAndActivate(buildPayload());
      setCycleConfig(p => ({ ...p, id: result.id, status: result.status }));
      setSaved(true);
      showToast("Configuration saved and activated! 🎉");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to activate", "error");
    }
  }

  async function handleActivate() {
    if (!cycleConfig.id) return;
    try {
      const result = await appraisalConfigService.activate(cycleConfig.id);
      setCycleConfig(p => ({ ...p, status: result.status }));
      showToast("Appraisal configuration activated! ✓");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to activate", "error");
    }
  }

  async function handleClose() {
    if (!cycleConfig.id) return;
    try {
      const result = await appraisalConfigService.close(cycleConfig.id);
      setCycleConfig(p => ({ ...p, status: result.status }));
      showToast("Appraisal configuration closed ✓");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to close", "error");
    }
  }

  // ── Add a new role ──
  function handleAddRole(roleName: string) {
    if (!roleName || roles.includes(roleName)) return;
    setRoles(p => [...p, roleName]);
    setGoalsByRole(p => ({ ...p, [roleName]: [] }));
    setSelectedRole(roleName);
  }

  // ── Remove a role ──
  function handleRemoveRole(roleName: string) {
    setRoles(p => p.filter(r => r !== roleName));
    setGoalsByRole(p => {
      const next = { ...p };
      delete next[roleName];
      return next;
    });
    setSelectedRole(prev => prev === roleName ? (roles.filter(r => r !== roleName)[0] || "") : prev);
  }

const panels = {
    cycle:   <CycleSetupPanel config={cycleConfig} setConfig={setCycleConfig} />,
    goals:   <GoalsPanel
               goalsByRole={goalsByRole}
               setGoalsByRole={setGoalsByRole}
               roles={roles}
               selectedRole={selectedRole}
               setSelectedRole={setSelectedRole}
               maxGoals={cycleConfig.maxGoals}
               minGoals={cycleConfig.minGoals}
               onAddRole={handleAddRole}
               onRemoveRole={handleRemoveRole}
               availableRoles={availableRoles}
             />,
    ratings: <RatingScalePanel ratingScale={ratingScale} setRatingScale={setRatingScale} />,
    phases:  <PhasesPanel phases={phases} setPhases={setPhases} />,
    manager: <ManagerRatingsPanel ratingScale={ratingScale} />,
    preview: <PreviewPanel
               config={cycleConfig}
               goalsByRole={goalsByRole}
               roles={roles}
               ratingScale={ratingScale}
               phases={phases}
               saved={saved}
               onSave={handleSaveAndActivate}
             />,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Appraisal Configuration</h2>
              <p className="text-sm text-slate-500">HR Settings · Configure the appraisal cycle</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {cycleConfig.status === "CLOSED" && (
              <Button variant="outline" onClick={handleActivate}
                className="border-green-200 text-green-600 hover:bg-green-50">
                Activate
              </Button>
            )}
            {cycleConfig.status === "ACTIVE" && (
              <Button variant="outline" onClick={handleClose}
                className="border-red-200 text-red-600 hover:bg-red-50">
                Close
              </Button>
            )}
            {saved && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" /> Saved
              </Badge>
            )}
            <Button onClick={handleSaveDraft}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {configLoading && (
        <div className="text-center py-6">
          <div className="animate-spin w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading configuration from backend...</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab, i) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-none cursor-pointer transition-all ${
                  active ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" : "bg-transparent text-slate-500 hover:bg-slate-50"
                }`}>
                <span>{tab.icon}</span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-400"
                  }`}>{i + 1}</span>
                  <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
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
        <Button variant="outline"
          onClick={() => { const i = TABS.findIndex(t => t.id === activeTab); if (i > 0) setActiveTab(TABS[i - 1].id); }}
          disabled={activeTab === TABS[0].id}>
          ← Previous
        </Button>
        {activeTab !== "preview" ? (
          <Button onClick={() => { const i = TABS.findIndex(t => t.id === activeTab); if (i < TABS.length - 1) setActiveTab(TABS[i + 1].id); }}
            className="bg-indigo-600 hover:bg-indigo-700">
            Next →
          </Button>
        ) : (
          <Button onClick={handleSaveAndActivate}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
            ✓ Save & Activate Configuration
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Panel 1: Cycle Setup ───────────────────────────────────────────────────
function CycleSetupPanel({ config, setConfig }: { config: CycleConfig; setConfig: React.Dispatch<React.SetStateAction<CycleConfig>> }) {
  const upd = (k: keyof CycleConfig, v: string | number | boolean) => setConfig(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📅</span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Appraisal Cycle Setup</h3>
              <p className="text-sm text-slate-500">Define the appraisal year and basic configuration.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Appraisal Year *</label>
              <Select value={config.appraisalYear} onValueChange={(v) => upd("appraisalYear", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Cycle Name *</label>
              <Input value={config.appraisalName} onChange={e => upd("appraisalName", e.target.value)} placeholder="e.g. FY2025 Annual Performance Appraisal" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Cycle Start Month</label>
              <Select value={config.startMonth} onValueChange={(v) => upd("startMonth", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Cycle End Month</label>
              <Select value={config.endMonth} onValueChange={(v) => upd("endMonth", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Min Goals per Employee</label>
              <Input type="number" value={config.minGoals} onChange={e => upd("minGoals", +e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Max Goals per Employee</label>
              <Input type="number" value={config.maxGoals} onChange={e => upd("maxGoals", +e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔧</span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Module Settings</h3>
              <p className="text-sm text-slate-500">Enable or disable optional appraisal modules.</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { key: "enableSelfAssessment" as const, label: "Self-Assessment Module", desc: "Allow employees to rate themselves before the manager review." },
              { key: "enableMidYear"        as const, label: "Mid-Year Review",        desc: "Include a mid-year progress check between manager and employee." },
              { key: "enablePIP"            as const, label: "PIP Auto-Trigger",       desc: "Automatically initiate a PIP when rating is 1 (Unsatisfactory)." },
            ].map(opt => (
              <div key={opt.key} onClick={() => upd(opt.key, !config[opt.key])}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  config[opt.key] ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-white"
                }`}>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${config[opt.key] ? "bg-indigo-600" : "bg-slate-300"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${config[opt.key] ? "left-5" : "left-0.5"}`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-slate-900">{opt.label}</div>
                  <div className="text-xs text-slate-500">{opt.desc}</div>
                </div>
                <Badge className={config[opt.key] ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}>
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

// ── Panel 2: Goals & KPIs ──────────────────────────────────────────────────
const ALL_POSSIBLE_ROLES = [
  "SUPER_ADMIN","USER","ADMIN","HR","FINANCE_MANAGER","ACCOUNTANT","AP_AR_CLERK","CONTROLLER","AUDITOR_EXTERNAL",
  "Software Engineer","Product Manager","UX Designer","Data Analyst","DevOps Engineer","HR Manager","Finance Analyst","Sales Executive",
];

function GoalsPanel({
  goalsByRole, setGoalsByRole, roles, selectedRole, setSelectedRole,
  maxGoals, minGoals, onAddRole, onRemoveRole, availableRoles = [],
}: {
  goalsByRole: Record<string, Goal[]>;
  setGoalsByRole: React.Dispatch<React.SetStateAction<Record<string, Goal[]>>>;
  roles: string[];
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  maxGoals: number;
  minGoals: number;
  onAddRole: (role: string) => void;
  onRemoveRole: (role: string) => void;
  availableRoles?: string[];
}) {
  const [newRole, setNewRole] = useState("");
  const goals       = goalsByRole[selectedRole] || [];
  const activeGoals = goals.filter(g => g.active);
  const totalWeight = activeGoals.reduce((s, g) => s + (g.weight || 0), 0);

  function addGoal() {
    if (activeGoals.length >= maxGoals) return;
    setGoalsByRole(p => ({
      ...p,
      [selectedRole]: [...(p[selectedRole] || []), { id: Date.now(), kpi: "", description: "", weight: 0, active: true }],
    }));
  }

  function removeGoal(id: number) {
    if (activeGoals.length <= minGoals) return;
    setGoalsByRole(p => ({ ...p, [selectedRole]: p[selectedRole].map(g => g.id === id ? { ...g, active: false } : g) }));
  }

  function updateGoal(id: number, field: keyof Goal, val: string | number) {
    setGoalsByRole(p => ({ ...p, [selectedRole]: p[selectedRole].map(g => g.id === id ? { ...g, [field]: val } : g) }));
  }

  function autoBalance() {
    const count = activeGoals.length;
    if (!count) return;
    const base = Math.floor(100 / count);
    const rem  = 100 - base * count;
    setGoalsByRole(p => ({
      ...p,
      [selectedRole]: p[selectedRole].map(g => {
        if (!g.active) return g;
        const idx = activeGoals.findIndex(a => a.id === g.id);
        return { ...g, weight: base + (idx === activeGoals.length - 1 ? rem : 0) };
      }),
    }));
  }

  // Combine company roles from API with fallback roles
  const allRoles = [...availableRoles, ...ALL_POSSIBLE_ROLES];
  const roleOptions = Array.from(new Set(allRoles)).filter(r => !roles.includes(r));

  return (
    <div className="flex gap-6">
      {/* Role Sidebar */}
      <div className="w-64 shrink-0 space-y-3">
        <Card className="p-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">
            Configured Roles ({roles.length})
          </div>

          {roles.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              No roles yet.<br />Add a role below.
            </div>
          ) : (
            roles.map(role => {
              const rg = (goalsByRole[role] || []).filter(g => g.active);
              const rw = rg.reduce((s, g) => s + (g.weight || 0), 0);
              const ok = rg.length > 0 && rw === 100;
              return (
                <div key={role} onClick={() => setSelectedRole(role)}
                  className={`p-3 rounded-lg cursor-pointer mb-1 transition-all group ${
                    selectedRole === role ? "bg-indigo-50 border border-indigo-200" : "hover:bg-slate-50 border border-transparent"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm truncate" style={{ color: selectedRole === role ? "#4f46e5" : "#1e293b" }}>
                      {role}
                    </div>
                    <button onClick={e => { e.stopPropagation(); onRemoveRole(role); }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">{rg.length} KPIs</span>
                    <span className="text-xs font-bold" style={{ color: ok ? "#059669" : rw > 0 ? "#d97706" : "#94a3b8" }}>
                      {rw > 0 ? `${rw}%` : "—"}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Add Role */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Add Role</div>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select role..." /></SelectTrigger>
              <SelectContent>
              {roleOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                <SelectItem value="__custom__">+ Custom role...</SelectItem>
              </SelectContent>
            </Select>
            {newRole === "__custom__" && (
              <Input className="mt-2 h-8 text-xs" placeholder="Type role name..."
                onKeyDown={e => { if (e.key === "Enter") { onAddRole((e.target as HTMLInputElement).value); setNewRole(""); } }} />
            )}
            {newRole && newRole !== "__custom__" && (
              <Button size="sm" className="w-full mt-2 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                onClick={() => { onAddRole(newRole); setNewRole(""); }}>
                + Add {newRole}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Goals Editor */}
      <div className="flex-1">
        {!selectedRole ? (
          <Card>
            <CardContent className="pt-6 text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">🎯</div>
              <p className="font-medium">No role selected</p>
              <p className="text-sm mt-1">Add a role from the sidebar to configure KPIs</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎯</span>
                    <h3 className="text-base font-bold text-slate-900">Goals for: {selectedRole}</h3>
                  </div>
                  <p className="text-sm text-slate-500">Min {minGoals}, Max {maxGoals} goals. Weights must total 100%.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={autoBalance}>⚡ Auto Balance</Button>
                  <Button size="sm" onClick={addGoal} disabled={activeGoals.length >= maxGoals}
                    className={activeGoals.length >= maxGoals ? "bg-slate-100 text-slate-400" : "bg-indigo-600 hover:bg-indigo-700"}>
                    + Add KPI
                  </Button>
                </div>
              </div>

              {/* Weight bar */}
              <div className="bg-slate-50 rounded-lg p-3 mb-5 flex items-center gap-4">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${totalWeight === 100 ? "bg-green-500" : totalWeight > 100 ? "bg-red-500" : "bg-indigo-500"}`}
                    style={{ width: `${Math.min(totalWeight, 100)}%` }} />
                </div>
                <div className="font-bold text-sm" style={{ color: totalWeight === 100 ? "#059669" : totalWeight > 100 ? "#dc2626" : "#6366f1" }}>
                  {totalWeight}%
                </div>
                <Badge className={totalWeight === 100 ? "bg-green-100 text-green-700" : totalWeight > 100 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                  {totalWeight === 100 ? "✓ Balanced" : totalWeight > 100 ? "Over 100%" : `${100 - totalWeight}% remaining`}
                </Badge>
              </div>

              <div className="space-y-3">
                {activeGoals.map((goal, idx) => (
                  <div key={goal.id} className="grid grid-cols-[32px_1fr_2fr_80px_36px] gap-3 items-start p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">KPI Name</label>
                      <Input value={goal.kpi} onChange={e => updateGoal(goal.id, "kpi", e.target.value)} placeholder="e.g. Code Quality" className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Success Criteria</label>
                      <Input value={goal.description} onChange={e => updateGoal(goal.id, "description", e.target.value)} placeholder="Measurable target..." className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Weight %</label>
                      <Input type="number" value={goal.weight} onChange={e => updateGoal(goal.id, "weight", +e.target.value)} className="h-9 text-center font-bold text-indigo-600" />
                    </div>
                    <button onClick={() => removeGoal(goal.id)} disabled={activeGoals.length <= minGoals}
                      className={`mt-6 w-9 h-9 rounded-lg border-none flex items-center justify-center text-lg ${
                        activeGoals.length <= minGoals ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer"
                      }`}>✕</button>
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

// ── Panel 3: Rating Scale ──────────────────────────────────────────────────
function RatingScalePanel({ ratingScale, setRatingScale }: {
  ratingScale: RatingScale[];
  setRatingScale: React.Dispatch<React.SetStateAction<RatingScale[]>>;
}) {
  function update(score: number, field: keyof RatingScale, val: string) {
    setRatingScale(p => p.map(r => r.score === score ? { ...r, [field]: val } : r));
  }

  const colors: Record<number, { bg: string; border: string; header: string }> = {
    5: { bg: "bg-green-50",  border: "border-green-200",  header: "bg-green-500"  },
    4: { bg: "bg-blue-50",   border: "border-blue-200",   header: "bg-blue-500"   },
    3: { bg: "bg-purple-50", border: "border-purple-200", header: "bg-purple-500" },
    2: { bg: "bg-amber-50",  border: "border-amber-200",  header: "bg-amber-500"  },
    1: { bg: "bg-red-50",    border: "border-red-200",    header: "bg-red-500"    },
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-lg">⭐</span>
          <div>
            <h3 className="text-base font-bold text-slate-900">Rating Scale Configuration</h3>
            <p className="text-sm text-slate-500">Define what each score means throughout the appraisal process.</p>
          </div>
        </div>
        <div className="space-y-4">
          {ratingScale.map(r => {
            const c = colors[r.score] || { bg: "bg-slate-50", border: "border-slate-200", header: "bg-slate-500" };
            return (
              <div key={r.score} className={`grid grid-cols-[60px_1fr_2fr] gap-4 p-5 rounded-xl border-2 ${c.bg} ${c.border}`}>
                <div className={`w-14 h-14 rounded-xl ${c.header} text-white flex items-center justify-center text-2xl font-black`}>{r.score}</div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Label</label>
                  <Input value={r.label} onChange={e => update(r.score, "label", e.target.value)} className="h-9 font-semibold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Definition</label>
                  <Textarea value={r.definition} onChange={e => update(r.score, "definition", e.target.value)} rows={2} className="resize-none" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Panel 4: Timeline Phases ───────────────────────────────────────────────
function PhasesPanel({ phases, setPhases }: { phases: Phase[]; setPhases: React.Dispatch<React.SetStateAction<Phase[]>> }) {
  function update(id: string, field: keyof Phase, val: string | boolean) {
    setPhases(p => p.map(ph => ph.id === id ? { ...ph, [field]: val } : ph));
  }

  return (
    <div className="space-y-4">
      {phases.map(phase => (
        <Card key={phase.id} className={phase.enabled ? "border-indigo-200" : "border-slate-200 opacity-60"}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${phase.enabled ? "bg-indigo-50" : "bg-slate-100"}`}>
                  {phase.icon}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{phase.label}</div>
                  <div className="text-xs text-slate-500">{phase.description}</div>
                </div>
              </div>
              <div onClick={() => update(phase.id, "enabled", !phase.enabled)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${phase.enabled ? "bg-indigo-600" : "bg-slate-300"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${phase.enabled ? "left-5" : "left-0.5"}`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label>
                <Input type="date" value={phase.startDate} onChange={e => update(phase.id, "startDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
                <Input type="date" value={phase.endDate} onChange={e => update(phase.id, "endDate", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Panel 5: Preview & Save ────────────────────────────────────────────────
function PreviewPanel({ config, goalsByRole, roles, ratingScale, phases, saved, onSave }: {
  config: CycleConfig;
  goalsByRole: Record<string, Goal[]>;
  roles: string[];
  ratingScale: RatingScale[];
  phases: Phase[];
  saved: boolean;
  onSave: () => void;
}) {
  const configuredRoles = roles.filter(r => (goalsByRole[r] || []).filter(g => g.active).length > 0).length;
  const validRoles      = roles.filter(r => {
    const ag = (goalsByRole[r] || []).filter(g => g.active);
    return ag.length > 0 && ag.reduce((s, g) => s + (g.weight || 0), 0) === 100;
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Appraisal Year",    value: config.appraisalYear,                                                       icon: "📅", color: "text-indigo-600" },
          { label: "Roles Configured",  value: `${configuredRoles}/${roles.length}`,                                       icon: "👥", color: validRoles === configuredRoles ? "text-green-600" : "text-amber-600" },
          { label: "Active Phases",     value: phases.filter(p => p.enabled).length,                                       icon: "🗓️", color: "text-blue-600" },
          { label: "Rating Levels",     value: ratingScale.length,                                                         icon: "⭐", color: "text-purple-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">{s.icon}</div>
              <div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 font-medium">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <h3 className="text-base font-bold text-slate-900">Goals by Role ({roles.length} roles)</h3>
          </div>
          {roles.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No roles configured yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roles.map(role => {
                const ag = (goalsByRole[role] || []).filter(g => g.active);
                const tw = ag.reduce((s, g) => s + (g.weight || 0), 0);
                const ok = ag.length > 0 && tw === 100;
                return (
                  <div key={role} className={`p-4 rounded-xl border-2 ${ok ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-slate-900">{role}</span>
                      <Badge className={ok ? "bg-green-100 text-green-700" : ag.length === 0 ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"}>
                        {ok ? `✓ ${ag.length} KPIs` : ag.length === 0 ? "No KPIs" : `⚠ ${tw}%`}
                      </Badge>
                    </div>
                    {ag.slice(0, 3).map(g => (
                      <div key={g.id} className="text-xs text-slate-500 flex justify-between py-0.5">
                        <span>{g.kpi || "Unnamed KPI"}</span>
                        <span className="font-semibold text-slate-400">{g.weight}%</span>
                      </div>
                    ))}
                    {ag.length > 3 && <div className="text-xs text-slate-400 mt-1">+{ag.length - 3} more</div>}
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
            <div className="text-lg font-bold text-green-600 mb-2">Configuration Saved & Active!</div>
            <div className="text-sm text-slate-500">Goal templates are published for {config.appraisalYear}.</div>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-3">🚀</div>
            <div className="text-lg font-bold text-indigo-600 mb-2">Ready to Activate</div>
            <div className="text-sm text-slate-500 mb-5">Once saved, goal templates will be published and the workflow initiated.</div>
            <Button onClick={onSave} className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-2.5">
              ✓ Save & Activate Configuration
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Panel 6: Manager Ratings ───────────────────────────────────────────────
function ManagerRatingsPanel({ ratingScale }: { ratingScale: RatingScale[] }) {
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_YEAR));
  const [appraisals, setAppraisals]     = useState<EmployeeAppraisal[]>([]);
  const [loading, setLoading]           = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [selectedEmp, setSelectedEmp]   = useState<EmployeeAppraisal | null>(null);
  const [goals, setGoals]               = useState<GoalWithRating[]>([]);
  const [managerComments, setManagerComments] = useState("");

  useEffect(() => {
    const year = parseInt(selectedYear);
    if (!year) return;
    setLoading(true);
    appraisalService.listByYear(year)
      .then(data => {
        setAppraisals((data.content || []).map((app: any) => ({
          id: app.id,
          employeeId: app.employeeId,
          employeeName: app.employeeName,
          employeeRole: app.employeeRole,
          year: app.year,
          status: app.status,
          overallScore: app.overallScore,
          goals: (app.goals || []).map((g: any) => ({
            goalId: g.goalId, kpi: g.kpi, description: g.description, weight: g.weight,
            selfRating: g.selfRating ?? null, managerRating: g.managerRating ?? null,
            selfComment: g.selfComment || "", managerComment: g.managerComment || "",
          })),
          employeeComments: app.employeeComments,
          managerComments: app.managerComments,
        })));
      })
      .catch(() => { toast.error("Failed to load appraisals"); setAppraisals([]); })
      .finally(() => setLoading(false));
  }, [selectedYear]);

  function openEmployee(app: EmployeeAppraisal) {
    setSelectedEmp(app);
    setGoals(app.goals?.map(g => ({ ...g })) || []);
    setManagerComments(app.managerComments || "");
    setShowModal(true);
  }

  function updateGoalRating(goalId: number, field: keyof GoalWithRating, value: number | string) {
    setGoals(prev => prev.map(g => g.goalId === goalId ? { ...g, [field]: value } : g));
  }

  async function submitAppraisal() {
    if (!selectedEmp) return;
    try {
      await appraisalService.submitManagerReview(selectedEmp.employeeId, selectedEmp.id, {
        goals: goals.map(g => ({ goalId: g.goalId, managerRating: g.managerRating ?? undefined, managerComment: g.managerComment })),
        managerComments,
      });
      toast.success("Manager review submitted");
      setShowModal(false);
      // Reload
      const data = await appraisalService.listByYear(parseInt(selectedYear));
      setAppraisals((data.content || []).map((app: any) => ({
        id: app.id, employeeId: app.employeeId, employeeName: app.employeeName,
        employeeRole: app.employeeRole, year: app.year, status: app.status, overallScore: app.overallScore,
        goals: (app.goals || []).map((g: any) => ({
          goalId: g.goalId, kpi: g.kpi, description: g.description, weight: g.weight,
          selfRating: g.selfRating ?? null, managerRating: g.managerRating ?? null,
          selfComment: g.selfComment || "", managerComment: g.managerComment || "",
        })),
        employeeComments: app.employeeComments, managerComments: app.managerComments,
      })));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit review");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Manager Ratings</h3>
                <p className="text-sm text-slate-500">Rate employee performance and provide feedback</p>
              </div>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">< SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading appraisals...</p>
        </div>
      ) : appraisals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-700 mb-2">No Appraisals Found</h4>
            <p className="text-slate-500">No appraisals for {selectedYear}. Employees need to submit self-assessments first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appraisals.map(app => {
            const hasManagerRating = app.goals?.some(g => g.managerRating != null);
            return (
              <Card key={app.id} className={hasManagerRating ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {app.employeeName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{app.employeeName}</h4>
                        <p className="text-sm text-slate-500">{app.employeeRole} · {app.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {app.overallScore != null && (
                        <Badge className="bg-indigo-100 text-indigo-700">Score: {app.overallScore.toFixed(2)}</Badge>
                      )}
                      {hasManagerRating
                        ? <Badge className="bg-green-100 text-green-700"><Star className="w-3 h-3 mr-1" />Rated</Badge>
                        : <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
                      }
                      <Button size="sm" onClick={() => openEmployee(app)}>
                        {hasManagerRating ? "View/Edit" : "Rate"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rate Performance — {selectedEmp?.employeeName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {goals.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No KPIs found for this employee.</div>
            ) : (
              goals.map((goal, idx) => (
                <div key={goal.goalId} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                      <span className="font-semibold text-slate-900">{goal.kpi}</span>
                    </div>
                    {goal.weight > 0 && <Badge className="bg-slate-200 text-slate-700">{goal.weight}%</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Self Rating</label>
                      <div className="flex gap-1">
                        {ratingScale.map(r => (
                          <button key={r.score} disabled
                            className={`w-8 h-8 rounded-lg text-sm font-bold ${goal.selfRating === r.score ? "bg-blue-500 text-white" : "bg-white border border-slate-200 text-slate-400"}`}>
                            {r.score}
                          </button>
                        ))}
                      </div>
                      {goal.selfComment && <p className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border">{goal.selfComment}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Manager Rating *</label>
                      <div className="flex gap-1">
                        {ratingScale.map(r => (
                          <button key={r.score} type="button" onClick={() => updateGoalRating(goal.goalId, "managerRating", r.score)}
                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                              goal.managerRating === r.score ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-orange-300"
                            }`}>
                            {r.score}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Manager Comments</label>
              <Textarea value={managerComments} onChange={e => setManagerComments(e.target.value)}
                placeholder="Provide feedback on employee performance..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={submitAppraisal} className="bg-orange-500 hover:bg-orange-600"
              disabled={goals.some(g => g.managerRating === null || g.managerRating === undefined)}>
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

