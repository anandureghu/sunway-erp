import { useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, Layers, Plus, Search, Target, Trash2, Users, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { hrService } from "@/service/hr.service";
import type { JobCode } from "@/service/jobCodeService";
import {
  DField,
  DInput,
  DialogSection,
  RecordFormDialog,
} from "@/modules/hr/components/record-form-dialog";
import type { Goal } from "./appraisal-types";

/**
 * Appraisals → Goals & KPIs → "Assign goals to many". Pick any mix of employees,
 * departments and grades, enter the KPIs once, and they are added to (or replace)
 * the goals of every matching job code in the cycle. Goals live per job code, so an
 * employee gets them through the job code they hold.
 */

type Emp = {
  id: number | string;
  firstName?: string;
  lastName?: string;
  employeeNo?: string;
  status?: string;
  departmentName?: string;
  jobCode?: string;
  designation?: string;
};

type DraftGoal = { id: number; kpi: string; description: string; weight: number };

const EXITED = new Set(["INACTIVE", "RESIGNED", "TERMINATED", "RETIRED"]);

export type BulkGoalsApply = {
  jobCodes: string[];
  goals: Omit<Goal, "id">[];
  mode: "add" | "replace";
  rebalance: boolean;
};

export function BulkGoalsDialog({
  open,
  onClose,
  availableJobCodes,
  maxGoals,
  minGoals,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  availableJobCodes: JobCode[];
  maxGoals: number;
  minGoals: number;
  /** Applies the goals; returns the job codes that were skipped (e.g. over max goals). */
  onApply: (req: BulkGoalsApply) => { applied: string[]; skipped: string[] };
}) {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [empIds, setEmpIds] = useState<string[]>([]);
  const [depts, setDepts] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [goals, setGoals] = useState<DraftGoal[]>([
    { id: 1, kpi: "", description: "", weight: 0 },
  ]);
  const [mode, setMode] = useState<"add" | "replace">("add");
  const [rebalance, setRebalance] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    hrService
      .listEmployees()
      .then((list) =>
        setEmployees(
          ((Array.isArray(list) ? list : []) as unknown as Emp[]).filter(
            (e) => !EXITED.has(String(e.status ?? "").toUpperCase()),
          ),
        ),
      )
      .catch(() => setEmployees([]));
  }, [open]);

  // Choices
  const deptOptions = useMemo(() => {
    const s = new Set<string>();
    availableJobCodes.forEach((j) => j.departmentName && s.add(j.departmentName));
    employees.forEach((e) => e.departmentName && s.add(e.departmentName));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [availableJobCodes, employees]);
  const gradeOptions = useMemo(
    () =>
      Array.from(new Set(availableJobCodes.map((j) => j.salaryGrade).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    [availableJobCodes],
  );
  const empOptions = useMemo(
    () =>
      employees
        .filter((e) => e.jobCode)
        .map((e) => ({
          value: String(e.id),
          label: `${[e.firstName, e.lastName].filter(Boolean).join(" ")}${e.employeeNo ? ` (${e.employeeNo})` : ""}`,
          hint: [e.jobCode, e.designation].filter(Boolean).join(" · "),
        })),
    [employees],
  );

  // Resolve the selection to job codes (+ who holds them)
  const targets = useMemo(() => {
    const codes = new Set<string>();
    employees
      .filter((e) => empIds.includes(String(e.id)) && e.jobCode)
      .forEach((e) => codes.add(e.jobCode!));
    if (depts.length) {
      availableJobCodes
        .filter((j) => j.departmentName && depts.includes(j.departmentName))
        .forEach((j) => codes.add(j.code));
      employees
        .filter((e) => e.jobCode && e.departmentName && depts.includes(e.departmentName))
        .forEach((e) => codes.add(e.jobCode!));
    }
    if (grades.length) {
      availableJobCodes
        .filter((j) => grades.includes(j.salaryGrade))
        .forEach((j) => codes.add(j.code));
    }
    return Array.from(codes)
      .sort()
      .map((code) => ({
        code,
        title: availableJobCodes.find((j) => j.code === code)?.title ?? "",
        holders: employees
          .filter((e) => e.jobCode === code)
          .map((e) => [e.firstName, e.lastName].filter(Boolean).join(" ")),
      }));
  }, [employees, empIds, depts, grades, availableJobCodes]);

  const activeGoals = goals.filter((g) => g.kpi.trim() || g.description.trim() || g.weight);
  const totalWeight = goals.reduce((s, g) => s + (Number(g.weight) || 0), 0);
  const errors: string[] = [];
  if (targets.length === 0) errors.push("Choose at least one employee, department or grade.");
  if (activeGoals.length === 0) errors.push("Add at least one KPI.");
  if (activeGoals.some((g) => !g.kpi.trim())) errors.push("Every KPI needs a name.");
  if (activeGoals.length > maxGoals) errors.push(`A job code can have at most ${maxGoals} KPIs.`);
  if (mode === "replace" && activeGoals.length < minGoals)
    errors.push(`Replacing needs at least ${minGoals} KPIs (the cycle minimum).`);
  if (mode === "replace" && totalWeight !== 100) errors.push("Replacing needs weights that total 100%.");

  const autoBalance = () => {
    const n = goals.length;
    if (!n) return;
    const base = Math.floor(100 / n);
    const rem = 100 - base * n;
    setGoals((gs) => gs.map((g, i) => ({ ...g, weight: base + (i === n - 1 ? rem : 0) })));
  };

  const reset = () => {
    setEmpIds([]);
    setDepts([]);
    setGrades([]);
    setGoals([{ id: 1, kpi: "", description: "", weight: 0 }]);
    setMode("add");
    setRebalance(true);
    setShowErrors(false);
  };

  const submit = () => {
    setShowErrors(true);
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
    const { applied, skipped } = onApply({
      jobCodes: targets.map((t) => t.code),
      goals: activeGoals.map((g) => ({
        kpi: g.kpi.trim(),
        description: g.description.trim(),
        weight: Number(g.weight) || 0,
        active: true,
      })),
      mode,
      rebalance,
    });
    if (applied.length) {
      toast.success(
        `Goals ${mode === "replace" ? "set" : "added"} for ${applied.length} job code${applied.length === 1 ? "" : "s"}. Save the cycle to keep them.`,
      );
    }
    if (skipped.length) {
      toast.warning(
        `Skipped ${skipped.join(", ")} — they would exceed the maximum of ${maxGoals} KPIs.`,
      );
    }
    reset();
    onClose();
  };

  return (
    <RecordFormDialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Assign goals to many"
      subtitle="Add the same KPIs for several employees, departments or grades at once"
      badge={<Target className="h-5 w-5" />}
      badgeClassName="bg-indigo-100 text-indigo-700"
      saveLabel={`Apply to ${targets.length} job code${targets.length === 1 ? "" : "s"}`}
      onSave={submit}
      maxWidth={820}
    >
      {/* ── Who ── */}
      <DialogSection icon={<Users className="h-3.5 w-3.5 text-slate-600" />} iconBg="bg-slate-100" title="Who gets these goals">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MultiPick
            icon={<Users className="h-3.5 w-3.5" />}
            label="Employees"
            placeholder="Search employees…"
            options={empOptions}
            value={empIds}
            onChange={setEmpIds}
          />
          <MultiPick
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Departments"
            placeholder="Search departments…"
            options={deptOptions.map((d) => ({ value: d, label: d }))}
            value={depts}
            onChange={setDepts}
          />
          <MultiPick
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Grades"
            placeholder="Search grades…"
            options={gradeOptions.map((g) => ({ value: g, label: `Grade ${g}` }))}
            value={grades}
            onChange={setGrades}
          />
        </div>

        <div
          className={cn(
            "mt-3 rounded-xl border px-3 py-2.5",
            targets.length ? "border-indigo-200 bg-indigo-50/60" : "border-dashed border-slate-200 bg-slate-50/60",
          )}
        >
          <p className="text-[12px] font-semibold text-slate-700">
            {targets.length
              ? `Applies to ${targets.length} job code${targets.length === 1 ? "" : "s"} · ${targets.reduce((a, t) => a + t.holders.length, 0)} employee${targets.reduce((a, t) => a + t.holders.length, 0) === 1 ? "" : "s"}`
              : "Nothing selected yet — goals are assigned through job codes."}
          </p>
          {targets.length > 0 && (
            <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {targets.map((t) => (
                <span
                  key={t.code}
                  title={t.holders.length ? `Held by ${t.holders.join(", ")}` : "No current holder"}
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[11px] text-indigo-700"
                >
                  <Briefcase className="h-3 w-3" />
                  <b className="font-semibold">{t.code}</b>
                  {t.title && <span className="text-slate-500">· {t.title}</span>}
                  {t.holders.length > 0 && <span className="text-slate-400">· {t.holders[0]}{t.holders.length > 1 ? ` +${t.holders.length - 1}` : ""}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </DialogSection>

      {/* ── Goals ── */}
      <DialogSection icon={<Target className="h-3.5 w-3.5 text-indigo-600" />} iconBg="bg-indigo-50" title="Goals & KPIs">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  totalWeight === 100 ? "bg-green-500" : totalWeight > 100 ? "bg-red-500" : "bg-indigo-500",
                )}
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              />
            </div>
            <span className={cn("text-sm font-bold tabular-nums", totalWeight === 100 ? "text-green-600" : totalWeight > 100 ? "text-red-600" : "text-indigo-600")}>
              {totalWeight}%
            </span>
          </div>
          <button type="button" onClick={autoBalance} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Zap className="h-3.5 w-3.5" /> Auto balance
          </button>
          <button
            type="button"
            disabled={goals.length >= maxGoals}
            onClick={() => setGoals((gs) => [...gs, { id: Date.now(), kpi: "", description: "", weight: 0 }])}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-indigo-600 px-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add KPI
          </button>
        </div>

        <div className="space-y-2.5">
          {goals.map((g, i) => (
            <div key={g.id} className="grid grid-cols-[28px_1fr_1.6fr_84px_32px] items-start gap-2.5">
              <span className="mt-[30px] flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                {i + 1}
              </span>
              <DField label="KPI name" required error={showErrors && !g.kpi.trim() && (g.description || g.weight || goals.length === 1) ? "Required" : undefined}>
                <DInput
                  placeholder="e.g. Customer satisfaction"
                  value={g.kpi}
                  onChange={(e) => setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, kpi: e.target.value } : x)))}
                />
              </DField>
              <DField label="Success criteria">
                <DInput
                  placeholder="Measurable target…"
                  value={g.description}
                  onChange={(e) => setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, description: e.target.value } : x)))}
                />
              </DField>
              <DField label="Weight %">
                <DInput
                  type="number"
                  min={0}
                  max={100}
                  className="text-center font-bold text-indigo-600"
                  value={g.weight}
                  onChange={(e) => setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, weight: Number(e.target.value) } : x)))}
                />
              </DField>
              <button
                type="button"
                aria-label="Remove KPI"
                disabled={goals.length <= 1}
                onClick={() => setGoals((gs) => gs.filter((x) => x.id !== g.id))}
                className="mt-[26px] flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:text-slate-300 disabled:hover:bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </DialogSection>

      {/* ── How ── */}
      <DialogSection icon={<Layers className="h-3.5 w-3.5 text-amber-600" />} iconBg="bg-amber-50" title="How to apply">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(
            [
              ["add", "Add to existing goals", "Keeps each job code's current KPIs and adds these."],
              ["replace", "Replace existing goals", "Removes each job code's current KPIs and uses only these."],
            ] as const
          ).map(([value, title, desc]) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
                mode === value ? "border-indigo-300 bg-indigo-50/70" : "border-slate-200 hover:bg-slate-50",
              )}
            >
              <input type="radio" name="bulk-goal-mode" checked={mode === value} onChange={() => setMode(value)} className="mt-0.5 h-4 w-4 text-indigo-600" />
              <span>
                <span className="block text-[13px] font-semibold text-slate-800">{title}</span>
                <span className="text-[11.5px] text-slate-500">{desc}</span>
              </span>
            </label>
          ))}
        </div>
        {mode === "add" && (
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
            <input type="checkbox" checked={rebalance} onChange={(e) => setRebalance(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
            Re-balance each job code's weights to total 100% after adding
          </label>
        )}
        <p className="mt-2 text-[11px] text-slate-400">
          Job codes whose appraisals have already started keep their goals when the cycle is saved.
        </p>
      </DialogSection>
    </RecordFormDialog>
  );
}

/** Small searchable multi-select with removable chips. */
function MultiPick({
  icon,
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  options: { value: string; label: string; hint?: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = options.filter(
    (o) => !value.includes(o.value) && (o.label + " " + (o.hint ?? "")).toLowerCase().includes(q.trim().toLowerCase()),
  );
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 p-2.5">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {icon} {label}
        {value.length > 0 && <span className="ml-auto rounded-full bg-indigo-100 px-1.5 text-[10px] font-bold text-indigo-700">{value.length}</span>}
      </p>
      {value.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {value.map((v) => (
            <span key={v} className="inline-flex max-w-full items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-medium text-white">
              <span className="truncate">{options.find((o) => o.value === v)?.label ?? v}</span>
              <button type="button" aria-label="Remove" onClick={() => toggle(v)} className="opacity-80 hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-[12.5px] outline-none focus:border-indigo-400"
        />
      </div>
      <div className="mt-1.5 max-h-36 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-1 py-2 text-[11.5px] text-slate-400">{options.length ? "No more matches" : "None available"}</p>
        ) : (
          filtered.slice(0, 50).map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className="block w-full rounded-md px-1.5 py-1 text-left text-[12.5px] text-slate-700 hover:bg-indigo-50"
            >
              <span className="block truncate">{o.label}</span>
              {o.hint && <span className="block truncate text-[10.5px] text-slate-400">{o.hint}</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
