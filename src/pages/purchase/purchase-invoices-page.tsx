import { useState, useCallback, useEffect, useMemo } from "react";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPurchaseInvoiceColumns } from "@/lib/columns/purchase-columns";
import {
  Search,
  Plus,
  FileText,
  Wallet,
  CheckCircle2,
  AlertTriangle,
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
import type { Row } from "@tanstack/react-table";
import type { FinanceInvoice } from "@/types/finance-invoice";
import {
  archiveInvoice,
  getInvoicePdfUrl,
  invoiceDocumentPreviewUrl,
  listPurchaseInvoices,
} from "@/service/invoiceService";
import { RegisterSupplierInvoiceDialog } from "@/pages/purchase/components/register-supplier-invoice-dialog";
import { PageHeader } from "@/components/PageHeader";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { toast } from "sonner";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import {
  invoiceMatchesStatusFilter,
  isInvoiceArchivedStatus,
  isInvoiceReceiptView,
} from "@/lib/invoice-status-filter";
import { apiClient } from "@/service/apiClient";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type InvoiceListTab = "outstanding" | "archived";

function notArchived(inv: FinanceInvoice): boolean {
  return !inv.archived;
}

export default function PurchaseInvoicesPage() {
  const { confirm } = useConfirmDialog();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || "",
  );
  const [rows, setRows] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [listTab, setListTab] = useState<InvoiceListTab>("outstanding");
  const [processingInvoiceId, setProcessingInvoiceId] = useState<number | null>(
    null,
  );
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listPurchaseInvoices()
      .then(setRows)
      .catch((e: unknown) => {
        console.error(e);
        toast.error("Could not load purchase invoices");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const outstandingCount = useMemo(
    () => rows.filter((i) => !isInvoiceArchivedStatus(i.status)).length,
    [rows],
  );
  const completedTabCount = useMemo(
    () =>
      rows.filter((i) => isInvoiceArchivedStatus(i.status) && !i.archived)
        .length,
    [rows],
  );

  const filteredInvoices = useMemo(() => {
    return rows.filter((invoice) => {
      const inCompletedByStatus = isInvoiceArchivedStatus(invoice.status);
      const matchesTab =
        listTab === "archived" ? inCompletedByStatus : !inCompletedByStatus;
      if (!matchesTab) return false;
      if (listTab === "archived" && invoice.archived) return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (invoice.invoiceId?.toLowerCase().includes(q) ?? false) ||
        (invoice.toParty?.toLowerCase().includes(q) ?? false) ||
        (invoice.supplierInvoiceNumber?.toLowerCase().includes(q) ?? false);
      const matchesStatus = invoiceMatchesStatusFilter(
        invoice.status,
        statusFilter,
      );
      return matchesSearch && matchesStatus;
    });
  }, [rows, listTab, searchQuery, statusFilter]);

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
        "PURCHASE_INVOICE",
        selectedInvoiceIds,
      );
      toast.success(summarizeBulkActionResult(result));
      setRowSelection({});
      load();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to archive selected invoices.";
      toast.error(message);
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, load, selectedInvoiceIds]);

  const handleArchiveInvoice = useCallback(
    async (id: number) => {
      const invoice = rows.find((inv) => inv.id === id);
      if (!invoice) return toast.error("Invoice not found");
      const normalizedStatus = (invoice.status || "").toUpperCase();
      if (normalizedStatus !== "PAID" && normalizedStatus !== "CANCELLED") {
        return toast.error("Only paid or cancelled invoices can be archived.");
      }
      if (invoice.archived) return toast.error("Invoice is already archived.");
      if (!(await confirm(`Archive invoice ${invoice.invoiceId}?`))) return;
      setProcessingInvoiceId(id);
      try {
        const updated = await archiveInvoice(id);
        setRows((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
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
    [rows],
  );

  const handleViewInvoice = useCallback(
    (inv: FinanceInvoice) => {
      navigate(`/inventory/purchase/invoices/${inv.id}`, {
        state: { backTo: location.pathname },
      });
    },
    [navigate, location.pathname],
  );

  const handleOpenInvoiceDocument = useCallback(async (inv: FinanceInvoice) => {
    const direct = invoiceDocumentPreviewUrl(inv);
    if (direct) {
      window.open(direct, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const url = await getInvoicePdfUrl(inv.id);
      if (url && !url.includes("dummy.url")) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("No document is available for this invoice.");
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax?.response?.data?.message ||
          (err instanceof Error ? err.message : "Could not open invoice document."),
      );
    }
  }, []);

  const handleDownloadInvoice = useCallback(async (inv: FinanceInvoice) => {
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

  const handleEmailInvoice = useCallback(async (inv: FinanceInvoice) => {
    const isReceipt = isInvoiceReceiptView(inv.status);
    try {
      if (isReceipt) {
        await apiClient.post(`/invoices/${inv.id}/receipt-email`);
        toast.success("Receipt email sent.");
      } else {
        await apiClient.post(`/invoices/${inv.id}/email`);
        toast.success("Invoice email sent.");
      }
    } catch {
      toast.error(
        isReceipt ? "Could not send receipt email." : "Could not send invoice email.",
      );
    }
  }, []);

  const columns = useMemo(
    () =>
      createPurchaseInvoiceColumns(handleArchiveInvoice, processingInvoiceId, {
        onViewDetails: handleViewInvoice,
        onOpenDocument: handleOpenInvoiceDocument,
        onDownload: handleDownloadInvoice,
        onEmail: handleEmailInvoice,
      }),
    [
      handleArchiveInvoice,
      processingInvoiceId,
      handleViewInvoice,
      handleOpenInvoiceDocument,
      handleDownloadInvoice,
      handleEmailInvoice,
    ],
  );

  const purchaseInvoiceKpis = useMemo((): KpiSummaryStat[] => {
    const norm = (s?: string) => (s || "").toUpperCase().replace(/\s+/g, "_");
    const visible = rows.filter(notArchived);
    const unpaid = visible.filter(
      (inv) => norm(inv.status) === "UNPAID",
    ).length;
    const paid = visible.filter((inv) => norm(inv.status) === "PAID").length;
    const overdue = visible.filter(
      (inv) => norm(inv.status) === "OVERDUE",
    ).length;
    const draft = visible.filter((inv) => norm(inv.status) === "DRAFT").length;
    return [
      {
        label: "Total invoices",
        value: visible.length,
        hint: "Supplier invoices on file",
        accent: "sky",
        icon: FileText,
      },
      {
        label: "Unpaid",
        value: unpaid,
        hint: "Awaiting disbursement",
        accent: "orange",
        icon: Wallet,
      },
      {
        label: "Paid",
        value: paid,
        hint: "Cash-applied",
        accent: "emerald",
        icon: CheckCircle2,
      },
      {
        label: "Attention",
        value: overdue + draft,
        hint: `${overdue} overdue · ${draft} draft`,
        accent: "rose",
        icon: AlertTriangle,
      },
    ];
  }, [rows]);

  const handleRowClick = useCallback(
    (row: Row<FinanceInvoice>) => {
      navigate(`/inventory/purchase/invoices/${row.original.id}`, {
        state: { backTo: location.pathname },
      });
    },
    [navigate, location.pathname],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Purchase invoices"
        description="Supplier invoices for posting and payment tracking (accounts payable)."
        backHref="/inventory/purchase"
        variant="darkGreen"
        actions={
          <Button
            type="button"
            size="lg"
            className="bg-white text-slate-900 hover:bg-white/90"
            onClick={() => setRegisterOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Register supplier invoice
          </Button>
        }
      />

      {!loading ? <KpiSummaryStrip items={purchaseInvoiceKpis} /> : null}

      <Card>
        <CardHeader className="pb-3">
          <Tabs
            value={listTab}
            onValueChange={(v) => {
              setListTab(v as InvoiceListTab);
              setStatusFilter("all");
              setRowSelection({});
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
                    {completedTabCount}
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[100]">
                    <SelectItem value="all">All</SelectItem>
                    {listTab === "outstanding" ? (
                      <>
                        <SelectItem value="Draft">Draft</SelectItem>
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
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading…
            </div>
          ) : (
            <>
              {listTab === "archived" ? (
                <BulkActionBar
                  selectedCount={selectedInvoiceIds.length}
                  onArchive={handleBulkArchiveInvoices}
                  onClear={() => setRowSelection({})}
                  archiving={bulkArchiving}
                />
              ) : null}
              <SelectableDataTable
                columns={columns}
                data={filteredInvoices}
                onRowClick={handleRowClick}
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
              />
            </>
          )}
        </CardContent>
      </Card>

      <RegisterSupplierInvoiceDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onCreated={load}
      />
    </div>
  );
}
