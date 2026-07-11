import { useCallback, useEffect, useState } from "react";
import { loanService, type PendingLoanApproval } from "@/service/loanService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  Check,
  DollarSign,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { humanizeLoanType } from "@/lib/loan-type-label";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { RejectReasonDialog } from "@/modules/hr/components/reject-reason-dialog";

export default function LoanApprovalPanel() {
  const { permissions, permissionsLoading } = useAuth();

  const [pending, setPending] = useState<PendingLoanApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<number | null>(null);
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
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Loan Code</th>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Period</th>
                <th className="px-4 py-3 text-right">Monthly</th>
                <th className="px-4 py-3 text-left">Start</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((loan) => {
                const currency = loan.currencySymbol ?? loan.currencyCode ?? "";
                const busy = decidingId === loan.id;
                return (
                  <tr key={loan.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {loan.loanCode}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {loan.employeeName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {humanizeLoanType(loan.loanType)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-800 font-medium">
                      {formatMoney(String(loan.loanAmount), currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {loan.loanPeriod} mo
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatMoney(String(loan.monthlyDeduction), currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {loan.startDate
                        ? new Date(loan.startDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => handleDecision(loan, true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => setRejectTarget(loan)}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
