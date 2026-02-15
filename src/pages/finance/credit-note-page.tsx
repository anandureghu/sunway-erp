import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/service/apiClient";
import CreateCreditNoteDialog from "@/modules/finance/credit-note/create-credit-note-dialog";
import type { CreditNote } from "@/types/credit-note";
import { DataTable } from "@/components/datatable";
import { CREDIT_NOTE_COLUMNS } from "@/lib/columns/finance/credit-note-columns";

const CreditNotePage = () => {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);

  const fetchCreditNotes = async () => {
    const res = await apiClient.get<CreditNote[]>("/credit-notes");
    setCreditNotes(res.data);
  };

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Credit Notes</h1>
        <CreateCreditNoteDialog onCreated={fetchCreditNotes} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Credit Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={creditNotes} columns={CREDIT_NOTE_COLUMNS} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditNotePage;
