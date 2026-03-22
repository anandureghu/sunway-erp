"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Records are created automatically from finance activity (opening balances,
          approved journals, payments, etc.). Use Source to classify unknown entries
          once.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search…" className="pl-10" />
          </div>
        </CardHeader>

        <CardContent>
          <DataTable data={txList} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
