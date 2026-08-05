import { useCallback, useEffect, useState } from "react";
import { loanService, type PendingLoanApproval } from "@/service/loanService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  DollarSign,
  Loader2,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatMoney, initialsFrom } from "@/lib/utils";
import { humanizeLoanType } from "@/lib/loan-type-label";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { RejectReasonDialog } from "@/modules/hr/components/reject-reason-dialog";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

export default function LoanApprovalPanel() {
  const { permissions, permissionsLoading, company } = useAuth();
  const { confirm } = useConfirmDialog();

  const [pending, setPending] = useState<PendingLoanApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<number | null>(null);
  const [decidingApprove, setDecidingApprove] = useState<boolean | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingLoanApproval | null>(
    null,
  );

  const {
    pageItems,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageCount,
    total,
  } = usePagination(pending, 10);

  // Permission-driven gate. ADMIN bypass via permissions === null.
  const canApprove =
    permissions === null ||
    !!(permissions?.LOANS?.approve || permissions?.LOANS?.APPROVE);

  const loadPending = useCallback(async () => {
    if (!canApprove) {
      setPending([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await loanService.fetchPendingApprovals();
      setPending(res.data ?? []);
    } catch (err: any) {
      console.error("LoanApprovalPanel -> load failed", err);
      const status = err?.response?.status;
      if (status === 403) {
        toast.error("You don't have permission to view loan approvals");
      } else {
        toast.error(
          err?.response?.data?.message ?? "Failed to load pending loans",
        );
      }
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, [canApprove]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const handleDecision = async (
    loan: PendingLoanApproval,
    approve: boolean,
    comment?: string,
  ) => {
    setDecidingId(loan.id);
    setDecidingApprove(approve);
    try {
      await loanService.decideLoan(loan.employeeId, loan.id, approve, comment);
      toast.success(
        approve
          ? `Loan ${loan.loanCode} approved`
          : `Loan ${loan.loanCode} rejected`,
      );
      setPending((prev) => prev.filter((l) => l.id !== loan.id));
      setRejectTarget(null);
    } catch (err: any) {
      console.error("LoanApprovalPanel -> decision failed", err);
      const status = err?.response?.status;
      if (status === 403) {
        toast.error("You don't have permission to approve loans");
      } else {
        toast.error(err?.response?.data?.message ?? "Failed to update loan");
      }
    } finally {
      setDecidingId(null);
      setDecidingApprove(null);
    }
  };

  const confirmReject = (comment: string) => {
    if (rejectTarget) void handleDecision(rejectTarget, false, comment || undefined);
  };

  if (permissionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-7 w-7 text-amber-400 animate-spin" />
        <p className="text-sm text-slate-500">Checking permissions…</p>
      </div>
    );
  }

  if (!canApprove) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-7 w-7 text-rose-400" />
        <div className="text-center">
          <p className="text-base font-semibold text-slate-700">
            Access Restricted
          </p>
          <p className="text-sm text-slate-400 mt-1">
            You need the LOANS Approve permission to review loan requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SecondaryPageHeader
        title="Loan Approvals"
        description="Review and approve employee loan requests"
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadPending()}
            disabled={loading}
            className="rounded-lg"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
          <p className="text-sm text-slate-500">Loading pending loans…</p>
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white rounded-xl border border-slate-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <DollarSign className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-base font-semibold text-slate-700">
            No pending loans
          </p>
          <p className="text-sm text-slate-400">
            All caught up — there are no loan requests waiting for approval.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {total} pending request{total !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "Sl No.",
                    "Employee",
                    "Loan Type",
                    "Amount",
                    "Period",
                    "Monthly",
                    "Start Date",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider text-slate-500",
                        header === "Sl No." && "w-12",
                        header === "Amount" ||
                          header === "Period" ||
                          header === "Monthly" ||
                          header === "Actions"
                          ? "text-right"
                          : "text-left",
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((loan, index) => {
                  const currency =
                    loan.currencyCode || company?.currency?.currencyCode || "";
                  const busy = decidingId === loan.id;
                  const isApproving = busy && decidingApprove === true;
                  const isRejecting = busy && decidingApprove === false;
                  return (
                    <tr
                      key={loan.id}
                      className={cn(
                        "border-b border-slate-100 transition-colors hover:bg-slate-50/60",
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                      )}
                    >
                      <td className="text-xs tabular-nums text-slate-500">
                        {pageIndex * pageSize + index + 1}
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-white text-xs font-bold shadow-sm">
                            {initialsFrom(loan.employeeName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {loan.employeeName}
                            </p>
                            {loan.loanCode && (
                              <p className="whitespace-nowrap font-mono text-[11px] text-slate-400">
                                {loan.loanCode}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                          {humanizeLoanType(loan.loanType)}
                        </span>
                      </td>
                      <td className="text-right font-medium text-slate-800">
                        {formatMoney(String(loan.loanAmount), currency)}
                      </td>
                      <td className="text-right text-slate-600">
                        {loan.loanPeriod} mo
                      </td>
                      <td className="text-right text-slate-600">
                        {formatMoney(String(loan.monthlyDeduction), currency)}
                      </td>
                      <td className="text-xs tabular-nums text-slate-600">
                        {loan.startDate
                          ? new Date(loan.startDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={busy}
                            onClick={async () => {
                              if (
                                await confirm({
                                  title: "Approve loan",
                                  description: `Approve loan ${loan.loanCode} for ${loan.employeeName}? A monthly deduction will be scheduled.`,
                                  confirmLabel: "Approve",
                                })
                              ) {
                                void handleDecision(loan, true);
                              }
                            }}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                              "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 shadow-sm",
                              busy && "opacity-60 cursor-wait",
                            )}
                          >
                            {isApproving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ThumbsUp className="h-3.5 w-3.5" />
                            )}
                            {isApproving ? "Approving..." : "Approve"}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => setRejectTarget(loan)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                              "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-400 shadow-sm",
                              busy && "opacity-60 cursor-wait",
                            )}
                          >
                            {isRejecting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ThumbsDown className="h-3.5 w-3.5" />
                            )}
                            {isRejecting ? "Rejecting..." : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
        </div>
      )}

      <RejectReasonDialog
        open={!!rejectTarget}
        subject={rejectTarget ? `loan ${rejectTarget.loanCode}` : undefined}
        loading={decidingId != null && decidingId === rejectTarget?.id}
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmReject}
      />
    </div>
  );
}
