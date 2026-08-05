import type { ReactNode } from "react";
import {
  Briefcase,
  Edit,
  CheckCircle2,
  XCircle,
  X,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  type JobCode,
  JcSection,
  JcSelectField,
  jcInputCls,
  jcLabelCls,
  LEVELS,
  GRADES,
} from "./shared";

/** Add / edit job-code modal. */
export function JobCodeFormDialog({
  open,
  onOpenChange,
  form,
  onField,
  onSave,
  onClose,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: Partial<JobCode>;
  onField: (p: Partial<JobCode>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{
          maxWidth: 680,
          maxHeight: "92vh",
          width: "calc(100vw - 32px)",
        }}
      >
        {/* ── Header ── */}
        <div className="shrink-0 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-indigo-100 text-indigo-700">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold leading-tight text-white">
                {form.id ? "Edit job code" : "Add new job code"}
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-300">
                Define identity, salary grade, and salary range. Department is
                assigned on the employee profile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-white px-6 py-5">
          {/* ── Identity ── */}
          <JcSection
            icon={<Briefcase className="h-3.5 w-3.5 text-slate-600" />}
            iconBg="bg-slate-100"
            title="Identity"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={jcLabelCls}>
                  Job code <span className="text-rose-400">*</span>
                </label>
                <input
                  value={form.code ?? ""}
                  onChange={(e) => onField({ code: e.target.value.toUpperCase() })}
                  placeholder="ENG-003"
                  className={`${jcInputCls} font-mono uppercase tracking-wider`}
                />
              </div>

              <div>
                <label className={jcLabelCls}>
                  Job level <span className="text-rose-400">*</span>
                </label>
                <JcSelectField
                  value={form.level ?? "Mid"}
                  onChange={(e) => onField({ level: e.target.value })}
                >
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </JcSelectField>
              </div>

              <div className="col-span-2">
                <label className={jcLabelCls}>
                  Job title <span className="text-rose-400">*</span>
                </label>
                <input
                  value={form.title ?? ""}
                  onChange={(e) => onField({ title: e.target.value })}
                  placeholder="Software Engineer"
                  className={jcInputCls}
                />
              </div>
            </div>
          </JcSection>

          {/* ── Compensation ── */}
          <JcSection
            icon={<DollarSign className="h-3.5 w-3.5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            title="Compensation"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div>
                <label className={jcLabelCls}>
                  Salary grade <span className="text-rose-400">*</span>
                </label>
                <JcSelectField
                  value={form.salaryGrade ?? "G3"}
                  onChange={(e) => onField({ salaryGrade: e.target.value })}
                >
                  {GRADES.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </JcSelectField>
              </div>

              <div>
                <label className={jcLabelCls}>Min salary</label>
                <input
                  type="number"
                  min={0}
                  value={form.minSalary ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    onField({ minSalary: v === "" ? null : Number(v) });
                  }}
                  placeholder="0.00"
                  className={jcInputCls}
                />
              </div>

              <div>
                <label className={jcLabelCls}>Max salary</label>
                <input
                  type="number"
                  min={0}
                  value={form.maxSalary ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    onField({ maxSalary: v === "" ? null : Number(v) });
                  }}
                  placeholder="0.00"
                  className={jcInputCls}
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Salary range is optional but recommended. Min must not exceed Max.
            </p>
          </JcSection>

          {/* ── Status ── */}
          <JcSection
            icon={<TrendingUp className="h-3.5 w-3.5 text-amber-600" />}
            iconBg="bg-amber-50"
            title="Status"
          >
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-slate-700">
                  {form.active ? "Active" : "Inactive"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {form.active
                    ? "Visible in employee assignment dropdowns"
                    : "Hidden from new assignments"}
                </p>
              </div>
              <Switch
                checked={form.active ?? true}
                onCheckedChange={(checked: boolean) => onField({ active: checked })}
              />
            </div>
          </JcSection>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            Fields marked <span className="text-rose-400">*</span> are required
          </p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              type="button"
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-[13px] font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
            >
              <Briefcase className="h-3.5 w-3.5" />
              {form.id ? "Save changes" : "Save job code"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** One label → value line in the clean definition list (matches Department view). */
const JcViewField = ({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 px-4 py-3">
    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <span className="break-words text-right text-sm font-medium text-slate-800">
      {value == null || value === "" ? "—" : value}
    </span>
  </div>
);

/** Read-only job-code detail dialog — styled to match the Department detail view. */
export function JobCodeViewDialog({
  view,
  onClose,
  onEdit,
}: {
  view: JobCode | null;
  onClose: () => void;
  onEdit: (jc: JobCode) => void;
}) {
  const salaryRange =
    view && (view.minSalary != null || view.maxSalary != null)
      ? `${view.minSalary != null ? Number(view.minSalary).toLocaleString() : "—"} – ${view.maxSalary != null ? Number(view.maxSalary).toLocaleString() : "—"}`
      : "—";

  return (
    <Dialog open={!!view} onOpenChange={onClose}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="space-y-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-left">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                Job Code
              </span>
              <DialogTitle className="mt-1 truncate text-lg font-semibold text-white">
                {view?.title ?? "Job Code"}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-white/80">
                {view?.code ?? "—"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        {view && (
          <div className="space-y-5 px-6 py-5">
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
              <JcViewField label="Job Level" value={view.level} />
              <JcViewField label="Salary Grade" value={view.salaryGrade} />
              <JcViewField label="Salary Range" value={salaryRange} />
              <JcViewField
                label="Status"
                value={
                  view.active ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-400">
                      <XCircle className="h-4 w-4" /> Inactive
                    </span>
                  )
                }
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              const v = view;
              onClose();
              if (v) onEdit(v);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Delete-confirmation dialog for a job code. */
export function JobCodeDeleteDialog({
  del,
  onClose,
  onConfirm,
}: {
  del: JobCode | null;
  onClose: () => void;
  onConfirm: (jc: JobCode) => void;
}) {
  return (
    <Dialog open={!!del} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Job Code</DialogTitle>
          <DialogDescription>
            Delete "{del?.code} — {del?.title}"? Employees assigned to this code
            must be reassigned.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (del) onConfirm(del);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
