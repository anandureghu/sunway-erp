// src/pages/admin/chartOfAccounts/ChartOfAccountsListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ChartOfAccounts } from "@/types/finance/chart-of-accounts";
import { CHART_OF_ACCOUNTS_COLUMNS } from "@/lib/columns/finance/chart-of-accounts-columns";
import { useAuth } from "@/context/AuthContext";
import { ChartOfAccountsDialog } from "@/modules/finance/chart-of-accounts/coa-dialog";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";

export default function ChartOfAccountsListPage() {
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ChartOfAccounts | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { company } = useAuth();

  const fetchChartOfAccounts = async () => {
    try {
      const res = await apiClient.get("/finance/chart-of-accounts");
      setChartOfAccounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartOfAccounts();
  }, []);

  const handleSuccess = (updated: ChartOfAccounts, mode: "add" | "edit") => {
    if (mode === "add") {
      setChartOfAccounts((prev) => [...prev, updated]);
    } else {
      setChartOfAccounts((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
    }
  };

  const handleEdit = (coa: ChartOfAccounts) => {
    setSelected(coa);
    setOpen(true);
  };

  const handleDelete = async (coa: ChartOfAccounts) => {
    try {
      await apiClient.delete(`/finance/chart-of-accounts/${coa.id}`);
      toast.success(`Deleted ${coa.accountName}`);
      setChartOfAccounts((prev) => prev.filter((d) => d.id !== coa.id));
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete chart of accounts", {
        description: err?.response?.data?.message,
      });
    }
  };

  const columns = CHART_OF_ACCOUNTS_COLUMNS({
    onEdit: handleEdit,
    onDelete: handleDelete,
    company: company!,
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chartOfAccounts;
    return chartOfAccounts.filter((coa) =>
      [coa.accountNo, coa.accountCode, coa.accountName, coa.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [chartOfAccounts, searchQuery]);

  return (
    <>
      <GlTabPanel
        title="Chart of Accounts"
        description="Define and manage your company's account structure."
        icon={<Layers className="h-5 w-5" />}
        searchPlaceholder="Search chart of accounts..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        loading={loading}
        actions={
          <Button
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add account
          </Button>
        }
      >
        <DataTable columns={columns} data={filtered} />
      </GlTabPanel>

      <ChartOfAccountsDialog
        open={open}
        onOpenChange={setOpen}
        coa={selected}
        onSuccess={handleSuccess}
      />
    </>
  );
}
