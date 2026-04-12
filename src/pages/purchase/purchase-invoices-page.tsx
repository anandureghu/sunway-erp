import { useState, useCallback, useEffect } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PURCHASE_INVOICE_COLUMNS } from "@/lib/columns/purchase-columns";
import { Search, ArrowLeft, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Row } from "@tanstack/react-table";
import type { FinanceInvoice } from "@/types/finance-invoice";
import { listPurchaseInvoices } from "@/service/invoiceService";
import { RegisterSupplierInvoiceDialog } from "@/pages/purchase/components/register-supplier-invoice-dialog";
import { toast } from "sonner";

export default function PurchaseInvoicesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || "",
  );
  const [rows, setRows] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);

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
    return (
      (invoice.invoiceId?.toLowerCase().includes(q) ?? false) ||
      (invoice.toParty?.toLowerCase().includes(q) ?? false) ||
      (invoice.supplierInvoiceNumber?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleRowClick = useCallback(
    (row: Row<FinanceInvoice>) => {
      navigate(`/inventory/purchase/invoices/${row.original.id}`);
    },
    [navigate],
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/purchase">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Purchase Invoices</h1>
            <p className="text-muted-foreground">
              Supplier invoices (accounts payable)
            </p>
          </div>
        </div>
        <Button type="button" onClick={() => setRegisterOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Register supplier invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All purchase invoices</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
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
