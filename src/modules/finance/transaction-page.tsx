"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { ReceiptText } from "lucide-react";
import { TRANSACTION_COLUMNS } from "@/lib/columns/finance/transaction-columns";
import type { TransactionResponseDTO } from "@/types/transactions";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type TransactionListTab = "active" | "archived";

export default function TransactionPage({ companyId }: { companyId: number }) {
  const { confirm } = useConfirmDialog();
  const [txList, setTxList] = useState<TransactionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [listTab, setListTab] = useState<TransactionListTab>("active");
  const [archivingId, setArchivingId] = useState<number | null>(null);

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

  const handleArchive = useCallback(
    async (tx: TransactionResponseDTO) => {
      if (tx.archived) {
        toast.error("Transaction is already archived.");
        return;
      }
      const label = tx.transactionCode ?? `#${tx.id}`;
      if (!(await confirm(`Archive transaction ${label}?`))) return;
      setArchivingId(tx.id);
      try {
        const res = await apiClient.post<TransactionResponseDTO>(
          `/finance/transactions/${tx.id}/archive`,
        );
        setTxList((prev) =>
          prev.map((row) => (row.id === tx.id ? res.data : row)),
        );
        toast.success("Transaction archived");
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        toast.error(
          ax?.response?.data?.message ||
            (err instanceof Error ? err.message : "Failed to archive transaction"),
        );
      } finally {
        setArchivingId(null);
      }
    },
    [],
  );

  const columns = useMemo(
    () =>
      TRANSACTION_COLUMNS({
        onSourceSave: handleSourceSave,
        onArchive: listTab === "active" ? handleArchive : undefined,
        archivingId,
      }),
    [archivingId, handleArchive, listTab],
  );

  const activeCount = useMemo(
    () => txList.filter((tx) => !tx.archived).length,
    [txList],
  );
  const archivedCount = useMemo(
    () => txList.filter((tx) => tx.archived).length,
    [txList],
  );

  const filteredTx = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return txList.filter((tx) => {
      const matchesTab =
        listTab === "archived" ? Boolean(tx.archived) : !tx.archived;
      if (!matchesTab) return false;
      if (!q) return true;
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
  }, [txList, searchQuery, listTab]);

  return (
    <GlTabPanel
      title="Transactions"
      icon={<ReceiptText className="h-5 w-5" />}
      searchPlaceholder="Search transactions..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      loading={loading}
      loadingMessage="Loading transactions…"
      toolbarExtra={
        <Tabs
          value={listTab}
          onValueChange={(value) => setListTab(value as TransactionListTab)}
        >
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              Active
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5">
                {activeCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              Archived
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5">
                {archivedCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <DataTable data={filteredTx} columns={columns} />
    </GlTabPanel>
  );
}
