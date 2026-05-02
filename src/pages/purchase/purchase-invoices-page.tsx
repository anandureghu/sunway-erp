import { useState, useCallback, useEffect, useMemo } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PURCHASE_INVOICE_COLUMNS } from "@/lib/columns/purchase-columns";
import {
  Search,
  Plus,
  FileText,
  Wallet,
  CheckCircle2,
  AlertTriangle,
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
import { listPurchaseInvoices } from "@/service/invoiceService";
import { RegisterSupplierInvoiceDialog } from "@/pages/purchase/components/register-supplier-invoice-dialog";
import { PurchasePageHeader } from "@/pages/purchase/components/purchase-page-header";
import { toast } from "sonner";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { invoiceMatchesStatusFilter } from "@/lib/invoice-status-filter";

export default function PurchaseInvoicesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || "",
  );
  const [rows, setRows] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

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

  const filteredInvoices = rows.filter((invoice) => {
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

  const purchaseInvoiceKpis = useMemo((): KpiSummaryStat[] => {
    const norm = (s?: string) => (s || "").toUpperCase().replace(/\s+/g, "_");
    const unpaid = rows.filter((inv) => norm(inv.status) === "UNPAID").length;
    const paid = rows.filter((inv) => norm(inv.status) === "PAID").length;
    const overdue = rows.filter((inv) => norm(inv.status) === "OVERDUE").length;
    const draft = rows.filter((inv) => norm(inv.status) === "DRAFT").length;
    return [
      {
        label: "Total invoices",
        value: rows.length,
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
      navigate(`/inventory/purchase/invoices/${row.original.id}`);
    },
    [navigate],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PurchasePageHeader
        badge="Accounts payable"
        title="Purchase invoices"
        description="Supplier invoices for posting and payment tracking (accounts payable)."
        backHref="/inventory/purchase"
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
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All purchase invoices</CardTitle>
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
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading…
            </div>
          ) : (
            <DataTable
              columns={PURCHASE_INVOICE_COLUMNS}
              data={filteredInvoices}
              onRowClick={handleRowClick}
            />
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
