// src/pages/admin/finance/JournalEntryListPage.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { JOURNAL_ENTRY_COLUMNS } from "@/lib/columns/finance/journal-entry-columns";
import { JournalEntryDialog } from "@/modules/finance/journal-entry/je-dialog";
import type { JournalEntry } from "@/types/finance/journal-entry";
import { BookOpen, Plus } from "lucide-react";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

type JournalListTab = "active" | "archived";

export default function JournalEntryListPage() {
  const { confirm } = useConfirmDialog();
  const [data, setData] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [listTab, setListTab] = useState<JournalListTab>("active");
  const [archivingId, setArchivingId] = useState<number | null>(null);

  const fetchData = useCallback(async (archived: boolean) => {
    try {
      setLoading(true);
      const res = await apiClient.get("/finance/journal-entries", {
        params: { archived, size: 500 },
      });
      setData(res.data.content ?? res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(listTab === "archived");
  }, [fetchData, listTab]);

  const handleApprove = async (entry: JournalEntry) => {
    await apiClient.put(`/finance/journal-entries/${entry.id}/approve`);
    await fetchData(listTab === "archived");
  };

  const handleReject = async (entry: JournalEntry) => {
    await apiClient.put(`/finance/journal-entries/${entry.id}/reject`);
    await fetchData(listTab === "archived");
  };

  const handleHold = async (entry: JournalEntry) => {
    await apiClient.put(`/finance/journal-entries/${entry.id}/hold`);
    await fetchData(listTab === "archived");
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
        await fetchData(listTab === "archived");
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
    [fetchData, listTab],
  );

  const handleSuccess = (updated: JournalEntry, mode: "add" | "edit") => {
    if (mode === "add") {
      setData((prev) => [updated, ...prev]);
      setSelected(null);
    } else {
      setData((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setSelected(null);
    }
  };

  const columns = JOURNAL_ENTRY_COLUMNS({
    onEdit: handleEdit,
    onApprove: handleApprove,
    onReject: handleReject,
    onHold: handleHold,
    onArchive: listTab === "active" ? handleArchive : undefined,
    archivingId,
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data;
    return data.filter((entry) =>
      [entry.jeNumber, entry.description, entry.status, entry.source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, searchQuery]);

  return (
    <>
      <GlTabPanel
        title="Manual Journals"
        description="Create and approve manual journal entries."
        icon={<BookOpen className="h-5 w-5" />}
        searchPlaceholder="Search manual journals..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        loading={loading}
        toolbarExtra={
          <Tabs
            value={listTab}
            onValueChange={(value) => setListTab(value as JournalListTab)}
          >
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived" className="gap-2">
                Archived
                {listTab === "archived" ? (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5">
                    {filtered.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
        actions={
          listTab === "active" ? (
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
          ) : undefined
        }
      >
        <DataTable columns={columns} data={filtered} />
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
