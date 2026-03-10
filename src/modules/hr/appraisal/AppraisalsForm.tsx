import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Eye, FileText, TrendingUp, MessageSquare, Calendar, Unlock } from "lucide-react";
import { useParams } from "react-router-dom";
import { appraisalService } from "@/service/appraisalService";
import { hrService } from "@/service/hr.service";
import { toast } from "sonner";
import AppraisalEditor from "./AppraisalEditor";
import { appraisalConfigService } from "@/service/appraisalConfigService";
import { displayRole } from "@/types/role";

export type AppModel = {
  id?: number | string;
  _localId?: string;
  year: number | string;
  month?: string;
  status?: string;
  goals?: {
    goalId: number;
    kpi: string;
    description: string;
    weight: number;
    selfRating?: number;
    managerRating?: number;
    selfComment?: string;
    managerComment?: string;
  }[];
  employeeComments?: string;
  managerComments?: string;
  overallScore?: number | null;
};

const MONTHS = [
  "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
  "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"
];

export default function AppraisalsForm() {
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const [items, setItems]       = useState<AppModel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [employee, setEmployee]   = useState<{
    firstName?: string; middleName?: string; lastName?: string; role?: string; companyRole?: string;
  } | null>(null);
  const [appraisalYear, setAppraisalYear] = useState<number>(new Date().getFullYear());

  // Month picker modal state
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth]     = useState<string>("");
  const [adding, setAdding]                   = useState(false);

  useEffect(() => {
    appraisalConfigService.getActive()
      .then(cfg => { if (cfg) setAppraisalYear(cfg.year); })
      .catch(() => {});
  }, []);

  const reload = useCallback(async (): Promise<void> => {
    if (!empId) return;
    try {
      const data = await appraisalService.listByEmployee(empId, 0, 100);
      setItems((data.content || []).map((d) => ({
        id: d.id,
        year: d.year ?? "",
        month: d.month ?? "",
        status: d.status ?? "",
        goals: (d.goals || []).map(g => ({
          goalId: g.goalId,
          kpi: g.kpi,
          description: g.description,
          weight: g.weight,
          selfRating: g.selfRating ?? undefined,
          managerRating: g.managerRating ?? undefined,
          selfComment: g.selfComment ?? undefined,
          managerComment: g.managerComment ?? undefined,
        })),
        employeeComments: d.employeeComments ?? "",
        managerComments: d.managerComments ?? "",
        overallScore: d.overallScore ?? null,
      })));
    } catch {
      toast.error("Failed to load appraisals");
    }
  }, [empId]);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    if (!empId) return;
    let mounted = true;
    (async () => {
      try {
        const e = await hrService.getEmployee(empId);
        if (mounted) setEmployee({
          firstName: e.firstName,
          middleName: (e as any).middleName,
          lastName: e.lastName,
          role: (e as any).role || (e as any).jobTitle || "",
          companyRole: (e as any).companyRole || "",
        });
      } catch { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [empId]);

  // Step 1: open month picker
  const handleAddClick = () => {
    setSelectedMonth("");
    setShowMonthPicker(true);
  };

  // Step 2: confirm month and call backend
  const handleConfirmAdd = async () => {
    if (!empId || !selectedMonth) {
      toast.error("Please select a month");
      return;
    }
    setAdding(true);
    try {
      await appraisalService.create(empId, appraisalYear, selectedMonth);
      toast.success(`Appraisal created for ${selectedMonth} ${appraisalYear}`);
      setShowMonthPicker(false);
      await reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create appraisal");
    } finally {
      setAdding(false);
    }
  };

  const updateItem = (idKey: string | number | undefined, patch: Partial<AppModel>) => {
    setItems((cur) =>
      cur.map((it) =>
        String(it._localId ?? it.id) === String(idKey) ? { ...it, ...patch } : it
      )
    );
  };

  const handleSave = useCallback(async (it: AppModel) => {
    if (!empId || !it.id) return;
    const appraisalId = Number(it.id);
    const status = it.status;

    try {
      if (status === "DRAFT") {
        await appraisalService.submitSelfAssessment(empId, appraisalId, {
          goals: it.goals?.map(g => ({
            goalId: g.goalId,
            selfRating: g.selfRating,
            selfComment: g.selfComment,
          })) || [],
          employeeComments: it.employeeComments,
        });
        toast.success("Self-assessment submitted ✓");
      } else if (status === "SELF_SUBMITTED") {
        await appraisalService.submitManagerReview(empId, appraisalId, {
          goals: it.goals?.map(g => ({
            goalId: g.goalId,
            managerRating: g.managerRating,
            managerComment: g.managerComment,
          })) || [],
          managerComments: it.managerComments,
        });
        toast.success("Manager review submitted ✓");
      } else if (status === "MANAGER_REVIEWED") {
        await appraisalService.lock(empId, appraisalId);
        toast.success("Appraisal locked ✓");
      } else {
        toast.error(`Cannot edit appraisal with status: ${status}`);
        return;
      }
      await reload();
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save appraisal");
    }
  }, [empId, reload]);

  const handleDelete = async (appId?: number | string) => {
    if (!empId || !confirm("Delete appraisal?")) return;
    try {
      if (appId && Number(appId)) {
        await appraisalService.removeById(empId, Number(appId));
      }
      setItems((cur) => cur.filter((it) => String(it._localId ?? it.id) !== String(appId)));
      toast.success("Appraisal deleted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    }
  };

  const handleForceDelete = async (appId?: number | string) => {
    if (!empId || !confirm("Force delete this LOCKED appraisal? This cannot be undone.")) return;
    try {
      if (appId && Number(appId)) await appraisalService.forceDelete(empId, Number(appId));
      setItems((cur) => cur.filter((it) => String(it._localId ?? it.id) !== String(appId)));
      toast.success("Appraisal force deleted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to force delete");
    }
  };

  const handleUnlock = async (appId?: number | string) => {
    if (!empId || !confirm("Unlock this appraisal? It will return to MANAGER_REVIEWED.")) return;
    try {
      if (appId && Number(appId)) await appraisalService.unlock(empId, Number(appId));
      toast.success("Appraisal unlocked ✓");
      await reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to unlock");
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "DRAFT":            return "bg-slate-100 text-slate-600";
      case "SELF_SUBMITTED":   return "bg-blue-100 text-blue-700";
      case "MANAGER_REVIEWED": return "bg-amber-100 text-amber-700";
      case "LOCKED":           return "bg-green-100 text-green-700";
      default:                 return "bg-slate-100 text-slate-500";
    }
  };

  const getActionLabel = (status?: string) => {
    switch (status) {
      case "DRAFT":            return "Self-Submit";
      case "SELF_SUBMITTED":   return "Manager Review";
      case "MANAGER_REVIEWED": return "Lock";
      default:                 return null;
    }
  };

  // Months already used this year
  const usedMonths = items
    .filter(it => String(it.year) === String(appraisalYear))
    .map(it => it.month)
    .filter(Boolean);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">

      {/* Month Picker Modal */}
      {showMonthPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[360px]">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Select Month</h3>
            <p className="text-sm text-slate-500 mb-4">
              Creating appraisal for <span className="font-semibold text-indigo-600">{appraisalYear}</span>
            </p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {MONTHS.map((m) => {
                const used = usedMonths.includes(m);
                return (
                  <button
                    key={m}
                    disabled={used}
                    onClick={() => setSelectedMonth(m)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all border ${
                      used
                        ? "bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                        : selectedMonth === m
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-400"
                    }`}
                  >
                    {m.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowMonthPicker(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAdd}
                disabled={!selectedMonth || adding}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {adding ? "Creating..." : "Create Appraisal"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Employee Performance Review
            </h2>
            <p className="text-sm text-slate-500 mt-1">Monthly performance evaluations · {appraisalYear}</p>
            {employee && (
              <p className="text-sm text-slate-600 mt-1">
                {`${employee.firstName || ""} ${employee.middleName || ""} ${employee.lastName || ""}`.trim()}
                {employee.role && <span className="text-slate-400"> · {displayRole(employee.companyRole, employee.role)}</span>}
              </p>
            )}
          </div>
          <Button onClick={handleAddClick}
            className="bg-blue-600 text-white shadow-lg flex items-center gap-2 px-6 py-3 rounded-xl">
            <Plus className="h-5 w-5" /> Add Appraisal
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" /> Performance Reviews
        </h3>

        <div className="grid gap-4">
          {items.map((it) => {
            const key = String(it._localId ?? it.id);
            const editing = editingId === key;
            const viewing = viewingId === key;
            const actionLabel = getActionLabel(it.status);
            const isLocked = it.status === "LOCKED";

            return (
              <div key={key} className="border border-slate-200 rounded-xl p-5">
                {editing ? (
                  <AppraisalEditor
                    module="APPRAISAL"
                    value={it as any}
                    onChange={(patch) => updateItem(it._localId ?? it.id, patch as any)}
                    onSave={() => void handleSave(it)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : !viewing ? (
                  /* ── Card ── */
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-800">
                          {it.month
                            ? `${it.month.charAt(0) + it.month.slice(1).toLowerCase()} ${it.year}`
                            : String(it.year)}
                        </h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(it.status)}`}>
                          {it.status || "—"}
                        </span>
                      </div>
                      <div className="flex gap-3 flex-wrap mt-2">
                        {it.goals && it.goals.length > 0 && (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                            {it.goals.length} KPIs
                          </span>
                        )}
                        {it.overallScore != null && (
                          <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                            Score: {it.overallScore.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4 flex-wrap justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setViewingId(key)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      {actionLabel && (
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(key)}>
                          {actionLabel}
                        </Button>
                      )}
                      {isLocked && (
                        <Button size="sm" variant="ghost"
                          onClick={() => handleUnlock(it._localId ?? it.id)}
                          className="text-amber-600 hover:bg-amber-50">
                          <Unlock className="h-4 w-4 mr-1" /> Unlock
                        </Button>
                      )}
                      {!isLocked && (
                        <Button variant="ghost" size="sm"
                          onClick={() => handleDelete(it._localId ?? it.id)}
                          className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {isLocked && (
                        <Button variant="ghost" size="sm"
                          onClick={() => handleForceDelete(it._localId ?? it.id)}
                          className="text-red-600 hover:bg-red-50" title="Force delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── Detail View ── */
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">
                          {employee ? `${employee.firstName || ""} ${employee.lastName || ""}`.trim() : "Employee"}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {it.month
                            ? `${it.month.charAt(0) + it.month.slice(1).toLowerCase()} ${it.year}`
                            : String(it.year)} Performance Review
                        </p>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap justify-end">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadge(it.status)}`}>
                          {it.status}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => setViewingId(null)}>Close</Button>
                        {actionLabel && (
                          <Button size="sm"
                            onClick={() => { setViewingId(null); setEditingId(key); }}
                            className="bg-amber-500 text-white">
                            {actionLabel}
                          </Button>
                        )}
                        {isLocked && (
                          <Button size="sm" variant="ghost"
                            onClick={() => handleUnlock(it._localId ?? it.id)}
                            className="text-amber-600 border border-amber-300">
                            <Unlock className="h-4 w-4 mr-1" /> Unlock
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <InfoCard icon={Calendar} label="Period"
                        value={it.month
                          ? `${it.month.charAt(0) + it.month.slice(1).toLowerCase()} ${it.year}`
                          : String(it.year)}
                        color="blue" />
                      <InfoCard icon={TrendingUp} label="KPIs"
                        value={String(it.goals?.length || 0)} color="emerald" />
                      {it.overallScore != null && (
                        <InfoCard icon={TrendingUp} label="Overall Score"
                          value={it.overallScore.toFixed(2)} color="violet" />
                      )}
                    </div>

                    {it.goals && it.goals.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <h4 className="text-base font-semibold text-slate-800 mb-4">Key Performance Indicators</h4>
                        <div className="space-y-3">
                          {it.goals.map((goal, index) => (
                            <div key={goal.goalId || index}
                              className="bg-white rounded-lg p-4 border border-slate-200 grid grid-cols-[32px_1fr_auto] gap-3 items-start">
                              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{goal.kpi}</p>
                                {goal.description && <p className="text-xs text-slate-500">{goal.description}</p>}
                                <div className="flex gap-3 mt-2 flex-wrap">
                                  {goal.selfRating    != null && <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Self: {goal.selfRating}</span>}
                                  {goal.managerRating != null && <span className="text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded">Manager: {goal.managerRating}</span>}
                                  {goal.selfComment   && <span className="text-xs text-slate-500 italic">"{goal.selfComment}"</span>}
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{goal.weight}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(it.employeeComments || it.managerComments) && (
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-blue-600" /> Comments
                        </h4>
                        {it.employeeComments && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Employee</p>
                            <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border">{it.employeeComments}</p>
                          </div>
                        )}
                        {it.managerComments && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Manager</p>
                            <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border">{it.managerComments}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl mt-4">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No appraisals yet</h3>
            <p className="text-slate-500 mb-6 text-sm">Click "Add Appraisal" to create a monthly appraisal</p>
            <Button onClick={handleAddClick} className="bg-blue-600 text-white rounded-xl px-6">
              <Plus className="h-5 w-5 mr-2" /> Add Appraisal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number | null | undefined;
  color: "blue" | "emerald" | "violet";
}) {
  const colors = {
    blue:    { container: "bg-blue-50 border-blue-100",       icon: "bg-blue-500" },
    emerald: { container: "bg-emerald-50 border-emerald-100", icon: "bg-emerald-500" },
    violet:  { container: "bg-violet-50 border-violet-100",   icon: "bg-violet-500" },
  }[color];
  return (
    <div className={`p-4 rounded-xl border flex items-center gap-4 ${colors.container}`}>
      <div className={`p-3 rounded-full ${colors.icon}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value ?? "—"}</p>
      </div>
    </div>
  );
}

