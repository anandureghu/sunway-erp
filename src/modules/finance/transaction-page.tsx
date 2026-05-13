"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ReceiptText, Search } from "lucide-react";
import { TRANSACTION_COLUMNS } from "@/lib/columns/finance/transaction-columns";
import type { TransactionResponseDTO } from "@/types/transactions";

export default function TransactionPage({ companyId }: { companyId: number }) {
  const [txList, setTxList] = useState<TransactionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await apiClient.get<TransactionResponseDTO[]>(
        `/finance/transactions/company/${companyId}`,
      );
      setTxList(data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleSourceSave = async (id: number, source: string) => {
    try {
      await apiClient.patch(`/finance/transactions/${id}/source`, { source });
      toast.success("Source saved");
      await load();
    } catch (err: unknown) {
      console.error(err);
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String((err.response.data as { message?: string }).message)
          : "Could not update source";
      toast.error(msg);
      throw err;
    }
  };

  const columns = TRANSACTION_COLUMNS({
    onSourceSave: handleSourceSave,
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg" asChild>
            <Link to="/dashboard" aria-label="Back to dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <ReceiptText className="h-5 w-5" />
          <span className="text-lg font-semibold">Transactions</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 border-b bg-white">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search transactions..." className="pl-10" />
        </div>
      </div>

      <div className="p-4">
        <DataTable data={txList} columns={columns} />
      </div>
    </div>
  );
}
