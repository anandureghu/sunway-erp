import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { invoiceMatchesStatusFilter } from "@/lib/invoice-status-filter";

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
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    apiClient
      .get<Invoice[]>("/invoices", { params: { type: "SALES" } })
      .then((res) => setInvoices(res.data));
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      invoice.invoiceId?.toLowerCase().includes(q) ||
      invoice.toParty?.toLowerCase().includes(q);

    const matchesStatus = invoiceMatchesStatusFilter(
      invoice.status,
      statusFilter,
    );

    return matchesSearch && matchesStatus;
  });

  const invoiceKpis = useMemo((): KpiSummaryStat[] => {
    const norm = (s?: string) => (s || "").toUpperCase();
    const unpaid = invoices.filter((inv) => norm(inv.status) === "UNPAID").length;
    const paid = invoices.filter((inv) => norm(inv.status) === "PAID").length;
    const overdue = invoices.filter((inv) => norm(inv.status) === "OVERDUE").length;
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
    <div className="p-4 sm:p-6 space-y-6">
      {!disableHeader && (
        <SalesPageHeader
          badge="Billing"
          title="Sales Invoices"
          description="Manage AR invoices issued from confirmed orders: payment status, due dates, and collections."
          backHref="/inventory/sales"
        />
      )}

      <KpiSummaryStrip items={invoiceKpis} />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Invoices</CardTitle>
            <div className="flex gap-2">
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
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
