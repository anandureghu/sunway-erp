import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserCheck, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { hrService } from "@/service/hr.service";
import type { Employee } from "@/types/hr";
import { cn, initialsFrom } from "@/lib/utils";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

// yyyy-mm-dd → dd-mm-yyyy for display (no timezone shift).
function fmtDate(v?: string): string {
  if (!v) return "—";
  const [y, m, d] = String(v).split("-");
  return y && m && d ? `${d}-${m}-${y}` : v;
}

/** Whether an employee's probation period has already ended (ready to confirm). */
function isOverdue(probationEndDate?: string): boolean {
  if (!probationEndDate) return false;
  const end = new Date(probationEndDate);
  if (Number.isNaN(end.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end <= today;
}

/**
 * Confirm Employees — lists new hires still under probation and lets an authorised
 * approver confirm them (→ active). Employees whose probation has already ended
 * are flagged as ready.
 */
export function ConfirmEmployeesPanel() {
  const { confirm } = useConfirmDialog();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hrService.listUnderProbation();
      setRows(data ?? []);
    } catch {
      toast.error("Failed to load employees under probation");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleConfirm = async (emp: Employee) => {
    const id = Number(emp.id);
    const name = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim();
    const ok = await confirm({
      title: "Confirm employee",
      description: `Confirm ${name || "this employee"}? They will become active and can then apply for loans and leave.`,
      confirmLabel: "Confirm employee",
    });
    if (!ok) return;
    setConfirmingId(id);
    try {
      await hrService.confirmEmployee(id);
      toast.success(`${name || "Employee"} confirmed — now active`);
      setRows((prev) => prev.filter((r) => Number(r.id) !== id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to confirm employee");
    } finally {
      setConfirmingId(null);
    }
  };

  const readyCount = rows.filter((r) => isOverdue(r.probationEndDate)).length;

  return (
    <div className="space-y-5">
      <SecondaryPageHeader
        title="Confirm Employees"
        description="Confirm new hires whose probation has ended — confirmed employees become active."
        icon={<UserCheck className="h-5 w-5" />}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
          <p className="text-sm text-slate-500">Loading employees…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white rounded-xl border border-slate-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-base font-semibold text-slate-700">
            No employees under probation
          </p>
          <p className="text-sm text-slate-400">
            New hires under probation appear here for confirmation.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {rows.length} under probation
              {readyCount > 0 && (
                <span className="ml-2 text-emerald-600">
                  · {readyCount} ready to confirm
                </span>
              )}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Employee", "Department", "Join Date", "Probation Ends", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider text-slate-500",
                          h === "Actions" ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((emp, index) => {
                  const id = Number(emp.id);
                  const overdue = isOverdue(emp.probationEndDate);
                  const busy = confirmingId === id;
                  return (
                    <tr
                      key={id}
                      className={cn(
                        "border-b border-slate-100 transition-colors hover:bg-slate-50/60",
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                      )}
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-white text-xs font-bold shadow-sm">
                            {initialsFrom(
                              `${emp.firstName ?? ""} ${emp.lastName ?? ""}`,
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {emp.firstName} {emp.lastName}
                            </p>
                            {emp.employeeNo && (
                              <p className="whitespace-nowrap font-mono text-[11px] text-slate-400">
                                {emp.employeeNo}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-600">
                        {emp.departmentName || emp.department || "—"}
                      </td>
                      <td className="text-xs tabular-nums text-slate-600">
                        {fmtDate(emp.joinDate)}
                      </td>
                      <td className="text-xs tabular-nums">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-semibold",
                            overdue
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700",
                          )}
                        >
                          {fmtDate(emp.probationEndDate)}
                          {overdue ? " · ended" : ""}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end">
                          <button
                            disabled={busy}
                            onClick={() => void handleConfirm(emp)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                              "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 shadow-sm",
                              busy && "opacity-60 cursor-wait",
                            )}
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {busy ? "Confirming…" : "Confirm"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
