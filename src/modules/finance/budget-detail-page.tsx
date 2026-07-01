"use client";

import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/datatable";

import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

import { BUDGET_DISTRIBUTION_COLUMNS } from "@/lib/columns/finance/budget-distribution-columns";

import type {
  BudgetDistributionResponseDTO,
  BudgetResponseDTO,
} from "@/types/budget";
import { BudgetDistributeDialog } from "./budget-distribute-dialog";
import { ArrowLeft, Archive, Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/lib/status-badge";
import { CreditAmount } from "@/components/accounting-amount";
import { Badge } from "@/components/ui/badge";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

export default function BudgetDetailPage() {
  const { confirm } = useConfirmDialog();
  const { id } = useParams();
  const { company } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<BudgetResponseDTO | null>(null);
  const [distributions, setDistributions] = useState<
    BudgetDistributionResponseDTO[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [distributeOpen, setDistributeOpen] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const fetchOne = async () => {
    try {
      const res = await apiClient.get(`/finance/budgets/${id}`);
      setData(res.data);
    } catch {
      toast.error("Failed to load budget");
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributions = useCallback(async () => {
    if (!id) return;
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (showArchived) params.set("archived", "true");
      else params.set("archived", "false");

      const res = await apiClient.get<BudgetDistributionResponseDTO[]>(
        `/finance/budgets/${id}/distributions?${params.toString()}`,
      );
      setDistributions(res.data);
    } catch {
      toast.error("Failed to load distributions");
    }
  }, [id, fromDate, toDate, showArchived]);

  useEffect(() => {
    fetchOne();
  }, [id]);

  useEffect(() => {
    fetchDistributions();
  }, [fetchDistributions]);

  const handleArchive = async () => {
    if (!fromDate || !toDate) {
      toast.error("Select a date range to archive");
      return;
    }
    if (
      !(await confirm(
        `Archive all distribution transactions between ${fromDate} and ${toDate}? GL balances will not be reversed.`,
      ))
    ) {
      return;
    }
    try {
      const res = await apiClient.post(
        `/finance/budgets/${id}/distributions/archive?from=${fromDate}&to=${toDate}`,
      );
      toast.success(`Archived ${res.data} transaction(s)`);
      fetchDistributions();
    } catch {
      toast.error("Failed to archive transactions");
    }
  };

  const columns = BUDGET_DISTRIBUTION_COLUMNS(company!);

  const remaining =
    data?.remainingAmount ??
    (data?.amount ?? 0) - (data?.distributedAmount ?? 0);

  const canDistribute =
    data?.status === "APPROVED" && data?.isActive !== false;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading budget…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Budget not found</p>
        <Button variant="outline" onClick={() => navigate("/finance/ledger")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/finance/ledger")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{data.budgetName}</h1>
          <p className="text-sm text-muted-foreground">
            Budget distribution history
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{data.budgetType ?? "OPEX"}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreditAmount
              amount={Number(data.amount ?? 0)}
              currencyCode={company?.currency?.currencyCode}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreditAmount
              amount={Number(remaining)}
              currencyCode={company?.currency?.currencyCode}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={data.status} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Distribution transactions</CardTitle>
          {canDistribute && (
            <Button onClick={() => setDistributeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Distribute Budget
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                From
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                To
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button variant="outline" onClick={fetchDistributions}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button
              variant={showArchived ? "secondary" : "outline"}
              onClick={() => setShowArchived((v) => !v)}
            >
              {showArchived ? "Showing archived" : "Show archived"}
            </Button>
            <Button
              variant="outline"
              disabled={!fromDate || !toDate}
              onClick={handleArchive}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive range
            </Button>
          </div>

          <DataTable data={distributions} columns={columns} />
        </CardContent>
      </Card>

      <BudgetDistributeDialog
        open={distributeOpen}
        onOpenChange={setDistributeOpen}
        budget={data}
        onSuccess={() => {
          fetchOne();
          fetchDistributions();
        }}
      />

    </div>
  );
}
