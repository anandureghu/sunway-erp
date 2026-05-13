// src/pages/admin/finance/JournalEntryListPage.tsx

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { JOURNAL_ENTRY_COLUMNS } from "@/lib/columns/finance/journal-entry-columns";
import { JournalEntryDialog } from "@/modules/finance/journal-entry/je-dialog";
import type { JournalEntry } from "@/types/finance/journal-entry";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg" asChild>
            <Link to="/dashboard" aria-label="Back to dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <BookOpen className="h-5 w-5" />
          <span className="text-lg font-semibold">Manual Journals</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b bg-white">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search manual journals..." className="pl-10" />
        </div>
        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Journal Entry
        </Button>
      </div>

      <div className="p-4">
        <DataTable columns={columns} data={data} />
      </div>

      <JournalEntryDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
        entry={selected}
      />
    </div>
  );
}
