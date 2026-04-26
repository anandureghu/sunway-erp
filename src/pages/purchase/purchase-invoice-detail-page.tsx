import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import {
  getInvoice,
  invoiceDocumentPreviewUrl,
} from "@/service/invoiceService";
import type { FinanceInvoice } from "@/types/finance-invoice";
import { toast } from "sonner";

export default function PurchaseInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<FinanceInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const num = Number(id);
    if (Number.isNaN(num)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getInvoice(num)
      .then((inv) => {
        if (inv.type && inv.type !== "PURCHASE") {
          toast.message("This record is not a purchase invoice.");
        }
        setInvoice(inv);
      })
      .catch(() => {
        setInvoice(null);
        toast.error("Could not load invoice");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="py-10 text-center text-muted-foreground">
          Loading invoice…
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

  const statusRaw = (invoice.status || "").toLowerCase();
  const statusColors: Record<string, string> = {
    unpaid: "bg-yellow-100 text-yellow-800",
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    partially_paid: "bg-blue-100 text-blue-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    draft: "bg-gray-100 text-gray-800",
  };

  const previewUrl = invoiceDocumentPreviewUrl(invoice);
  const externalOnly =
    invoice.documentSource === "EXTERNAL_LINK" &&
    invoice.externalDocumentUrl &&
    !previewUrl;

  const openDocumentHref =
    invoice.externalDocumentUrl ||
    invoice.pdfUrl ||
    undefined;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Purchase invoice — {invoice.invoiceId}
            </h1>
            <p className="text-muted-foreground">
              Supplier document and posted amounts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {openDocumentHref && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={openDocumentHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open document
              </a>
            </Button>
          )}
          <Badge
            className={
              statusColors[statusRaw] || "bg-gray-100 text-gray-800"
            }
          >
            {(invoice.status || "—")
              .replace(/_/g, " ")
              .toLowerCase()
              .split(" ")
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(" ")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Source:{" "}
              <span className="text-foreground font-medium">
                {invoice.documentSource === "SUPPLIER_UPLOAD" && "Uploaded PDF"}
                {invoice.documentSource === "EXTERNAL_LINK" && "External link"}
                {invoice.documentSource === "GENERATED" && "Generated (ERP)"}
              </span>
            </div>
            {previewUrl ? (
              <div className="border rounded-md overflow-hidden bg-muted/30 h-[min(70vh,560px)]">
                <iframe
                  title="Invoice document"
                  src={previewUrl}
                  className="w-full h-full min-h-[400px]"
                />
              </div>
            ) : externalOnly ? (
              <p className="text-sm text-muted-foreground">
                This link is not a direct PDF. Use &quot;Open document&quot; to
                view it in the supplier portal.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No embeddable document. Use Open document if available.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ERP reference</p>
                  <p className="font-medium">{invoice.invoiceId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Supplier invoice #
                  </p>
                  <p className="font-medium">
                    {invoice.supplierInvoiceNumber || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{invoice.toParty || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase order</p>
                  <p className="font-medium">
                    {invoice.purchaseOrder?.orderNumber || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice date</p>
                  <p className="font-medium">
                    {invoice.invoiceDate
                      ? format(new Date(invoice.invoiceDate), "MMM dd, yyyy")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due date</p>
                  <p className="font-medium">
                    {invoice.dueDate
                      ? format(new Date(invoice.dueDate), "MMM dd, yyyy")
                      : "—"}
                  </p>
                </div>
              </div>
              {invoice.itemDescription && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{invoice.itemDescription}</p>
                </div>
              )}
              {invoice.notesRemarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium whitespace-pre-wrap">
                    {invoice.notesRemarks}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Amounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {(invoice.subtotalAmount ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{(invoice.taxAmount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>
                    {(invoice.discountAmount ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>{(invoice.amount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span>
                    {(invoice.outstanding ?? invoice.openAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
