import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SALES_INVOICE_COLUMNS } from "@/lib/columns/accounts-receivable-columns";
import {
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Wallet,
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
import { SalesPageHeader } from "./components/sales-page-header";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import {
  invoiceMatchesStatusFilter,
  isInvoiceArchivedStatus,
} from "@/lib/invoice-status-filter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type InvoiceListTab = "outstanding" | "archived";

export default function InvoicesPage({
  disableHeader = false,
}: {
  disableHeader?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || "",
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [listTab, setListTab] = useState<InvoiceListTab>("outstanding");
  const [invoices, setInvoices] = useState<Invoice[]>([]);

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
    () => invoices.filter((i) => isInvoiceArchivedStatus(i.status)).length,
    [invoices],
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const archived = isInvoiceArchivedStatus(invoice.status);
      const matchesTab = listTab === "archived" ? archived : !archived;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        invoice.invoiceId?.toLowerCase().includes(q) ||
        invoice.toParty?.toLowerCase().includes(q);

      const matchesStatus = invoiceMatchesStatusFilter(
        invoice.status,
        statusFilter,
      );

      return matchesTab && matchesSearch && matchesStatus;
    });
  }, [invoices, listTab, searchQuery, statusFilter]);

  const invoiceKpis = useMemo((): KpiSummaryStat[] => {
    const norm = (s?: string) => (s || "").toUpperCase();
    const unpaid = invoices.filter(
      (inv) => norm(inv.status) === "UNPAID",
    ).length;
    const paid = invoices.filter((inv) => norm(inv.status) === "PAID").length;
    const overdue = invoices.filter(
      (inv) => norm(inv.status) === "OVERDUE",
    ).length;
    return [
      {
        label: "Total invoices",
        value: invoices.length,
        hint: "Sales invoices loaded",
        accent: "sky",
        icon: FileText,
      },
      {
        label: "Unpaid",
        value: unpaid,
        hint: "Awaiting payment",
        accent: "orange",
        icon: Wallet,
      },
      {
        label: "Paid",
        value: paid,
        hint: "Fully settled",
        accent: "emerald",
        icon: CheckCircle2,
      },
      {
        label: "Overdue",
        value: overdue,
        hint: "Past due — needs collection",
        accent: "rose",
        icon: AlertTriangle,
      },
    ];
  }, [invoices]);

  return (
    <div className="sm:p-0 space-y-6">
      {!disableHeader && (
        <SalesPageHeader
          title="Sales Invoices"
          description="Manage AR invoices issued from confirmed orders: payment status, due dates, and collections."
          backHref="/inventory/sales"
        />
      )}

      <KpiSummaryStrip items={invoiceKpis} />

      <Card>
        <CardHeader className="pb-3">
          <Tabs
            value={listTab}
            onValueChange={(v) => {
              setListTab(v as InvoiceListTab);
              setStatusFilter("all");
            }}
            className="w-full gap-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                    {archivedCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <div className="flex flex-wrap gap-2">
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
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[100]">
                    <SelectItem value="all">All</SelectItem>
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
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredInvoices}
            columns={SALES_INVOICE_COLUMNS}
            onRowClick={(row: Row<Invoice>) =>
              navigate(`/sales/invoices/${row.original.id}`)
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
