// src/pages/admin/finance/JournalEntryListPage.tsx

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { JOURNAL_ENTRY_COLUMNS } from "@/lib/columns/finance/journal-entry-columns";
import { JournalEntryDialog } from "@/modules/finance/journal-entry/je-dialog";
import type { JournalEntry } from "@/types/finance/journal-entry";
import { BookOpen, Plus } from "lucide-react";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";

export default function JournalEntryListPage() {
  const [data, setData] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const res = await apiClient.get("/finance/journal-entries");
      setData(res.data.content ?? res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entry: JournalEntry) => {
    await apiClient.put(`/finance/journal-entries/${entry.id}/approve`);
    fetchData();
  };

  const handleReject = async (entry: JournalEntry) => {
    await apiClient.put(`/finance/journal-entries/${entry.id}/reject`);
    fetchData();
  };

  const handleHold = async (entry: JournalEntry) => {
    await apiClient.put(`/finance/journal-entries/${entry.id}/hold`);
    fetchData();
  };

  const handleEdit = (entry: JournalEntry) => {
    setSelected(entry);
    setOpen(true);
  };

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
  });

  useEffect(() => {
    fetchData();
  }, []);

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
