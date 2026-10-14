import { useCallback, useEffect, useMemo, useState } from "react";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Badge } from "@/components/ui/badge";
import { createSalesInvoiceColumns } from "@/lib/columns/accounts-receivable-columns";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  ListTodo,
  FileCheck,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { type Invoice } from "@/types/sales";
import { apiClient } from "@/service/apiClient";
import type { Row } from "@tanstack/react-table";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { isInvoiceReceiptView } from "@/lib/invoice-status-filter";
import {
  getInvoicePdfUrl,
  listSalesInvoicesPaged,
} from "@/service/invoiceService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { useAuth } from "@/context/AuthContext";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import {
  ListToolbar,
  ListSearchField,
  ListToolbarSelect,
} from "@/components/list-toolbar";

type InvoiceListTab = "outstanding" | "archived";

export default function InvoicesPage({
  disableHeader = false,
}: {
  disableHeader?: boolean;
}) {
  const { confirm } = useConfirmDialog();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("all");
  const [listTab, setListTab] = useState<InvoiceListTab>("outstanding");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<number | null>(
    null,
  );
  const [kpiCounts, setKpiCounts] = useState({
    total: 0,
    unpaid: 0,
    paid: 0,
    overdue: 0,
    outstanding: 0,
    archived: 0,
  });

  const companyId = user?.companyId;

  const filters = useMemo(
    () => ({
      tab: listTab,
      status: statusFilter,
    }),
    [listTab, statusFilter],
  );

  const fetchInvoices = useCallback(
    (params: {
      page: number;
      size: number;
      search: string;
      tab: string;
      status: string;
    }) =>
      listSalesInvoicesPaged({
        page: params.page,
        size: params.size,
        search: params.search,
        tab: params.tab,
        status: params.status,
      }),
    [],
  );

  const {
    rows: invoices,
    loading,
    searchInput: searchQuery,
    setSearchInput: setSearchQuery,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    pageCount,
    reload,
  } = useServerPagedList<Invoice, { tab: string; status: string }>({
    fetcher: fetchInvoices,
    filters,
    errorMessage: "Failed to load invoices",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allOutstanding, unpaid, paid, overdue, archived] =
          await Promise.all([
            listSalesInvoicesPaged({ page: 0, size: 1, tab: "outstanding" }),
            listSalesInvoicesPaged({
              page: 0,
              size: 1,
              tab: "outstanding",
              status: "UNPAID",
            }),
            listSalesInvoicesPaged({
              page: 0,
              size: 1,
              tab: "archived",
              status: "PAID",
            }),
            listSalesInvoicesPaged({
              page: 0,
              size: 1,
              tab: "outstanding",
              status: "OVERDUE",
            }),
            listSalesInvoicesPaged({ page: 0, size: 1, tab: "archived" }),
          ]);
        if (cancelled) return;
        setKpiCounts({
          total: allOutstanding.totalElements,
          unpaid: unpaid.totalElements,
          paid: paid.totalElements,
          overdue: overdue.totalElements,
          outstanding: allOutstanding.totalElements,
          archived: archived.totalElements,
        });
      } catch {
        /* KPI counts are best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, reload]);

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    setRowSelection({});
    switch (key) {
      case "paid":
        setListTab("archived");
        setStatusFilter("Paid");
        break;
      case "unpaid":
        setListTab("outstanding");
        setStatusFilter("Unpaid");
        break;
      case "overdue":
        setListTab("outstanding");
        setStatusFilter("Overdue");
        break;
      default:
        setListTab("outstanding");
        setStatusFilter("all");
        break;
    }
  }, []);

  const selectedInvoiceIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    [rowSelection],
  );

  const handleBulkArchiveInvoices = useCallback(async () => {
    if (selectedInvoiceIds.length === 0) return;
    if (
      !(await confirm(
        `Archive ${selectedInvoiceIds.length} selected invoice(s)? They will move to Operations and management Reports → History.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const result = await bulkArchiveHistoryRecords(
        "SALES_INVOICE",
        selectedInvoiceIds,
      );
      toast.success(summarizeBulkActionResult(result));
      setRowSelection({});
      reload();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to archive selected invoices.";
      toast.error(message);
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, selectedInvoiceIds, reload]);

  const handleArchiveInvoice = useCallback(
    async (id: number) => {
      const invoice = invoices.find((inv) => inv.id === id);
      if (!invoice) return toast.error("Invoice not found");
      const normalizedStatus = (invoice.status || "").toUpperCase();
      if (normalizedStatus !== "PAID" && normalizedStatus !== "CANCELLED") {
        return toast.error("Only paid or cancelled invoices can be archived.");
      }
      if (invoice.archived) return toast.error("Invoice is already archived.");
      if (!(await confirm(`Archive invoice ${invoice.invoiceId}?`))) return;
      setProcessingInvoiceId(id);
      try {
        await apiClient.post<Invoice>(`/invoices/${id}/archive`);
        toast.success("Invoice archived successfully");
        reload();
      } catch (error: unknown) {
        const err = error as {
          response?: { data?: { message?: string; error?: string } };
          message?: string;
        };
        const backendMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message;
        toast.error(backendMessage || "Failed to archive invoice");
      } finally {
        setProcessingInvoiceId(null);
      }
    },
    [invoices, confirm, reload],
  );

  const handleViewInvoice = useCallback(
    (inv: Invoice) => {
      navigate(`/sales/invoices/${inv.id}`, {
        state: { backTo: location.pathname },
      });
    },
    [navigate, location.pathname],
  );

  const handleDownloadInvoice = useCallback(async (inv: Invoice) => {
    try {
      const url = await getInvoicePdfUrl(inv.id);
      if (url && !url.includes("dummy.url")) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("PDF is not available for this invoice.");
      }
    } catch {
      toast.error("Could not download invoice PDF.");
    }
  }, []);

  const handleEmailInvoice = useCallback(async (inv: Invoice) => {
    const isReceipt = isInvoiceReceiptView(inv.status);
    try {
      if (isReceipt) {
        await apiClient.post(`/invoices/${inv.id}/receipt-email`);
        toast.success("Receipt email sent to customer.");
      } else {
        await apiClient.post(`/invoices/${inv.id}/email`);
        toast.success("Invoice email sent to customer.");
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isReceipt
            ? "Could not send receipt email."
            : "Could not send invoice email.",
        ),
      );
    }
  }, []);

  const columns = useMemo(
    () =>
      createSalesInvoiceColumns(handleArchiveInvoice, processingInvoiceId, {
        onViewDetails: handleViewInvoice,
        onDownload: handleDownloadInvoice,
        onEmail: handleEmailInvoice,
      }),
    [
      handleArchiveInvoice,
      processingInvoiceId,
      handleViewInvoice,
      handleDownloadInvoice,
      handleEmailInvoice,
    ],
  );

  const invoiceKpis = useMemo((): KpiSummaryStat[] => {
    return [
      kpiFilterItem(
        {
          label: "Total invoices",
          value: kpiCounts.total,
          hint: "Sales invoices loaded",
          accent: "sky",
          icon: FileText,
        },
        "all",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Unpaid",
          value: kpiCounts.unpaid,
          hint: "Awaiting payment",
          accent: "orange",
          icon: Wallet,
        },
        "unpaid",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Paid",
          value: kpiCounts.paid,
          hint: "Fully settled",
          accent: "emerald",
          icon: CheckCircle2,
        },
        "paid",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Overdue",
          value: kpiCounts.overdue,
          hint: "Past due — needs collection",
          accent: "rose",
          icon: AlertTriangle,
        },
        "overdue",
        kpiFilter,
        applyKpiFilter,
      ),
    ];
  }, [kpiCounts, kpiFilter, applyKpiFilter]);

  const isFinancePage = useMemo(() => {
    return location.pathname.includes("/finance/receivable");
  }, [location.pathname]);

  return (
    <div className={cn("p-6 space-y-6", isFinancePage && "p-0")}>
      {!disableHeader && (
        <PageHeader
          variant="darkBlue"
          title="Sales Invoices"
          description="Manage AR invoices issued from confirmed orders: payment status, due dates, and collections."
          backHref="/inventory/sales"
        />
      )}

      <KpiSummaryStrip items={invoiceKpis} />

      <Tabs
        value={listTab}
        onValueChange={(v) => {
          setListTab(v as InvoiceListTab);
          setStatusFilter("all");
          setRowSelection({});
          setKpiFilter(null);
        }}
        className="w-full gap-4"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 lg:w-auto">
            <TabsTrigger value="outstanding" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Current Invoices
              <Badge variant="secondary" className="font-normal">
                {kpiCounts.outstanding}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Completed
              <Badge variant="secondary" className="font-normal">
                {kpiCounts.archived}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <ListToolbar className="p-0">
            <ListSearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search invoices..."
              className="w-64"
            />
            <ListToolbarSelect
              aria-label="Payment status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setKpiFilter(null);
              }}
            >
              <option value="all">All payment status</option>
              {listTab === "outstanding" ? (
                <>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Overdue">Overdue</option>
                </>
              ) : (
                <>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </>
              )}
            </ListToolbarSelect>
          </ListToolbar>
        </div>
      </Tabs>
      {listTab === "archived" ? (
        <BulkActionBar
          selectedCount={selectedInvoiceIds.length}
          onArchive={handleBulkArchiveInvoices}
          onClear={() => setRowSelection({})}
          archiving={bulkArchiving}
        />
      ) : null}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          Loading invoices...
        </div>
      ) : (
        <SelectableDataTable
          data={invoices}
          columns={columns}
          enableRowSelection={listTab === "archived"}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => String(row.id)}
          isRowSelectable={(row) => {
            const status = (row.status || "").toUpperCase();
            return (
              (status === "PAID" || status === "CANCELLED") && !row.archived
            );
          }}
          onRowClick={(row: Row<Invoice>) =>
            navigate(`/sales/invoices/${row.original.id}`, {
              state: { backTo: location.pathname },
            })
          }
          serverPagination={{
            total: totalElements,
            pageIndex: page,
            pageSize,
            pageCount: Math.max(pageCount, 1),
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      )}
    </div>
  );
}
