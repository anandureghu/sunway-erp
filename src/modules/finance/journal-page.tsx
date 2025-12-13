import { useEffect, useState } from "react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

import { DataTable } from "@/components/datatable";

import { JOURNAL_COLUMNS } from "@/lib/columns/finance/journal-columns";
import type { JournalEntryResponseDTO } from "@/types/journal";
import { JournalDialog } from "./journal-dialog";
import type { Row } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";

export default function JournalPage({ companyId }: { companyId: number }) {
  const navigate = useNavigate();
  const [list, setList] = useState<JournalEntryResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JournalEntryResponseDTO | null>(
    null
  );
  const [open, setOpen] = useState(false);

  const fetchAll = async () => {
    apiClient
      .get(`/finance/journal-entries`)
      .then(({ data }) => {
        setList(data);
      })
      .catch(() => toast.error("Failed to load manual journals"))
      .finally(() => setLoading(false));
  };

  const handleRowClick = (row: Row<JournalEntryResponseDTO>) => {
    const journal = row.original;
    navigate(`/finance/journals/${journal.id}`);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const columns = JOURNAL_COLUMNS({
    onEdit: (row) => {
      setSelected(row);
      setOpen(true);
    },
    onPost: async (row) => {
      try {
        const res = await apiClient.post(
          `/finance/journal-entries/${row.id}/post`
        );
        toast.success("Journal posted");
        setList((prev) => prev.map((x) => (x.id === row.id ? res.data : x)));
      } catch {
        toast.error("Failed to post journal");
      }
    },
  });

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Manual Journals</h1>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." className="pl-10" />
            </div>

            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Add Journal
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable
            data={list}
            columns={columns}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      <JournalDialog
        companyId={companyId || 0}
        open={open}
        onOpenChange={setOpen}
        data={selected}
        onSuccess={(updated, mode) => {
          if (mode === "add") setList((prev) => [...prev, updated]);
          else
            setList((prev) =>
              prev.map((x) => (x.id === updated.id ? updated : x))
            );
        }}
      />
    </div>
  );
}
