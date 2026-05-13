// src/pages/admin/chartOfAccounts/ChartOfAccountsListPage.tsx
import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Layers, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { ChartOfAccounts } from "@/types/finance/chart-of-accounts";
import { CHART_OF_ACCOUNTS_COLUMNS } from "@/lib/columns/finance/chart-of-accounts-columns";
import { useAuth } from "@/context/AuthContext";
import { ChartOfAccountsDialog } from "@/modules/finance/chart-of-accounts/coa-dialog";
import { Link } from "react-router-dom";

export default function ChartOfAccountsListPage() {
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ChartOfAccounts | null>(null);
  const [open, setOpen] = useState(false);

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

  if (loading)
    return <p className="text-center text-muted-foreground p-10">Loading...</p>;

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg" asChild>
            <Link to="/dashboard" aria-label="Back to dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <Layers className="h-5 w-5" />
          <span className="text-lg font-semibold">Chart Of Accounts</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b bg-white">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search chart of accounts..." className="pl-10" />
        </div>
        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Chart of Account
        </Button>
      </div>

      <div className="p-4">
        <DataTable columns={columns} data={chartOfAccounts} />
      </div>

      <ChartOfAccountsDialog
        open={open}
        onOpenChange={setOpen}
        coa={selected}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
