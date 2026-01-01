import { useState, useCallback } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PURCHASE_INVOICE_COLUMNS } from "@/lib/columns/purchase-columns";
import { purchaseInvoices } from "@/lib/purchase-data";
import { Search, ArrowLeft } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Row } from "@tanstack/react-table";
import type { PurchaseInvoice } from "@/types/purchase";

export default function PurchaseInvoicesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || ""
  );

  const filteredInvoices = purchaseInvoices.filter((invoice) => {
    return (
      invoice.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleRowClick = useCallback(
    (row: Row<PurchaseInvoice>) => {
      const invoice = row.original;
      navigate(`/inventory/purchase/invoices/${invoice.id}`);
    },
    [navigate]
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
              Manage purchase invoices and payments
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Purchase Invoices</CardTitle>
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
          <DataTable
            columns={PURCHASE_INVOICE_COLUMNS}
            data={filteredInvoices}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
