import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { JournalEntryResponseDTO, JournalLineDTO } from "@/types/journal";
import { DataTable } from "@/components/datatable";
import { JOURNAL_LINE_COLUMNS } from "@/lib/columns/finance/journal-line-columns";
import type { Row } from "@tanstack/react-table";
import { JournalLineDialog } from "./journal-line-dialog";

export default function JournalDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<JournalEntryResponseDTO | null>(null);
  const [openLineDialog, setOpenLineDialog] = useState(false);

  const [selectedLine, setSelectedLine] = useState<JournalLineDTO | null>(null);

  const handleRowClick = (row: Row<JournalLineDTO>) => {
    setSelectedLine(row.original);
    setOpenLineDialog(true);
  };

  const fetchOne = async () => {
    try {
      const res = await apiClient.get(`/finance/journal-entries/${id}`);
      setData(res.data);
    } catch {
      toast.error("Failed to load journal details");
    }
  };

  useEffect(() => {
    fetchOne();
  }, [id]);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        Journal #{data.journalEntryNumber}
      </h1>

      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <p>Total Credit: {data.totalCredit}</p>
              <p>Total Debit: {data.totalDebit}</p>
              <p>Status: {data.status}</p>
              <p>Entry Date: {data.entryDate}</p>
              <p>Source: {data.source}</p>
              <p>Period: {data.periodId}</p>
              {data.status == "REVERSED" && data.reversedAt && (
                <p>Reversed Date: {data.reversedAt}</p>
              )}
              {data.status == "POSTED" ||
                (data.status == "REVERSED" && data.postedAt && (
                  <p>Posted Date: {data.postedAt}</p>
                ))}

              <p>Description: {data.description}</p>
            </div>

            <div className="flex gap-3">
              <Button onClick={fetchOne}>Refresh</Button>
              <Button
                onClick={() =>
                  apiClient
                    .post(`/finance/journal-entries/${id}/post`)
                    .then(fetchOne)
                }
              >
                Post
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  apiClient
                    .post(`/finance/journal-entries/${id}/reverse`)
                    .then(fetchOne)
                    .catch((e) => {
                      toast.error("Failed to reverse journal", {
                        description: e?.response?.data?.message,
                      });
                    })
                }
              >
                Reverse
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Journal Lines</h2>

            <Button
              onClick={() => {
                setSelectedLine(null); // ensures dialog is in "add mode"
                setOpenLineDialog(true);
              }}
            >
              + Add Line
            </Button>
          </div>

          <DataTable
            data={data.lines}
            columns={JOURNAL_LINE_COLUMNS}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      {openLineDialog && (
        <JournalLineDialog
          open={openLineDialog}
          onOpenChange={setOpenLineDialog}
          journalId={Number(id)}
          line={selectedLine}
          onSuccess={() => {
            setSelectedLine(null);
            fetchOne();
          }}
        />
      )}
    </div>
  );
}
