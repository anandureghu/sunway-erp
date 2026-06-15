import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Calculator, Plus } from "lucide-react";

import { DataTable } from "@/components/datatable";

import type { Row } from "@tanstack/react-table";
import type { BudgetResponseDTO } from "@/types/budget";
import { BUDGET_COLUMNS } from "@/lib/columns/finance/budget-columns";
import { BudgetDialog } from "./budget-dialog";
import { BudgetDistributeDialog } from "./budget-distribute-dialog";
import { useAuth } from "@/context/AuthContext";
import { hasAnyRole } from "@/lib/utils";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";
import { fetchCOAAccounts } from "@/service/coaService";
import type { ChartOfAccounts } from "@/types/coa";

export default function BudgetPage({ companyId }: { companyId: number }) {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [list, setList] = useState<BudgetResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BudgetResponseDTO | null>(null);
  const [distributeTarget, setDistributeTarget] =
    useState<BudgetResponseDTO | null>(null);
  const [open, setOpen] = useState(false);
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasBudgetAccount, setHasBudgetAccount] = useState<boolean | null>(
    null,
  );

  const fetchAll = async () => {
    apiClient
      .get(`/finance/budgets`)
      .then(({ data }) => {
        setList(data);
      })
      .catch(() => toast.error("Failed to load budgets"))
      .finally(() => setLoading(false));
  };

  const handleRowClick = (row: Row<BudgetResponseDTO>) => {
    const budget = row.original;
    if (budget.status === "APPROVED" && budget.isActive !== false) {
      navigate(`/finance/budgets/${budget.id}`);
    } else {
      toast.warning("Only active approved budgets can be opened");
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchCOAAccounts().then((data) => {
      if (!data) return;
      const count = (data as ChartOfAccounts[]).filter(
        (a) => a.type === "BUDGET",
      ).length;
      setHasBudgetAccount(count > 0);
    });
  }, []);

  const canManageBudget = hasAnyRole(user?.role, [
    "FINANCE_MANAGER",
    "SUPER_ADMIN",
  ]);
  const showBudgetAccountWarning = hasBudgetAccount === false;

  const columns = BUDGET_COLUMNS({
    onRevise: (row) => {
      setSelected(row);
      setOpen(true);
    },
    onDistribute: (row) => {
      setDistributeTarget(row);
      setDistributeOpen(true);
    },
    onApprove: async (row) => {
      try {
        const res = await apiClient.post(`/finance/budgets/${row.id}/activate`);
        toast.success("Budget activated successfully");
        setList((prev) => prev.map((x) => (x.id === row.id ? res.data : x)));
      } catch {
        toast.error("Failed to activate budget");
      }
    },
    onReject: async (row) => {
      try {
        await apiClient.post(`/finance/budgets/${row.id}/close`);
        toast.success("Budget plan rejected successfully");
        fetchAll();
      } catch {
        toast.error("Failed to reject budget");
      }
    },
    onHold: async (row) => {
      try {
        const res = await apiClient.post(`/finance/budgets/${row.id}/hold`);
        toast.success("Budget marked as hold");
        setList((prev) => prev.map((x) => (x.id === row.id ? res.data : x)));
      } catch {
        toast.error("Failed to mark budget hold");
      }
    },
    company: company!,
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((budget) =>
      [
        budget.budgetName,
        budget.status,
        budget.fiscalYear,
        budget.budgetType,
        budget.projectId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [list, searchQuery]);

  return (
    <>
      <GlTabPanel
        title="Budgets"
        description="Plan and track spending against approved budget periods."
        icon={<Calculator className="h-5 w-5" />}
        searchPlaceholder="Search budgets..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        loading={loading}
        toolbarExtra={
          showBudgetAccountWarning ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>
                No budget account exists in Chart of Accounts. Create a{" "}
                <span className="font-medium">Budget Account</span> under the
                Chart Of Accounts tab before adding budgets.
              </p>
            </div>
          ) : undefined
        }
        actions={
          canManageBudget ? (
            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
              disabled={showBudgetAccountWarning}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add budget
            </Button>
          ) : undefined
        }
      >
        <DataTable
          data={filtered}
          columns={columns}
          onRowClick={handleRowClick}
        />
      </GlTabPanel>

      <BudgetDialog
        companyId={companyId || 0}
        open={open}
        onOpenChange={setOpen}
        data={selected}
        onSuccess={() => {
          fetchAll();
        }}
      />

      <BudgetDistributeDialog
        open={distributeOpen}
        onOpenChange={setDistributeOpen}
        budget={distributeTarget}
        onSuccess={() => {
          fetchAll();
        }}
      />
    </>
  );
}
