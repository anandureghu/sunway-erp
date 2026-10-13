// src/pages/admin/finance/JournalEntryListPage.tsx

import { useCallback, useMemo, useState } from "react";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { JOURNAL_ENTRY_COLUMNS } from "@/lib/columns/finance/journal-entry-columns";
import { JournalEntryDialog } from "@/modules/finance/journal-entry/je-dialog";
import type { JournalEntry } from "@/types/finance/journal-entry";
import { BookOpen, Plus } from "lucide-react";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";
import { toast } from "sonner";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import type { PageResult } from "@/types/page";

function isJournalEntryArchivable(entry: JournalEntry): boolean {
  return !entry.archived && entry.status !== "PENDING_APPROVAL";
}

export default function JournalEntryListPage() {
  const { confirm } = useConfirmDialog();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
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
    }): Promise<PageResult<JournalEntry>> => {
      const res = await apiClient.get<PageResult<JournalEntry>>(
        "/finance/journal-entries",
        {
          params: {
            archived: false,
            search: search || undefined,
            page,
            size,
          },
        },
      );
      return res.data;
    },
    [],
  );

  const {
    rows: data,
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
  } = useServerPagedList<JournalEntry>({
    fetcher,
    errorMessage: "Failed to load journal entries",
  });

  const handleApprove = async (entry: JournalEntry) => {
    await apiClient.put(`/finance/journal-entries/${entry.id}/approve`);
    reload();
  };

  const handleReject = async (entry: JournalEntry) => {
    await apiClient.put(`/finance/journal-entries/${entry.id}/reject`);
    reload();
  };

  const handleHold = async (entry: JournalEntry) => {
    await apiClient.put(`/finance/journal-entries/${entry.id}/hold`);
    reload();
  };

  const handleEdit = (entry: JournalEntry) => {
    setSelected(entry);
    setOpen(true);
  };

  const handleArchive = useCallback(
    async (entry: JournalEntry) => {
      if (entry.archived) {
        toast.error("Journal entry is already archived.");
        return;
      }
      if (entry.status === "PENDING_APPROVAL") {
        toast.error("Approve, reject, or hold this entry before archiving.");
        return;
      }
      const label = entry.jeNumber ?? `#${entry.id}`;
      if (!(await confirm(`Archive journal entry ${label}?`))) return;
      setArchivingId(entry.id);
      try {
        await apiClient.post(`/finance/journal-entries/${entry.id}/archive`);
        toast.success("Journal entry archived");
        reload();
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        toast.error(
          ax?.response?.data?.message ||
            (err instanceof Error
              ? err.message
              : "Failed to archive journal entry"),
        );
      } finally {
        setArchivingId(null);
      }
    },
    [confirm, reload],
  );

  const selectedEntryIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    [rowSelection],
  );

  const handleBulkArchive = useCallback(async () => {
    if (selectedEntryIds.length === 0) return;
    if (
      !(await confirm(
        `Archive ${selectedEntryIds.length} selected journal entr${selectedEntryIds.length === 1 ? "y" : "ies"}? They will move to Finance Reports → History.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const result = await bulkArchiveHistoryRecords(
        "JOURNAL_ENTRY",
        selectedEntryIds,
      );
      toast.success(summarizeBulkActionResult(result));
      setRowSelection({});
      reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax?.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : "Failed to archive selected journal entries."),
      );
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, reload, selectedEntryIds]);

  const handleSuccess = (_updated: JournalEntry, _mode: "add" | "edit") => {
    setSelected(null);
    reload();
  };

  const columns = JOURNAL_ENTRY_COLUMNS({
    onEdit: handleEdit,
    onApprove: handleApprove,
    onReject: handleReject,
    onHold: handleHold,
    onArchive: handleArchive,
    archivingId,
  });

  return (
    <>
      <GlTabPanel
        title="Manual Journals"
        description="Create and approve manual journal entries."
        icon={<BookOpen className="h-5 w-5" />}
        searchPlaceholder="Search manual journals..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        loading={loading}
        actions={
          <Button
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add journal entry
          </Button>
        }
      >
        <div className="space-y-4">
          <BulkActionBar
            selectedCount={selectedEntryIds.length}
            onArchive={handleBulkArchive}
            onClear={() => setRowSelection({})}
            archiving={bulkArchiving}
          />
          <SelectableDataTable
            columns={columns}
            data={data}
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            getRowId={(row) => String(row.id)}
            isRowSelectable={isJournalEntryArchivable}
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

      <JournalEntryDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
        entry={selected}
      />
    </>
  );
}
