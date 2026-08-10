import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, RefreshCw, CalendarClock, XCircle } from "lucide-react";
import {
  contractService,
  type ContractResponse,
} from "@/service/contractService";
import { cn, initialsFrom } from "@/lib/utils";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

// yyyy-mm-dd → dd-mm-yyyy for display (no timezone shift).
function fmtDate(v?: string): string {
  if (!v) return "—";
  const [y, m, d] = String(v).split("-");
  return y && m && d ? `${d}-${m}-${y}` : v;
}

/** Whole days from today to the given date (negative = already past). */
function daysUntil(v?: string): number | null {
  if (!v) return null;
  const end = new Date(v);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

/** Project the new expiry a renewal would produce (mirrors the backend default). */
function projectedRenewal(c: ContractResponse): string {
  const base = new Date(c.expirationDate ?? "");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from =
    Number.isNaN(base.getTime()) || base < today ? new Date(today) : base;
  const months =
    c.contractPeriodMonths && c.contractPeriodMonths > 0
      ? c.contractPeriodMonths
      : 12;
  from.setMonth(from.getMonth() + months);
  const dd = String(from.getDate()).padStart(2, "0");
  const mm = String(from.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${from.getFullYear()}`;
}

const humanize = (t?: string) =>
  (t ?? "—").replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

function statusMeta(status?: string) {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "EXPIRED":
      return { label: "Expired", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    case "DRAFT":
      return { label: "Draft", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "TERMINATED":
      return { label: "Terminated", cls: "bg-slate-100 text-slate-500 border-slate-200" };
    default:
      return { label: status || "—", cls: "bg-slate-100 text-slate-500 border-slate-200" };
  }
}

/** Expiry chip: past → rose, within 30 days → amber, else emerald. */
function ExpiryChip({ expirationDate }: { expirationDate?: string }) {
  const d = daysUntil(expirationDate);
  const label =
    d == null
      ? "—"
      : d < 0
        ? `Expired ${Math.abs(d)}d ago`
        : d === 0
          ? "Expires today"
          : `in ${d}d`;
  const cls =
    d == null
      ? "bg-slate-100 text-slate-500 border-slate-200"
      : d < 0
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : d <= 30
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs tabular-nums text-slate-700">
        {fmtDate(expirationDate)}
      </span>
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
          cls,
        )}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Contract Renewables — HR reviews contracts and either renews them (extends the
 * term, back to Active) or lets them expire.
 */
export default function ContractRenewablesPanel() {
  const { confirm } = useConfirmDialog();
  const [rows, setRows] = useState<ContractResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contractService.listRenewables();
      setRows(data ?? []);
    } catch {
      toast.error("Failed to load contracts");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchRow = (updated: ContractResponse) =>
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const handleRenew = async (c: ContractResponse) => {
    const ok = await confirm({
      title: "Renew contract",
      description: `Renew ${c.staffName ?? "this employee"}'s contract (${c.contractCode ?? ""})? Its new expiry will be ${projectedRenewal(c)} and it will be set Active.`,
      confirmLabel: "Renew",
    });
    if (!ok) return;
    setBusyId(c.id);
    try {
      const updated = await contractService.renew(c.id);
      patchRow(updated);
      toast.success(`Contract renewed — now expires ${fmtDate(updated.expirationDate)}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to renew contract");
    } finally {
      setBusyId(null);
    }
  };

  const handleExpire = async (c: ContractResponse) => {
    const ok = await confirm({
      title: "Let contract expire",
      description: `Mark ${c.staffName ?? "this employee"}'s contract (${c.contractCode ?? ""}) as expired? It will no longer be active.`,
      confirmLabel: "Let it expire",
    });
    if (!ok) return;
    setBusyId(c.id);
    try {
      const updated = await contractService.expire(c.id);
      patchRow(updated);
      toast.success("Contract marked as expired");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to expire contract");
    } finally {
      setBusyId(null);
    }
  };

  const expiringSoon = rows.filter((r) => {
    const d = daysUntil(r.expirationDate);
    return d != null && d <= 30;
  }).length;

  return (
    <div className="space-y-5">
      <SecondaryPageHeader
        title="Contract Renewables"
        description="Review employee contracts and renew them or let them expire."
        icon={<FileText className="h-5 w-5" />}
        actions={
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
          <p className="text-sm text-slate-500">Loading contracts…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white rounded-xl border border-slate-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <FileText className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-base font-semibold text-slate-700">
            No contracts to review
          </p>
          <p className="text-sm text-slate-400">
            Contracts with an expiry date appear here for renewal.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {rows.length} contract{rows.length !== 1 ? "s" : ""}
              {expiringSoon > 0 && (
                <span className="ml-2 text-amber-600">
                  · {expiringSoon} expiring within 30 days
                </span>
              )}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Employee", "Contract", "Type", "Effective", "Expires", "Status", "Actions"].map(
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
                {rows.map((c, index) => {
                  const busy = busyId === c.id;
                  const expired = c.status === "EXPIRED";
                  const meta = statusMeta(c.status);
                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        "border-b border-slate-100 transition-colors hover:bg-slate-50/60",
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                      )}
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-white text-xs font-bold shadow-sm">
                            {initialsFrom(c.staffName ?? c.employeeName ?? "")}
                          </div>
                          <p className="truncate font-semibold text-slate-800">
                            {c.staffName ?? c.employeeName ?? `#${c.employeeId}`}
                          </p>
                        </div>
                      </td>
                      <td className="font-mono text-[11px] text-slate-500">
                        {c.contractCode ?? "—"}
                      </td>
                      <td className="text-slate-600">{humanize(c.contractType)}</td>
                      <td className="text-xs tabular-nums text-slate-600">
                        {fmtDate(c.effectiveDate)}
                      </td>
                      <td>
                        <ExpiryChip expirationDate={c.expirationDate} />
                      </td>
                      <td>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            meta.cls,
                          )}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={busy}
                            onClick={() => void handleRenew(c)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                              "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 shadow-sm",
                              busy && "opacity-60 cursor-wait",
                            )}
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CalendarClock className="h-3.5 w-3.5" />
                            )}
                            Renew
                          </button>
                          <button
                            disabled={busy || expired}
                            onClick={() => void handleExpire(c)}
                            title={expired ? "Already expired" : undefined}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                              "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-400 shadow-sm",
                              (busy || expired) && "opacity-50 cursor-not-allowed",
                            )}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Let Expire
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
