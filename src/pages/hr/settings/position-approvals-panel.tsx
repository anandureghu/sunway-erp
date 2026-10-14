import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Hourglass,
  Loader2,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { TableCardHeader } from "@/components/table-card-header";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { cn } from "@/lib/utils";
import { jobCodeService } from "@/service/jobCodeService";
import { type JobCode, HOLD_DECISION_LABEL } from "./shared";
import { JobCodeHoldDecisionDialog } from "./job-code-dialogs";

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";

/** Whole days since the hold started. */
const daysWaiting = (since?: string | null) => {
  if (!since) return null;
  const ms = Date.now() - new Date(since).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
};

/**
 * Position approvals — every job code put On Hold "pending approval", in one place.
 * Approve opens the position (Vacant, ready to assign); Reject deactivates the job code.
 */
export function PositionApprovalsPanel({
  onDecided,
}: {
  /** Keeps the Job Codes tab list in step with decisions made here. */
  onDecided?: React.Dispatch<React.SetStateAction<JobCode[]>>;
}) {
  const [pending, setPending] = useState<JobCode[]>([]);
  const [recent, setRecent] = useState<JobCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<{ jc: JobCode; action: "approve" | "reject" } | null>(
    null,
  );

  const { pageItems, pageIndex, setPageIndex, pageSize, setPageSize, pageCount, total } =
    usePagination(pending, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = await jobCodeService.getHoldQueue();
      setPending(q.pending);
      setRecent(q.recent);
    } catch (err: any) {
      toast.error(
        err?.response?.status === 403
          ? "You don't have permission to approve positions"
          : (err?.response?.data?.message ?? "Failed to load position approvals"),
      );
      setPending([]);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (note: string) => {
    if (!target) return;
    const { jc, action } = target;
    try {
      const updated = await jobCodeService.decideHold(jc.id, action, note);
      toast.success(
        action === "approve"
          ? `${jc.code} approved — the position is now vacant and can be assigned`
          : `${jc.code} rejected — the job code has been deactivated`,
      );
      setPending((prev) => prev.filter((p) => p.id !== jc.id));
      setRecent((prev) => [updated, ...prev.filter((p) => p.id !== jc.id)].slice(0, 20));
      onDecided?.((prev) => prev.map((p) => (p.id === jc.id ? updated : p)));
      setTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not update the position");
    }
  };

  return (
    <div className="space-y-5">
      <SecondaryPageHeader
        title="Position Approvals"
        description="Job codes on hold waiting for approval before the position can be filled"
        icon={<ClipboardCheck className="h-5 w-5" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg"
          >
            <RefreshCw className={cn("mr-1 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* How it works — so there's no doubt what each decision does. */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: <Hourglass className="h-4 w-4" />,
            tone: "bg-orange-50 text-orange-600",
            title: "On hold — pending approval",
            body: "HR put the position on hold until it's approved. It can't be assigned to anyone.",
          },
          {
            icon: <ThumbsUp className="h-4 w-4" />,
            tone: "bg-emerald-50 text-emerald-600",
            title: "Approve",
            body: "The position opens: status becomes Vacant and the job code can be assigned.",
          },
          {
            icon: <ThumbsDown className="h-4 w-4" />,
            tone: "bg-rose-50 text-rose-600",
            title: "Reject",
            body: "The position is not approved: the job code is deactivated. A reason is required.",
          },
        ].map((s) => (
          <div key={s.title} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", s.tone)}>
              {s.icon}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-800">{s.title}</p>
              <p className="text-[11px] leading-snug text-slate-500">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <p className="text-sm text-slate-500">Loading positions…</p>
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <ClipboardCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-base font-semibold text-slate-700">No positions waiting</p>
          <p className="text-sm text-slate-400">
            All caught up — no job codes are on hold pending approval.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <TableCardHeader
            title="Awaiting approval"
            meta={`${total} position${total !== 1 ? "s" : ""}`}
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Sl No.", "Job Code", "Department", "Grade", "On Hold Since", "Comments", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider text-slate-500",
                          h === "Sl No." && "w-12",
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
                {pageItems.map((jc, i) => {
                  const days = daysWaiting(jc.holdSince);
                  return (
                    <tr
                      key={jc.id}
                      className={cn(
                        "border-b border-slate-100 transition-colors hover:bg-slate-50/60",
                        i % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                      )}
                    >
                      <td className="text-xs tabular-nums text-slate-500">
                        {pageIndex * pageSize + i + 1}
                      </td>
                      <td>
                        <code className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                          {jc.code}
                        </code>
                        <p className="mt-1 font-medium text-slate-900">{jc.title}</p>
                      </td>
                      <td className="text-slate-700">
                        {jc.departmentName ?? "—"}
                        {jc.divisionName && (
                          <p className="text-[11px] text-slate-400">{jc.divisionName}</p>
                        )}
                      </td>
                      <td className="text-slate-700">{jc.salaryGrade}</td>
                      <td className="whitespace-nowrap text-slate-700">
                        {fmtDate(jc.holdSince)}
                        {days != null && (
                          <p
                            className={cn(
                              "text-[11px]",
                              days >= 14 ? "font-semibold text-rose-600" : "text-slate-400",
                            )}
                          >
                            {days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} waiting`}
                          </p>
                        )}
                      </td>
                      <td className="max-w-[260px] text-xs text-slate-600">
                        <p className="line-clamp-2" title={jc.holdComment ?? ""}>
                          {jc.holdComment ?? "—"}
                        </p>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => setTarget({ jc, action: "reject" })}
                          >
                            <ThumbsDown className="mr-1 h-3.5 w-3.5" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => setTarget({ jc, action: "approve" })}
                          >
                            <ThumbsUp className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > pageSize && (
            <div className="border-t border-slate-100 px-2">
              <TablePagination
                total={total}
                pageIndex={pageIndex}
                pageSize={pageSize}
                pageCount={pageCount}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      )}

      {!loading && recent.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <TableCardHeader
            title="Recent decisions"
            meta={`${recent.length} decision${recent.length !== 1 ? "s" : ""}`}
          />
          <ul className="divide-y divide-slate-100">
            {recent.map((jc) => {
              const rejected = jc.holdDecision === "REJECTED";
              return (
                <li key={jc.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                  <span
                    className={cn(
                      "inline-flex w-20 justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      rejected
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {HOLD_DECISION_LABEL[jc.holdDecision ?? ""] ?? jc.holdDecision}
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-700">{jc.code}</span>
                  <span className="font-medium text-slate-800">{jc.title}</span>
                  <span className="text-xs text-slate-500">
                    {jc.holdDecidedBy ? `by ${jc.holdDecidedBy} · ` : ""}
                    {fmtDate(jc.holdDecidedAt)}
                  </span>
                  {jc.holdDecisionNote && (
                    <span className="basis-full pl-24 text-xs text-slate-500">
                      “{jc.holdDecisionNote}”
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <JobCodeHoldDecisionDialog
        target={target}
        onClose={() => setTarget(null)}
        onConfirm={decide}
      />
    </div>
  );
}
