import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SALES_INVOICE_COLUMNS } from "@/lib/columns/accounts-receivable-columns";
import { Search, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { type Invoice } from "@/types/sales";
import { apiClient } from "@/service/apiClient";
import type { Row } from "@tanstack/react-table";

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

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const unpaidCount = invoices.filter((inv) => inv.status === "UNPAID").length;

  const paidCount = invoices.filter((inv) => inv.status === "PAID").length;

  const overdueCount = invoices.filter(
    (inv) => inv.status === "OVERDUE",
  ).length;

  const draftCount = invoices.filter((inv) => inv.status === "DRAFT").length;

  // No partial payment logic yet
  const partialCount = 0;

  return (
    <div className="p-6">
      {!disableHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/inventory/sales">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Sales Invoices</h1>
              <p className="text-muted-foreground">
                Manage invoices and payments
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Summary Section */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="rounded-lg border p-4 bg-red-50">
          <p className="text-sm text-red-600 font-medium">Unpaid (0%)</p>
          <p className="text-lg font-semibold">
            {unpaidCount} / {invoices.length}
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-green-50">
          <p className="text-sm text-green-600 font-medium">Paid (0%)</p>
          <p className="text-lg font-semibold">
            {paidCount} / {invoices.length}
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-yellow-50">
          <p className="text-sm text-yellow-600 font-medium">
            Partially Paid (0%)
          </p>
          <p className="text-lg font-semibold">
            {partialCount} / {invoices.length}
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-orange-50">
          <p className="text-sm text-orange-600 font-medium">Overdue (0%)</p>
          <p className="text-lg font-semibold">
            {overdueCount} / {invoices.length}
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-gray-50">
          <p className="text-sm text-gray-600 font-medium">Draft (0%)</p>
          <p className="text-lg font-semibold">
            {draftCount} / {invoices.length}
          </p>
        </div>
      </div>

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
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
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
