// src/pages/admin/finance/ReconciliationListPage.tsx

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { RECONCILIATION_COLUMNS } from "@/lib/columns/finance/reconciliation-columns";
import { ReconciliationDialog } from "@/modules/finance/reconcilation/recon-dialog";
import type { Reconciliation } from "@/types/finance/reconcilation";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";

export default function ReconciliationListPage() {
  const [data, setData] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reconciliation | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const res = await apiClient.get("/finance/reconciliations");
      setData(res.data.content ?? res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch reconciliations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (rec: Reconciliation) => {
    setSelected(rec);
    setOpen(true);
  };

  const handleConfirm = async (rec: Reconciliation) => {
    try {
      await apiClient.put(`/finance/reconciliations/${rec.id}/confirm`);
      toast.success("Reconciliation confirmed");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to confirm", {
        description: err?.response?.data?.message,
      });
    }
  };

  const handleSuccess = (updated: Reconciliation, mode: "add" | "edit") => {
    if (mode === "add") {
      setData((prev) => [updated, ...prev]);
    } else {
      setData((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    }
  };

  const columns = RECONCILIATION_COLUMNS({
    onEdit: handleEdit,
    onConfirm: handleConfirm,
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data;
    return data.filter((rec) =>
      [rec.accountName, rec.accountCode, rec.status, rec.reason]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, searchQuery]);

  return (
    <>
      <GlTabPanel
        title="Reconcile"
        description="Match bank and ledger balances for cash accounts."
        icon={<CheckSquare className="h-5 w-5" />}
        searchPlaceholder="Search reconciliations..."
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
            Add reconciliation
          </Button>
        }
      >
        <DataTable columns={columns} data={filtered} />
      </GlTabPanel>

      <ReconciliationDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setSelected(null);
        }}
        reconciliation={selected}
        onSuccess={handleSuccess}
      />
    </>
  );
}
