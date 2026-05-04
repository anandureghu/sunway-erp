// src/pages/admin/finance/JournalEntryListPage.tsx

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { JOURNAL_ENTRY_COLUMNS } from "@/lib/columns/finance/journal-entry-columns";
import { JournalEntryDialog } from "@/modules/finance/journal-entry/je-dialog";
import type { JournalEntry } from "@/types/finance/journal-entry";

export default function JournalEntryListPage() {
  const [data, setData] = useState<JournalEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  const fetchData = async () => {
    const res = await apiClient.get("/finance/journal-entries");
    setData(res.data.content ?? res.data);
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

  return (
    <div className="p-0 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Journal Entries</h1>
        <Button onClick={() => setOpen(true)}>Add Journal Entry</Button>
      </div>

      <DataTable columns={columns} data={data} />

      <JournalEntryDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
        entry={selected}
      />
    </div>
  );
}
