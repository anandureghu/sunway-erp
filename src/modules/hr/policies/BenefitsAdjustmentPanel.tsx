import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { canEditModule } from "@/lib/module-permissions";
import { fetchDepartments } from "@/service/departmentService";
import { hrService } from "@/service/hr.service";
import {
  benefitsAdjustmentService,
  type BenefitsComponent,
  type BenefitsScope,
} from "@/service/benefitsAdjustmentService";

type Dept = { id: number; departmentName?: string; name?: string };
type Emp = {
  id: string | number;
  firstName?: string;
  lastName?: string;
  employeeNo?: string;
};

const COMPONENTS: { key: BenefitsComponent; label: string }[] = [
  { key: "HOUSING", label: "Housing" },
  { key: "TRANSPORT", label: "Transport" },
  { key: "FOOD", label: "Food" },
  { key: "TRAVEL", label: "Travel" },
  { key: "OTHER", label: "Other" },
  { key: "BASIC", label: "Basic salary" },
];

/**
 * HR Settings → bulk benefits adjustment. Raises selected pay components by a
 * percentage for a group of employees chosen by grade code, department, or a single
 * employee. Edit-gated on HR_SETTINGS.
 */
export default function BenefitsAdjustmentPanel() {
  const { company, permissions } = useAuth();
  const canEdit = canEditModule(permissions, "HR_SETTINGS");

  const [scope, setScope] = useState<BenefitsScope>("DEPARTMENT");
  const [gradeCode, setGradeCode] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [percentage, setPercentage] = useState<number>(5);
  const [selected, setSelected] = useState<Set<BenefitsComponent>>(
    new Set(["HOUSING", "TRANSPORT", "FOOD", "TRAVEL", "OTHER"]),
  );

  const [gradeCodes, setGradeCodes] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    benefitsAdjustmentService.gradeCodes().then(setGradeCodes);
    hrService
      .listEmployees()
      .then((list) =>
        setEmployees(Array.isArray(list) ? (list as unknown as Emp[]) : []),
      )
      .catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    if (!company?.id) return;
    fetchDepartments(company.id)
      .then((list: unknown) =>
        setDepartments(Array.isArray(list) ? (list as Dept[]) : []),
      )
      .catch(() => setDepartments([]));
  }, [company?.id]);

  const toggle = (key: BenefitsComponent) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const empLabel = (e: Emp) =>
    `${[e.firstName, e.lastName].filter(Boolean).join(" ")}${
      e.employeeNo ? ` (${e.employeeNo})` : ""
    }`.trim();

  const canSubmit = useMemo(() => {
    if (!canEdit || saving) return false;
    if (!percentage || percentage <= 0) return false;
    if (selected.size === 0) return false;
    if (scope === "GRADE_CODE") return !!gradeCode;
    if (scope === "DEPARTMENT") return !!departmentId;
    if (scope === "EMPLOYEE") return !!employeeId;
    return false;
  }, [
    canEdit,
    saving,
    percentage,
    selected,
    scope,
    gradeCode,
    departmentId,
    employeeId,
  ]);

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const result = await benefitsAdjustmentService.adjust({
        scope,
        gradeCode: scope === "GRADE_CODE" ? gradeCode : null,
        departmentId: scope === "DEPARTMENT" ? Number(departmentId) : null,
        employeeId: scope === "EMPLOYEE" ? Number(employeeId) : null,
        percentage,
        components: Array.from(selected),
      });
      if (result.adjusted === 0) {
        toast.info(
          result.matched === 0
            ? "No employees matched the selection."
            : "Matched employees have no active salary record to adjust.",
        );
      } else {
        toast.success(
          `Raised benefits by ${percentage}% for ${result.adjusted} employee${
            result.adjusted === 1 ? "" : "s"
          }.`,
        );
      }
    } catch {
      toast.error("Could not apply the benefits adjustment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Benefits Adjustment
          </h3>
          <p className="text-[11px] text-slate-400">
            Raise selected benefits by a percentage across a grade, department, or
            employee.
          </p>
        </div>
      </div>

      {!canEdit && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          You need HR settings edit permission to adjust benefits.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Apply by
          </label>
          <Select
            value={scope}
            onValueChange={(v) => setScope(v as BenefitsScope)}
            disabled={!canEdit}
          >
            <SelectTrigger className="mt-1 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GRADE_CODE">Grade code</SelectItem>
              <SelectItem value="DEPARTMENT">Department</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {scope === "GRADE_CODE"
              ? "Grade code"
              : scope === "DEPARTMENT"
                ? "Department"
                : "Employee"}
          </label>
          {scope === "GRADE_CODE" && (
            <Select
              value={gradeCode}
              onValueChange={setGradeCode}
              disabled={!canEdit}
            >
              <SelectTrigger className="mt-1 h-9 text-sm">
                <SelectValue placeholder="Select grade code" />
              </SelectTrigger>
              <SelectContent>
                {gradeCodes.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {scope === "DEPARTMENT" && (
            <Select
              value={departmentId}
              onValueChange={setDepartmentId}
              disabled={!canEdit}
            >
              <SelectTrigger className="mt-1 h-9 text-sm">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.departmentName ?? d.name ?? `#${d.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {scope === "EMPLOYEE" && (
            <Select
              value={employeeId}
              onValueChange={setEmployeeId}
              disabled={!canEdit}
            >
              <SelectTrigger className="mt-1 h-9 text-sm">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {empLabel(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Increase (%)
          </label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              type="number"
              step="0.5"
              min="0"
              value={percentage}
              onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)}
              disabled={!canEdit}
              className="h-9 w-28 text-sm"
            />
            {[5, 10].map((p) => (
              <Button
                key={p}
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={!canEdit}
                onClick={() => setPercentage(p)}
              >
                {p}%
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Components
          </label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {COMPONENTS.map((c) => {
              const on = selected.has(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => toggle(c.key)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    on
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500"
                  } ${canEdit ? "" : "opacity-60"}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="h-9"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TrendingUp className="mr-2 h-4 w-4" />
          )}
          Apply adjustment
        </Button>
      </div>
    </div>
  );
}
