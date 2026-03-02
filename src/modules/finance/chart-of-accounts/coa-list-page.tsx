// src/pages/admin/chartOfAccounts/ChartOfAccountsListPage.tsx
import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { ChartOfAccounts } from "@/types/finance/chart-of-accounts";
import { CHART_OF_ACCOUNTS_COLUMNS } from "@/lib/columns/finance/chart-of-accounts-columns";
import { useAuth } from "@/context/AuthContext";
import { ChartOfAccountsDialog } from "@/modules/finance/chart-of-accounts/coa-dialog";

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Chart Of Accounts</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search division..." className="pl-10" />
            </div>
            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Add Chart of Account
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={chartOfAccounts} />
        </CardContent>
      </Card>

      <ChartOfAccountsDialog
        open={open}
        onOpenChange={setOpen}
        coa={selected}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
