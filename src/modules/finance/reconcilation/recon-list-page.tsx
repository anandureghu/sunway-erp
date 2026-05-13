// src/pages/admin/finance/ReconciliationListPage.tsx

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckSquare, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { RECONCILIATION_COLUMNS } from "@/lib/columns/finance/reconciliation-columns";
import { ReconciliationDialog } from "@/modules/finance/reconcilation/recon-dialog";
import type { Reconciliation } from "@/types/finance/reconcilation";
import { Link } from "react-router-dom";

export default function ReconciliationListPage() {
  const [data, setData] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reconciliation | null>(null);
  const [open, setOpen] = useState(false);

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

  // ======================
  // Handlers
  // ======================

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

  if (loading)
    return <p className="text-center text-muted-foreground p-10">Loading...</p>;

  const columns = RECONCILIATION_COLUMNS({
    onEdit: handleEdit,
    onConfirm: handleConfirm,
  });

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg" asChild>
            <Link to="/dashboard" aria-label="Back to dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <CheckSquare className="h-5 w-5" />
          <span className="text-lg font-semibold">Reconcile</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b bg-white">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search reconciliations..." className="pl-10" />
        </div>
        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reconciliation
        </Button>
      </div>

      <div className="p-4">
        <DataTable columns={columns} data={data} />
      </div>

      <ReconciliationDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setSelected(null);
        }}
        reconciliation={selected}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
