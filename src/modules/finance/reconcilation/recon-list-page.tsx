// src/pages/admin/finance/ReconciliationListPage.tsx

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { RECONCILIATION_COLUMNS } from "@/lib/columns/finance/reconciliation-columns";
import { ReconciliationDialog } from "@/modules/finance/reconcilation/recon-dialog";
import type { Reconciliation } from "@/types/finance/reconcilation";

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reconciliations</h1>

        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Add Reconciliation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reconciliations..."
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>

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
