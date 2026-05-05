import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { AppTab } from "@/components/app-tab";
import PaymentsPage from "@/modules/finance/payments-page";
import { useAuth } from "@/context/AuthContext";
import {
  archiveInvoice,
  listPurchaseInvoices,
} from "@/service/invoiceService";
import type { FinanceInvoice } from "@/types/finance-invoice";
import { createPurchaseInvoiceColumns } from "@/lib/columns/purchase-columns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  invoiceMatchesStatusFilter,
  isInvoiceArchivedStatus,
} from "@/lib/invoice-status-filter";

type InvoiceListTab = "outstanding" | "archived";

interface AccountsPayableProps {
  companyId?: number;
}

function PayableInvoicesTab() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [listTab, setListTab] = useState<InvoiceListTab>("outstanding");
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<number | null>(
    null,
  );

  const load = useCallback(() => {
    setLoading(true);
    listPurchaseInvoices()
      .then(setRows)
      .catch(() => {
        toast.error("Could not load purchase invoices");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const outstandingCount = useMemo(
    () => rows.filter((i) => !isInvoiceArchivedStatus(i.status)).length,
    [rows],
  );
  const completedTabCount = useMemo(
    () =>
      rows.filter(
        (i) => isInvoiceArchivedStatus(i.status) && !i.archived,
      ).length,
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((invoice) => {
      const inCompletedByStatus = isInvoiceArchivedStatus(invoice.status);
      const matchesTab =
        listTab === "archived" ? inCompletedByStatus : !inCompletedByStatus;
      if (!matchesTab) return false;
      if (listTab === "archived") {
        const isArchived = Boolean(invoice.archived);
        if (showArchivedOnly ? !isArchived : isArchived) return false;
      }

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
  }, [rows, listTab, searchQuery, statusFilter, showArchivedOnly]);

  const handleArchiveInvoice = useCallback(
    async (id: number) => {
      const invoice = rows.find((inv) => inv.id === id);
      if (!invoice) return toast.error("Invoice not found");
      const normalizedStatus = (invoice.status || "").toUpperCase();
      if (normalizedStatus !== "PAID" && normalizedStatus !== "CANCELLED") {
        return toast.error("Only paid or cancelled invoices can be archived.");
      }
      if (invoice.archived) return toast.error("Invoice is already archived.");
      if (!confirm(`Archive invoice ${invoice.invoiceId}?`)) return;
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

  const columns = useMemo(
    () =>
      createPurchaseInvoiceColumns(handleArchiveInvoice, processingInvoiceId),
    [handleArchiveInvoice, processingInvoiceId],
  );

  const handleRowClick = useCallback(
    (row: Row<FinanceInvoice>) => {
      navigate(`/inventory/purchase/invoices/${row.original.id}`);
    },
    [navigate],
  );

  return (
    <div className="space-y-4">
      {/* <h2 className="text-2xl font-semibold">Purchase invoices</h2>
      <p className="text-sm text-muted-foreground">
        Accounts payable bills (PURCHASE type only).
      </p> */}
      <Tabs
        value={listTab}
        onValueChange={(v) => {
          setListTab(v as InvoiceListTab);
          setStatusFilter("all");
          setShowArchivedOnly(false);
        }}
        className="w-full gap-4"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 lg:w-auto">
            <TabsTrigger value="outstanding" className="gap-2">
              Current Invoices
              <Badge variant="secondary" className="font-normal">
                {outstandingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              Completed
              <Badge variant="secondary" className="font-normal">
                {completedTabCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by ref, supplier, supplier #…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
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
            {listTab === "archived" ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <Switch
                  id="ap-show-archived-invoices"
                  checked={showArchivedOnly}
                  onCheckedChange={setShowArchivedOnly}
                />
                <Label
                  htmlFor="ap-show-archived-invoices"
                  className="text-sm font-medium cursor-pointer whitespace-nowrap"
                >
                  Archived only
                </Label>
              </div>
            ) : null}
          </div>
        </div>
      </Tabs>
      {loading ? (
        <div className="py-10 text-center text-muted-foreground">
          Loading invoices…
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={handleRowClick}
        />
      )}
    </div>
  );
}

const AccountsPayablePage = () => {
  const { user } = useAuth();

  const tabsList = [
    {
      value: "invoices",
      label: "Invoices",
      element: () => <PayableInvoicesTab />,
    },
    {
      value: "payments",
      label: "Vendor Payments",
      element: ({ companyId }: AccountsPayableProps) => (
        <PaymentsPage companyId={companyId || 0} variant="vendor" />
      ),
    },
  ];

  return (
    <AppTab
      title="Accounts Payable"
      subtitle="Manage your accounts payable and vendor payments"
      variant="danger"
      tabs={tabsList}
      defaultValue="invoices"
      props={{
        companyId: user?.companyId ? Number(user.companyId) : 0,
      }}
    />
  );
};

export default AccountsPayablePage;
