"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { TRANSACTION_COLUMNS } from "@/lib/columns/finance/transaction-columns";
import type { TransactionResponseDTO } from "@/types/transactions";
import { TransactionDialog } from "./transaction-dialog";

export default function TransactionPage({ companyId }: { companyId: number }) {
  const [txList, setTxList] = useState<TransactionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TransactionResponseDTO | null>(null);
  const [open, setOpen] = useState(false);

  const fetchAll = async () => {
    apiClient
      .get(`/finance/transactions/company/${companyId}`)
      .then(({ data }) => {
        setTxList(data);
      })
      .catch((error) => {
        console.error("Failed to load transactions:", error);
        toast.error("Failed to load transactions");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAll();
  }, [companyId]);

  const handleDialogSuccess = (
    updated: TransactionResponseDTO,
    mode: "add" | "edit"
  ) => {
    if (mode === "add") setTxList((prev) => [...prev, updated]);
    else
      setTxList((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    setSelected(null);
  };

  const handleEdit = (tx: TransactionResponseDTO) => {
    setSelected(tx);
    setOpen(true);
  };

  const handlePost = async (tx: TransactionResponseDTO) => {
    const fiscalYear = String(new Date(tx.transactionDate).getFullYear());

    try {
      const res = await apiClient.post(
        `/finance/transactions/${tx.id}/post?fiscalYear=${fiscalYear}`
      );

      toast.success("Transaction Posted");

      setTxList((prev) =>
        prev.map((t) => (t.id === res.data.id ? res.data : t))
      );
    } catch (err) {
      console.error(err);
      toast.error("Posting failed");
    }
  };

  const columns = TRANSACTION_COLUMNS({
    onEdit: handleEdit,
    onPost: handlePost,
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." className="pl-10" />
            </div>

            {/* <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Add Transaction
            </Button> */}
          </div>
        </CardHeader>

        <CardContent>
          <DataTable data={txList} columns={columns} />
        </CardContent>
      </Card>

      <TransactionDialog
        open={open}
        onOpenChange={setOpen}
        data={selected}
        companyId={companyId}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
