import { useNavigate, useParams } from "react-router-dom";
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
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function JournalDetailPage() {
  const { id } = useParams();
  const { company } = useAuth();
  const navigate = useNavigate();
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
      <div className="flex items-center">
        <Button variant="link" className="p-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2" />
        </Button>
        <h1 className="text-xl font-normal">go back</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            {/* LEFT SIDE */}
            <div className="space-y-4 w-full ">
              {/* Journal Title + Description */}
              <div>
                <h2 className="text-2xl font-semibold">
                  Journal #{data.journalEntryNumber}
                </h2>
                {data.description && (
                  <p className="text-muted-foreground mt-1">
                    {data.description}
                  </p>
                )}
              </div>

              {/* Summary Cards */}
            </div>

            {/* RIGHT SIDE ACTIONS */}
            <div className="flex gap-3 ml-6">
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

          <div className="flex flex-wrap gap-4 mt-4">
            {/* Amount */}
            <div className="rounded-lg border p-4 bg-blue-50 text-blue-600 flex-1">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-xl font-semibold">₹{data.totalDebit}</p>
            </div>

            {/* Status */}
            <div className="rounded-lg border p-4 bg-gray-100 text-purple-600 flex-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-xl font-semibold">{data.status}</p>
            </div>

            {/* Created Date */}
            <div className="rounded-lg border p-4 bg-green-50 text-green-600 flex-1">
              <p className="text-sm text-muted-foreground">Created Date</p>
              <p className="text-xl font-semibold">{data.entryDate}</p>
            </div>

            {/* Period */}
            <div className="rounded-lg border p-4 bg-yellow-50 text-yellow-600 flex-1">
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="text-xl font-semibold">{data.periodId}</p>
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
            columns={JOURNAL_LINE_COLUMNS({ company: company! })}
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
