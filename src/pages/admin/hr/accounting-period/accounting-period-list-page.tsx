// src/pages/admin/accountingPeriods/AccountingPeriodPage.tsx
import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListSearchField, ListToolbar } from "@/components/list-toolbar";
import { Calendar } from "lucide-react";
import type { AccountingPeriod } from "@/types/accounting-period";
import { getAccountingPeriodColumns } from "@/lib/columns/accounting-period-columns";
import { toast } from "sonner";
import { AccountPeriodDialog } from "./accounting-period-dialog";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

export default function AccountingPeriodPage({
  financeSettings,
}: {
  financeSettings?: boolean;
}) {
  const [accountingPeriods, setAccountingPeriods] = useState<
    AccountingPeriod[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { fetchAccountPeriodStatus } = useAuth();

  const fetchAccountingPeriods = async () => {
    try {
      const res = await apiClient.get("/accounting-periods");
      setAccountingPeriods(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingPeriods();
  }, []);

  const handleSuccess = (updated: AccountingPeriod, mode: "add" | "edit") => {
    if (mode === "add") {
      setAccountingPeriods((prev) => [...prev, updated]);
    } else {
      setAccountingPeriods((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
    }
  };

  const handleCloseOrReopen = (
    ap: AccountingPeriod,
    reopen: boolean = false,
  ) => {
    apiClient
      .put(`/accounting-periods/${ap.id}/${reopen ? "reopen" : "close"}`)
      .then(() => {
        toast.success(`successfully closed`, {
          description: `account period ${ap.periodName}`,
        });
        fetchAccountingPeriods();
        fetchAccountPeriodStatus();
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.response.data.message);
      });
  };

  const columns = getAccountingPeriodColumns({
    onCloseOrReopen: handleCloseOrReopen,
  });

  if (loading)
    return <p className="text-center text-muted-foreground p-10">Loading...</p>;

  return (
    <div className={financeSettings ? "space-y-6" : "p-6 space-y-6"}>
      {financeSettings ? (
        <SecondaryPageHeader
          title="Accounting Periods"
          description="Manage your accounting periods"
          icon={<Calendar className="h-5 w-5" />}
        />
      ) : (
        <PageHeader
          title="Accounting Periods"
          description="Manage your accounting periods"
          variant="darkBlue"
          icon={<Calendar className="w-6 h-6" />}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <ListToolbar className="flex-1 px-0 py-0">
              <ListSearchField
                placeholder="Search accounting period..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="sm:max-w-md"
              />
            </ListToolbar>
            <Button
              onClick={() => {
                setOpen(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Add Accounting Period
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={accountingPeriods} />
        </CardContent>
      </Card>

      <AccountPeriodDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
