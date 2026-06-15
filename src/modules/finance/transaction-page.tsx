"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { ReceiptText } from "lucide-react";
import { TRANSACTION_COLUMNS } from "@/lib/columns/finance/transaction-columns";
import type { TransactionResponseDTO } from "@/types/transactions";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";

export default function TransactionPage({ companyId }: { companyId: number }) {
  const [txList, setTxList] = useState<TransactionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredTx = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return txList;
    return txList.filter((tx) => {
      const haystack = [
        tx.transactionCode,
        tx.transactionType,
        tx.transactionDescription,
        tx.debitAccountCode,
        tx.debitAccountName,
        tx.creditAccountCode,
        tx.creditAccountName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [txList, searchQuery]);

  return (
    <GlTabPanel
      title="Transactions"
      icon={<ReceiptText className="h-5 w-5" />}
      searchPlaceholder="Search transactions..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      loading={loading}
      loadingMessage="Loading transactions…"
    >
      <DataTable data={filteredTx} columns={columns} />
    </GlTabPanel>
  );
}
