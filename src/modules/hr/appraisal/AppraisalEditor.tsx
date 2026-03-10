import { useEffect, useState } from "react";
import type { AppModel } from "./AppraisalsForm";
import { Button } from "@/components/ui/button";

type Props = {
  value: AppModel;
  module: string;
  onChange: (patch: Partial<AppModel>) => void;
  onSave: () => void;
  onCancel: () => void;
};

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export default function AppraisalEditor({ value, onChange, onSave, onCancel }: Props) {
  const [form, setForm] = useState<AppModel>({ ...value });

  useEffect(() => {
    setForm({ ...value });
  }, [value]);

  const updateLocal = (k: keyof AppModel, v: any) => {
    if (k === "id" || k === "_localId") return;
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      onChange({ ...next });
      return next;
    });
  };

  const updateGoal = (goalId: number, field: string, val: any) => {
    setForm((prev) => {
      const updatedGoals = (prev.goals || []).map((g) =>
        g.goalId === goalId ? { ...g, [field]: val } : g
      );
      const next = { ...prev, goals: updatedGoals };
      onChange({ ...next });
      return next;
    });
  };

  const handleSave = () => {
    onChange({ ...form });
    setTimeout(() => onSave(), 0);
  };

  const status    = form.status;
  const isDraft   = status === "DRAFT";
  const isSelf    = status === "SELF_SUBMITTED";
  const hasGoals  = form.goals && form.goals.length > 0;

  // Label for the save button based on status
  const saveLabel =
    isDraft  ? "Submit Self-Assessment" :
    isSelf   ? "Submit Manager Review"  :
    status === "MANAGER_REVIEWED" ? "Lock Appraisal" : "Save";

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-6">

      {/* Status Banner */}
      {status && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold w-fit ${
          isDraft  ? "bg-slate-100 text-slate-600" :
          isSelf   ? "bg-blue-50 text-blue-700"   :
          status === "MANAGER_REVIEWED" ? "bg-amber-50 text-amber-700" :
          "bg-green-50 text-green-700"
        }`}>
          <span className="w-2 h-2 rounded-full bg-current inline-block" />
          {status.replace("_", " ")}
        </div>
      )}

      {/* Year (read-only if already saved) */}
      <div className="w-40">
        <label className="block text-sm font-semibold text-slate-700 mb-1">Year</label>
        <input
          type="number"
          readOnly={!!form.id}
          className={`w-full px-3 py-2 border border-slate-300 rounded-lg ${
            form.id ? "bg-slate-50 cursor-not-allowed" : "focus:ring-2 focus:ring-indigo-500"
          }`}
          value={String(form.year || new Date().getFullYear())}
          onChange={(e) => updateLocal("year", Number(e.target.value) || "")}
        />
      </div>

      {/* ── Dynamic KPIs ── */}
      {hasGoals ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            🎯 Key Performance Indicators
            <span className="text-xs font-normal text-slate-400 normal-case">
              ({form.goals!.length} KPIs · {
                isDraft ? "Fill in your self-ratings" :
                isSelf  ? "Fill in manager ratings"   :
                "Review complete"
              })
            </span>
          </h3>

          {form.goals!.map((goal, idx) => (
            <div key={goal.goalId}
              className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">

              {/* KPI Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{goal.kpi}</p>
                    {goal.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{goal.description}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 flex-shrink-0">
                  Weight: {goal.weight}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Self Rating — editable in DRAFT, read-only after */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Self Rating {isDraft && <span className="text-red-400">*</span>}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {RATING_OPTIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        disabled={!isDraft}
                        onClick={() => isDraft && updateGoal(goal.goalId, "selfRating", r)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all border ${
                          goal.selfRating === r
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : isDraft
                              ? "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
                              : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                    {isDraft && goal.selfRating && (
                      <button
                        type="button"
                        onClick={() => updateGoal(goal.goalId, "selfRating", undefined)}
                        className="w-9 h-9 rounded-lg text-xs text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-500"
                      >✕</button>
                    )}
                  </div>
                </div>

                {/* Manager Rating — editable only in SELF_SUBMITTED */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Manager Rating {isSelf && <span className="text-red-400">*</span>}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {RATING_OPTIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        disabled={!isSelf}
                        onClick={() => isSelf && updateGoal(goal.goalId, "managerRating", r)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all border ${
                          goal.managerRating === r
                            ? "bg-orange-500 text-white border-orange-500"
                            : isSelf
                              ? "bg-white text-slate-600 border-slate-300 hover:border-orange-400"
                              : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                    {isSelf && goal.managerRating && (
                      <button
                        type="button"
                        onClick={() => updateGoal(goal.goalId, "managerRating", undefined)}
                        className="w-9 h-9 rounded-lg text-xs text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-500"
                      >✕</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Self Comment
                  </label>
                  <textarea
                    disabled={!isDraft}
                    className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none ${
                      isDraft ? "focus:ring-2 focus:ring-indigo-500" : "bg-slate-50 cursor-not-allowed"
                    }`}
                    rows={2}
                    value={goal.selfComment || ""}
                    onChange={(e) => isDraft && updateGoal(goal.goalId, "selfComment", e.target.value)}
                    placeholder={isDraft ? "Your assessment notes..." : "—"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Manager Comment
                  </label>
                  <textarea
                    disabled={!isSelf}
                    className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none ${
                      isSelf ? "focus:ring-2 focus:ring-indigo-500" : "bg-slate-50 cursor-not-allowed"
                    }`}
                    rows={2}
                    value={goal.managerComment || ""}
                    onChange={(e) => isSelf && updateGoal(goal.goalId, "managerComment", e.target.value)}
                    placeholder={isSelf ? "Manager feedback..." : "—"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
          <div className="text-3xl mb-3">🎯</div>
          <p className="text-slate-600 font-medium">No KPIs loaded</p>
          <p className="text-sm text-slate-400 mt-1">
            Make sure an ACTIVE appraisal config exists in HR Settings
            and this employee's role is configured.
          </p>
        </div>
      )}

      {/* Overall Comments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Employee Comments
          </label>
          <textarea
            disabled={!isDraft}
            className={`w-full px-3 py-2 border border-slate-300 rounded-lg ${
              isDraft ? "focus:ring-2 focus:ring-indigo-500" : "bg-slate-50 cursor-not-allowed"
            }`}
            rows={3}
            value={form.employeeComments || ""}
            onChange={(e) => updateLocal("employeeComments", e.target.value)}
            placeholder={isDraft ? "Overall self-assessment comments..." : "—"}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Manager Comments
          </label>
          <textarea
            disabled={!isSelf}
            className={`w-full px-3 py-2 border border-slate-300 rounded-lg ${
              isSelf ? "focus:ring-2 focus:ring-indigo-500" : "bg-slate-50 cursor-not-allowed"
            }`}
            rows={3}
            value={form.managerComments || ""}
            onChange={(e) => updateLocal("managerComments", e.target.value)}
            placeholder={isSelf ? "Overall manager feedback..." : "—"}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={status === "LOCKED"}
          className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

