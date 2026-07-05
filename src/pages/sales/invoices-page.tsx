import { useCallback, useEffect, useMemo, useState } from "react";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createSalesInvoiceColumns } from "@/lib/columns/accounts-receivable-columns";
import {
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  ListTodo,
  FileCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation, useNavigate } from "react-router-dom";
import { type Invoice } from "@/types/sales";
import { apiClient } from "@/service/apiClient";
import type { Row } from "@tanstack/react-table";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import {
  invoiceMatchesStatusFilter,
  isInvoiceArchivedStatus,
  isInvoiceReceiptView,
} from "@/lib/invoice-status-filter";
import { getInvoicePdfUrl } from "@/service/invoiceService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { kpiFilterItem } from "@/lib/kpi-filter";

type InvoiceListTab = "outstanding" | "archived";

export default function InvoicesPage({
  disableHeader = false,
}: {
  disableHeader?: boolean;
}) {
  const { confirm } = useConfirmDialog();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || "",
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [listTab, setListTab] = useState<InvoiceListTab>("outstanding");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    apiClient
      .get<Invoice[]>("/invoices", { params: { type: "SALES" } })
      .then((res) => setInvoices(res.data));
  }, []);

  const outstandingCount = useMemo(
    () => invoices.filter((i) => !isInvoiceArchivedStatus(i.status)).length,
    [invoices],
  );
  const archivedCount = useMemo(
    () =>
      invoices.filter((i) => isInvoiceArchivedStatus(i.status) && !i.archived)
        .length,
    [invoices],
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const inCompletedByStatus = isInvoiceArchivedStatus(invoice.status);
      const matchesTab =
        listTab === "archived" ? inCompletedByStatus : !inCompletedByStatus;
      if (!matchesTab) return false;
      if (listTab === "archived" && invoice.archived) return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        invoice.invoiceId?.toLowerCase().includes(q) ||
        invoice.toParty?.toLowerCase().includes(q) ||
        invoice.orderNumber?.toLowerCase().includes(q) ||
        invoice.salesOrder?.orderNumber?.toLowerCase().includes(q);

      const matchesStatus = invoiceMatchesStatusFilter(
        invoice.status,
        statusFilter,
      );

      return matchesSearch && matchesStatus;
    });
  }, [invoices, listTab, searchQuery, statusFilter]);

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
      const res = await apiClient.get<Invoice[]>("/invoices", {
        params: { type: "SALES" },
      });
      setInvoices(res.data);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to archive selected invoices.";
      toast.error(message);
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, selectedInvoiceIds]);

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
        const { data } = await apiClient.post<Invoice>(
          `/invoices/${id}/archive`,
        );
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? data : inv)));
        toast.success("Invoice archived successfully");
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
    [invoices],
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
    } catch {
      toast.error(
        isReceipt ? "Could not send receipt email." : "Could not send invoice email.",
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
    const norm = (s?: string) => (s || "").toUpperCase();
    const visibleInvoices = invoices.filter((inv) => !inv.archived);
    const unpaid = visibleInvoices.filter(
      (inv) => norm(inv.status) === "UNPAID",
    ).length;
    const paid = visibleInvoices.filter((inv) => norm(inv.status) === "PAID").length;
    const overdue = visibleInvoices.filter(
      (inv) => norm(inv.status) === "OVERDUE",
    ).length;
    return [
      kpiFilterItem(
        {
          label: "Total invoices",
          value: visibleInvoices.length,
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
          value: unpaid,
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
          value: paid,
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
          value: overdue,
          hint: "Past due — needs collection",
          accent: "rose",
          icon: AlertTriangle,
        },
        "overdue",
        kpiFilter,
        applyKpiFilter,
      ),
    ];
  }, [invoices, kpiFilter, applyKpiFilter]);

  const isFinancePage = useMemo(() => {
    return location.pathname.includes("/finance/receivable");
  }, [location.pathname]);

  return (
    <div className={cn("p-6 space-y-6", isFinancePage && "p-0")}>
      {!disableHeader && (
        <PageHeader
          title="Sales Invoices"
          description="Manage AR invoices issued from confirmed orders: payment status, due dates, and collections."
          backHref="/inventory/sales"
          variant="darkBlue"
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
                {outstandingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Completed
              <Badge variant="secondary" className="font-normal">
                {archivedCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => {
              setStatusFilter(v);
              setKpiFilter(null);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                <SelectItem value="all">All payment status</SelectItem>
                {listTab === "outstanding" ? (
                  <>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Partially Paid">
                      Partially Paid
                    </SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
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
      <SelectableDataTable
        data={filteredInvoices}
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
      />
    </div>
  );
}
