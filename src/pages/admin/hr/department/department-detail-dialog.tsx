import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Layers, User } from "lucide-react";
import type { DepartmentTableRow } from "@/lib/columns/department-listing-admin";

const fmtDate = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

/** One label → value line in the clean definition list. */
const Field = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="flex items-start justify-between gap-4 px-4 py-3">
    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <span className="break-words text-right text-sm font-medium text-slate-800">
      {value || "—"}
    </span>
  </div>
);

export function DepartmentDetailDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: DepartmentTableRow | null;
}) {
  const isDivision = row?.rowType === "division";
  const dept = row?.department;
  const div = row?.division;
  const divisions = row?.subRows ?? [];

  const fields = isDivision
    ? [
        { label: "Manager", value: row?.managerName },
        { label: "Division Code", value: row?.code },
        { label: "Parent Department", value: div?.departmentName },
        { label: "Company", value: div?.companyName },
        { label: "Company Code", value: div?.companyCode },
        { label: "Description", value: div?.description },
      ]
    : [
        { label: "Manager", value: row?.managerName },
        { label: "Department Code", value: row?.code },
        { label: "Company", value: dept?.companyName },
        { label: "Company Code", value: dept?.companyCode },
        { label: "Created", value: fmtDate(dept?.createdAt) },
        { label: "Divisions", value: String(divisions.length) },
      ];

  const HeaderIcon = isDivision ? Layers : Building2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="space-y-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-left">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
              <HeaderIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                {isDivision ? "Division" : "Department"}
              </span>
              <DialogTitle className="mt-1 truncate text-lg font-semibold text-white">
                {row?.name ?? (isDivision ? "Division" : "Department")}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-white/80">
                {row?.code ?? "—"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
            {fields.map((f) => (
              <Field key={f.label} label={f.label} value={f.value} />
            ))}
          </div>

          {/* Divisions (departments only) */}
          {!isDivision && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Layers className="h-3.5 w-3.5" />
                Divisions ({divisions.length})
              </p>
              {divisions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-400">
                  No divisions under this department
                </p>
              ) : (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                  {divisions.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {d.name}
                        </p>
                        <p className="truncate font-mono text-[11px] text-slate-400">
                          {d.code}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-500">
                        <User className="h-3 w-3 text-slate-400" />
                        {d.managerName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
