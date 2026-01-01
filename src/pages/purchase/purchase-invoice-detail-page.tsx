import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { purchaseInvoices } from "@/lib/purchase-data";
import type { PurchaseInvoice } from "@/types/purchase";

export default function PurchaseInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    // Find invoice from mock data
    const foundInvoice = purchaseInvoices.find((inv) => inv.id === id);
    setInvoice(foundInvoice || null);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="py-10 text-center text-muted-foreground">
          Loading invoice...
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="py-10 text-center space-y-4">
          <div className="text-red-600 font-medium">Invoice not found</div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    partially_paid: "bg-blue-100 text-blue-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Purchase Invoice - {invoice.invoiceNo}
            </h1>
            <p className="text-muted-foreground">
              Complete information about this purchase invoice
            </p>
          </div>
        </div>
        <Badge
          className={
            statusColors[invoice.status] || "bg-gray-100 text-gray-800"
          }
        >
          {invoice.status
            .replace("_", " ")
            .split(" ")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ")}
        </Badge>
      </div>

      {/* Invoice Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoice Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-medium">{invoice.invoiceNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                className={
                  statusColors[invoice.status] || "bg-gray-100 text-gray-800"
                }
              >
                {invoice.status
                  .replace("_", " ")
                  .split(" ")
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join(" ")}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice Date</p>
              <p className="font-medium">
                {invoice.date
                  ? format(new Date(invoice.date), "MMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">
                {invoice.dueDate
                  ? format(new Date(invoice.dueDate), "MMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
            {invoice.order?.orderNo && (
              <div>
                <p className="text-sm text-muted-foreground">Purchase Order</p>
                <p className="font-medium">{invoice.order.orderNo}</p>
              </div>
            )}
            {invoice.paymentTerms && (
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="font-medium">{invoice.paymentTerms}</p>
              </div>
            )}
          </div>
          {invoice.notes && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="font-medium">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supplier Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Supplier Name</p>
            <p className="font-medium">{invoice.supplierName}</p>
          </div>
          {invoice.supplier?.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{invoice.supplier.email}</p>
            </div>
          )}
          {invoice.supplier?.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{invoice.supplier.phone}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.items.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-4 font-medium text-sm border-b pb-2">
                <div>Item</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Unit Price</div>
                <div className="text-right">Total</div>
                <div></div>
              </div>
              {invoice.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-5 gap-4 text-sm border-b pb-2"
                >
                  <div>
                    <p className="font-medium">
                      {item.item?.name || `Item ${item.itemId}`}
                    </p>
                    {item.item?.sku && (
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.item.sku}
                      </p>
                    )}
                  </div>
                  <div className="text-right">{item.quantity}</div>
                  <div className="text-right">
                    ₹{item.unitPrice.toLocaleString()}
                  </div>
                  <div className="text-right font-medium">
                    ₹{item.total.toLocaleString()}
                  </div>
                  <div></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No items in this invoice</p>
          )}
        </CardContent>
      </Card>

      {/* Invoice Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">
                ₹{invoice.subtotal.toLocaleString()}
              </span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-medium">
                  ₹{invoice.tax.toLocaleString()}
                </span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="font-medium">
                  ₹{invoice.discount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>₹{invoice.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span>Paid Amount:</span>
              <span className="font-medium">
                ₹{invoice.paidAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Balance:</span>
              <span>
                ₹{(invoice.total - invoice.paidAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

