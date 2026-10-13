// src/pages/admin/finance/ReconciliationListPage.tsx

import { useCallback, useState } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { RECONCILIATION_COLUMNS } from "@/lib/columns/finance/reconciliation-columns";
import { ReconciliationDialog } from "@/modules/finance/reconcilation/recon-dialog";
import type { Reconciliation } from "@/types/finance/reconcilation";
import { GlTabPanel } from "@/components/finance/gl-tab-panel";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import type { PageResult } from "@/types/page";

export default function ReconciliationListPage() {
  const [selected, setSelected] = useState<Reconciliation | null>(null);
  const [open, setOpen] = useState(false);

  const fetcher = useCallback(
    async ({
      page,
      size,
      search,
    }: {
      page: number;
      size: number;
      search: string;
    }): Promise<PageResult<Reconciliation>> => {
      const res = await apiClient.get<PageResult<Reconciliation>>(
        "/finance/reconciliations",
        {
          params: {
            search: search || undefined,
            page,
            size,
          },
        },
      );
      return res.data;
    },
    [],
  );

  const {
    rows: data,
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
  } = useServerPagedList<Reconciliation>({
    fetcher,
    errorMessage: "Failed to fetch reconciliations",
  });

  const handleEdit = (rec: Reconciliation) => {
    setSelected(rec);
    setOpen(true);
  };

  const handleConfirm = async (rec: Reconciliation) => {
    try {
      await apiClient.put(`/finance/reconciliations/${rec.id}/confirm`);
      toast.success("Reconciliation confirmed");
      reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error("Failed to confirm", {
        description: ax?.response?.data?.message,
      });
    }
  };

  const handleSuccess = (_updated: Reconciliation, _mode: "add" | "edit") => {
    setSelected(null);
    reload();
  };

  const columns = RECONCILIATION_COLUMNS({
    onEdit: handleEdit,
    onConfirm: handleConfirm,
  });

  return (
    <>
      <GlTabPanel
        title="Reconcile"
        description="Match bank and ledger balances for cash accounts."
        icon={<CheckSquare className="h-5 w-5" />}
        searchPlaceholder="Search reconciliations..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
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
            Add reconciliation
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={data}
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

      <ReconciliationDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setSelected(null);
        }}
        reconciliation={selected}
        onSuccess={handleSuccess}
      />
    </>
  );
}
