import { useCallback, useState } from "react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { DataTable } from "@/components/datatable";

import { JOURNAL_COLUMNS } from "@/lib/columns/finance/journal-columns";
import type { JournalEntryResponseDTO } from "@/types/journal";
import { JournalDialog } from "./journal-dialog";
import type { Row } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@/components/ui/tooltip";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import type { PageResult } from "@/types/page";
import { ListSearchField } from "@/components/list-toolbar";

export default function JournalPage({ companyId }: { companyId: number }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<JournalEntryResponseDTO | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  const { accountPeriodOpen, company } = useAuth();

  const fetcher = useCallback(
    async ({
      page,
      size,
      search,
    }: {
      page: number;
      size: number;
      search: string;
    }): Promise<PageResult<JournalEntryResponseDTO>> => {
      const res = await apiClient.get<PageResult<JournalEntryResponseDTO>>(
        `/finance/journal-entries`,
        {
          params: {
            archived: false,
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
    rows: list,
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
  } = useServerPagedList<JournalEntryResponseDTO>({
    fetcher,
    errorMessage: "Failed to load manual journals",
  });

  const handleRowClick = (row: Row<JournalEntryResponseDTO>) => {
    const journal = row.original;
    navigate(`/finance/journals/${journal.id}`);
  };

  const columns = JOURNAL_COLUMNS({
    accountOpen: accountPeriodOpen,
    currency: company!.currency!.currencyCode,
    onEdit: (row) => {
      setSelected(row);
      setOpen(true);
    },
    onPost: async (row) => {
      try {
        await apiClient.post(`/finance/journal-entries/${row.id}/post`);
        toast.success("Journal posted");
        reload();
      } catch {
        toast.error("Failed to post journal");
      }
    },
  });

  if (loading && list.length === 0) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Manual Journals</h1>
      {!accountPeriodOpen && (
        <p className="text-red-400 text-sm">
          account period is closed, you cannot add or modify in this time!
        </p>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-3">
            <ListSearchField
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search..."
              className="flex-1 sm:max-w-none"
            />
            {!accountPeriodOpen ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button disabled className="pointer-events-none">
                      Add Journal
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Cannot add or modify journal while accounting period is
                    closed
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={() => {
                  setSelected(null);
                  setOpen(true);
                }}
              >
                Add Journal
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <DataTable
            data={list}
            columns={columns}
            onRowClick={handleRowClick}
            serverPagination={{
              total: totalElements,
              pageIndex: page,
              pageSize,
              pageCount,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />
        </CardContent>
      </Card>

      <JournalDialog
        companyId={companyId || 0}
        open={open}
        onOpenChange={setOpen}
        data={selected}
        onSuccess={(_updated, _mode) => {
          setSelected(null);
          reload();
        }}
      />
    </div>
  );
}
