"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { ReceiptText } from "lucide-react";
import { TRANSACTION_COLUMNS } from "@/lib/columns/finance/transaction-columns";
import type { TransactionResponseDTO } from "@/types/transactions";
import type { HistoryEntityType } from "@/types/history";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";
import {
  bulkArchiveHistoryRecords,
} from "@/service/historyService";

const BUDGET_DISTRIBUTION_TYPE = "BUDGET_DISTRIBUTION";

function historyTypeForTransaction(tx: TransactionResponseDTO): HistoryEntityType {
  return (tx.transactionType ?? "").toUpperCase() === BUDGET_DISTRIBUTION_TYPE
    ? "BUDGET_DISTRIBUTION"
    : "TRANSACTION";
}

export default function TransactionPage({ companyId }: { companyId: number }) {
  const { confirm } = useConfirmDialog();
  const [txList, setTxList] = useState<TransactionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);

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
    [confirm],
  );

  const columns = useMemo(
    () =>
      TRANSACTION_COLUMNS({
        onSourceSave: handleSourceSave,
        onArchive: handleArchive,
        archivingId,
      }),
    [archivingId, handleArchive],
  );

  const filteredTx = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return txList.filter((tx) => {
      if (tx.archived) return false;
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
  }, [txList, searchQuery]);

  const selectedTransactions = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => filteredTx.find((tx) => String(tx.id) === id))
        .filter((tx): tx is TransactionResponseDTO => tx != null),
    [filteredTx, rowSelection],
  );

  const handleBulkArchive = useCallback(async () => {
    if (selectedTransactions.length === 0) return;
    if (
      !(await confirm(
        `Archive ${selectedTransactions.length} selected transaction(s)? They will move to Finance Reports → History.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const grouped = selectedTransactions.reduce<
        Partial<Record<HistoryEntityType, number[]>>
      >((acc, tx) => {
        const type = historyTypeForTransaction(tx);
        acc[type] = [...(acc[type] ?? []), tx.id];
        return acc;
      }, {});

      const results = await Promise.all(
        Object.entries(grouped).map(([type, ids]) =>
          bulkArchiveHistoryRecords(type as HistoryEntityType, ids ?? []),
        ),
      );

      const succeeded = results.reduce(
        (sum, result) => sum + (result.succeeded?.length ?? 0),
        0,
      );
      const failed = results.reduce(
        (sum, result) => sum + (result.failed?.length ?? 0),
        0,
      );

      if (succeeded > 0 && failed === 0) {
        toast.success(
          `${succeeded} record${succeeded === 1 ? "" : "s"} processed successfully.`,
        );
      } else if (succeeded > 0 && failed > 0) {
        toast.success(`${succeeded} succeeded, ${failed} failed.`);
      } else if (failed > 0) {
        toast.error(`${failed} record(s) failed to archive.`);
      } else {
        toast.error("No records processed.");
      }

      setRowSelection({});
      await load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax?.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : "Failed to archive selected transactions."),
      );
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, load, selectedTransactions]);

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
      <div className="space-y-4">
        <BulkActionBar
          selectedCount={selectedTransactions.length}
          onArchive={handleBulkArchive}
          onClear={() => setRowSelection({})}
          archiving={bulkArchiving}
        />
        <SelectableDataTable
          data={filteredTx}
          columns={columns}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => String(row.id)}
          isRowSelectable={(row) => !row.archived}
        />
      </div>
    </GlTabPanel>
  );
}
