"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChartOfAccounts } from "@/types/coa";
import { CHART_OF_ACCOUNTS_COLUMNS } from "@/lib/columns/finance/chart-of-accounts-columns";
import { ChartOfAccountDialog } from "./coa-dialog";
import { fetchCOAAccounts } from "@/service/coaService";
import type { Company } from "@/types/company";

export default function ChartOfAccountsPage({
  companyId,
  company,
}: {
  companyId: string;
  company: Company;
}) {
  const [accounts, setAccounts] = useState<ChartOfAccounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ChartOfAccounts | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchCOAAccounts(companyId)
      .then((data) => {
        if (data) setAccounts(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleDialogSuccess = (
    updated: ChartOfAccounts,
    mode: "add" | "edit",
  ) => {
    if (mode === "add") {
      setAccounts((prev) => [...prev, updated]);
    } else {
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === updated.id ? updated : acc)),
      );
    }
    setSelected(null);
  };

  const handleEdit = (account: ChartOfAccounts) => {
    setSelected(account);
    setOpen(true);
  };

  const handleDelete = async (account: ChartOfAccounts) => {
    try {
      await apiClient.delete(`/finance/chart-of-accounts/${account.id}`);
      toast.success(`Deleted ${account.accountName}`);

      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete account");
    }
  };

  const columns = CHART_OF_ACCOUNTS_COLUMNS({
    onEdit: handleEdit,
    onDelete: handleDelete,
    company: company,
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Chart of Accounts</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search account..." className="pl-10" />
            </div>

            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Add Account
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={accounts} />
        </CardContent>
      </Card>

      <ChartOfAccountDialog
        open={open}
        onOpenChange={setOpen}
        account={selected}
        onSuccess={handleDialogSuccess}
        companyId={Number(companyId)}
      />
    </div>
  );
}
