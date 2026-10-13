"use client";

import { useCallback, useMemo, useState } from "react";
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
import { bulkArchiveHistoryRecords } from "@/service/historyService";
import { ImportTransactionsCsvDialog } from "@/modules/finance/import-transactions-csv-dialog";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import type { PageResult } from "@/types/page";

const BUDGET_DISTRIBUTION_TYPE = "BUDGET_DISTRIBUTION";

function historyTypeForTransaction(
  tx: TransactionResponseDTO,
): HistoryEntityType {
  return (tx.transactionType ?? "").toUpperCase() === BUDGET_DISTRIBUTION_TYPE
    ? "BUDGET_DISTRIBUTION"
    : "TRANSACTION";
}

export default function TransactionPage({ companyId }: { companyId: number }) {
  const { confirm } = useConfirmDialog();
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);

  const fetcher = useCallback(
    async ({
      page,
      size,
      search,
    }: {
      page: number;
      size: number;
      search: string;
    }): Promise<PageResult<TransactionResponseDTO>> => {
      const res = await apiClient.get<PageResult<TransactionResponseDTO>>(
        `/finance/transactions/company/${companyId}`,
        {
          params: {
            search: search || undefined,
            page,
            size,
          },
        },
      );
      return res.data;
    },
    [companyId],
  );

  const {
    rows: txList,
    loading,
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    pageCount,
    reload,
  } = useServerPagedList<TransactionResponseDTO>({
    fetcher,
    enabled: !!companyId,
    errorMessage: "Failed to load transactions",
  });

  const handleSourceSave = async (id: number, source: string) => {
    try {
      await apiClient.patch(`/finance/transactions/${id}/source`, { source });
      toast.success("Source saved");
      reload();
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
        await apiClient.post<TransactionResponseDTO>(
          `/finance/transactions/${tx.id}/archive`,
        );
        toast.success("Transaction archived");
        reload();
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        toast.error(
          ax?.response?.data?.message ||
            (err instanceof Error
              ? err.message
              : "Failed to archive transaction"),
        );
      } finally {
        setArchivingId(null);
      }
    },
    [confirm, reload],
  );

  const columns = useMemo(
    () =>
      TRANSACTION_COLUMNS({
        onSourceSave: handleSourceSave,
        onArchive: handleArchive,
        archivingId,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [archivingId, handleArchive],
  );

  const selectedTransactions = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => txList.find((tx) => String(tx.id) === id))
        .filter((tx): tx is TransactionResponseDTO => tx != null),
    [txList, rowSelection],
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
      reload();
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
  }, [confirm, reload, selectedTransactions]);

  return (
    <GlTabPanel
      title="Transactions"
      icon={<ReceiptText className="h-5 w-5" />}
      searchPlaceholder="Search transactions..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      loading={loading}
      loadingMessage="Loading transactions…"
      actions={<ImportTransactionsCsvDialog onImported={reload} />}
    >
      <div className="space-y-4">
        <BulkActionBar
          selectedCount={selectedTransactions.length}
          onArchive={handleBulkArchive}
          onClear={() => setRowSelection({})}
          archiving={bulkArchiving}
        />
        <SelectableDataTable
          data={txList}
          columns={columns}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => String(row.id)}
          isRowSelectable={(row) => !row.archived}
          serverPagination={{
            total: totalElements,
            pageIndex: page,
            pageSize,
            pageCount,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </div>
    </GlTabPanel>
  );
}
