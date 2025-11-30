"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GLAccountBalance } from "@/types/gl";
import { GL_BALANCE_COLUMNS } from "@/lib/columns/finance/gl-baance-columns";
import { GLBalanceDialog } from "@/modules/finance/gl-balance-dialog";

export default function GLBalancePage() {
  const [records, setRecords] = useState<GLAccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GLAccountBalance | null>(null);
  const [open, setOpen] = useState(false);

  const fetchBalances = async () => {
    try {
      const res = await apiClient.get(`/finance/gl/all`);
      setRecords(res.data);
    } catch (error) {
      console.error("Error loading GL Balances:", error);
      toast.error("Failed to load GL Balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const handleDialogSuccess = (
    updated: GLAccountBalance,
    mode: "add" | "edit"
  ) => {
    if (mode === "add") {
      setRecords((prev) => [...prev, updated]);
    } else {
      setRecords((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    }
    setSelected(null);
  };

  const handleEdit = (data: GLAccountBalance) => {
    setSelected(data);
    setOpen(true);
  };

  const handleDelete = async (data: GLAccountBalance) => {
    try {
      await apiClient.delete(`/finance/gl/balance/${data.id}`);
      toast.success("Deleted GL Balance");

      setRecords((prev) => prev.filter((i) => i.id !== data.id));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete");
    }
  };

  const columns = GL_BALANCE_COLUMNS({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">GL Account Balances</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." className="pl-10" />
            </div>

            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Add Balance
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={records} />
        </CardContent>
      </Card>

      <GLBalanceDialog
        open={open}
        onOpenChange={setOpen}
        data={selected}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
