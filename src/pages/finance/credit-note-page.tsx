import { useCallback, useMemo, useState } from "react";
import { apiClient } from "@/service/apiClient";
import CreateCreditNoteDialog from "@/modules/finance/credit-note/create-credit-note-dialog";
import type { CreditNote } from "@/types/credit-note";
import { DataTable } from "@/components/datatable";
import { buildCreditNoteColumns } from "@/lib/columns/finance/credit-note-columns";
import { FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";
import { toast } from "sonner";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import type { PageResult } from "@/types/page";

const CreditNotePage = () => {
  const { confirm } = useConfirmDialog();
  const [cashingId, setCashingId] = useState<number | null>(null);

  const fetcher = useCallback(
    async ({
      page,
      size,
      search,
    }: {
      page: number;
      size: number;
      search: string;
    }): Promise<PageResult<CreditNote>> => {
      const res = await apiClient.get<PageResult<CreditNote>>("/credit-notes", {
        params: {
          search: search || undefined,
          page,
          size,
        },
      });
      return res.data;
    },
    [],
  );

  const {
    rows: creditNotes,
    loading,
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    pageCount,
    reload,
  } = useServerPagedList<CreditNote>({
    fetcher,
    errorMessage: "Failed to load credit notes",
  });

  const handleCashOut = async (note: CreditNote) => {
    const ok = await confirm({
      title: "Cash out credit note?",
      description: `Record a cash redemption of remaining ${note.remainingAmount} from ${note.creditNoteNumber}? A payment entry will be created and this balance can no longer be applied to future invoices.`,
      confirmLabel: "Cash out",
    });
    if (!ok) return;

    setCashingId(note.id);
    try {
      const res = await apiClient.post<CreditNote>(
        `/credit-notes/${note.id}/cash-out`,
      );
      const code = res.data?.cashOutPaymentCode;
      toast.success(
        code
          ? `Credit note ${note.creditNoteNumber} cashed out (payment ${code})`
          : `Credit note ${note.creditNoteNumber} cashed out`,
      );
      reload();
    } catch (err) {
      toast.error(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.message ||
          "Failed to cash out credit note",
      );
    } finally {
      setCashingId(null);
    }
  };

  const columns = useMemo(
    () =>
      buildCreditNoteColumns({
        onCashOut: (note) => void handleCashOut(note),
        cashingId,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cashingId],
  );

  return (
    <GlTabPanel
      title="Credit Notes"
      description="Issue standing credit for returns and adjustments. Customers can apply credit to future purchases or cash it out anytime."
      icon={<FileText className="h-5 w-5" />}
      searchPlaceholder="Search credit notes..."
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      loading={loading}
      loadingMessage="Loading credit notes…"
      actions={
        <>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-lg"
            onClick={reload}
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <CreateCreditNoteDialog onCreated={reload} />
        </>
      }
    >
      <DataTable
        data={creditNotes}
        columns={columns}
        serverPagination={{
          total: totalElements,
          pageIndex: page,
          pageSize,
          pageCount,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />
    </GlTabPanel>
  );
};

export default CreditNotePage;
