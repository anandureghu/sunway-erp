import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import CreateCreditNoteDialog from "@/modules/finance/credit-note/create-credit-note-dialog";
import type { CreditNote } from "@/types/credit-note";
import { DataTable } from "@/components/datatable";
import { CREDIT_NOTE_COLUMNS } from "@/lib/columns/finance/credit-note-columns";
import { ArrowLeft, FileText, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CreditNotePage = () => {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCreditNotes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<CreditNote[]>("/credit-notes");
      setCreditNotes(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg"
            asChild
          >
            <Link to="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <FileText className="h-5 w-5" />
          <span className="text-lg font-semibold">Credit Notes</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b bg-white">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search credit notes..." className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={fetchCreditNotes}
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <CreateCreditNoteDialog onCreated={fetchCreditNotes} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Loading credit notes...
        </div>
      ) : (
        <div className="p-4">
          <DataTable data={creditNotes} columns={CREDIT_NOTE_COLUMNS} />
        </div>
      )}
    </div>
  );
};

export default CreditNotePage;
