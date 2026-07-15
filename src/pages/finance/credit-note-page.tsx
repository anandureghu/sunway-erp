import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/service/apiClient";
import CreateCreditNoteDialog from "@/modules/finance/credit-note/create-credit-note-dialog";
import type { CreditNote } from "@/types/credit-note";
import { DataTable } from "@/components/datatable";
import { CREDIT_NOTE_COLUMNS } from "@/lib/columns/finance/credit-note-columns";
import { FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";

const CreditNotePage = () => {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return creditNotes;
    return creditNotes.filter((note) =>
      [
        note.creditNoteNumber,
        note.customerName,
        note.supplierName,
        note.status,
        note.referenceNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [creditNotes, searchQuery]);

  return (
    <GlTabPanel
      title="Credit Notes"
      description="Issue and track credit notes against customer invoices."
      icon={<FileText className="h-5 w-5" />}
      searchPlaceholder="Search credit notes..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      loading={loading}
      loadingMessage="Loading credit notes…"
      actions={
        <>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-lg"
            onClick={fetchCreditNotes}
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <CreateCreditNoteDialog onCreated={fetchCreditNotes} />
        </>
      }
    >
      <DataTable data={filtered} columns={CREDIT_NOTE_COLUMNS} />
    </GlTabPanel>
  );
};

export default CreditNotePage;
