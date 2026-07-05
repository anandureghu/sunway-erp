import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import {
  getInvoice,
  getInvoicePdfUrl,
  invoiceDocumentPreviewUrl,
} from "@/service/invoiceService";
import { apiClient } from "@/service/apiClient";
import type { FinanceInvoice } from "@/types/finance-invoice";
import type { Invoice } from "@/types/sales";
import { toast } from "sonner";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { isInvoiceReceiptView } from "@/lib/invoice-status-filter";
import { resolveBackHref } from "@/lib/navigation-back";
import { PurchasePageHeader } from "./components/purchase-page-header";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";
import {
  formatInvoiceDate,
  safeInvoiceValue,
} from "@/lib/invoice-document-utils";

export default function PurchaseInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState<FinanceInvoice | null>(null);
  const [documentInvoice, setDocumentInvoice] = useState<Invoice | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    let cancelled = false;
    setLoading(true);
    getInvoice(num)
      .then(async (inv) => {
        if (cancelled) return;
        if (inv.type && inv.type !== "PURCHASE") {
          toast.message("This record is not a purchase invoice.");
        }
        setInvoice(inv);
        if (inv.documentSource === "GENERATED") {
          try {
            const full = await apiClient.get<Invoice>(`/invoices/${num}`);
            if (!cancelled) setDocumentInvoice(full.data);
          } catch {
            if (!cancelled) setDocumentInvoice(null);
          }
        } else if (!cancelled) {
          setDocumentInvoice(null);
        }

        const paid =
          (inv.status || "").trim().toUpperCase() === "PAID" &&
          inv.documentSource === "GENERATED";
        if (paid) {
          try {
            // Ensures receipt PDF exists (separate from original invoice PDF).
            const receiptUrl = await getInvoicePdfUrl(inv.id);
            if (cancelled) return;
            setPreviewUrl(receiptUrl);
            setInvoice((prev) =>
              prev ? { ...prev, receiptPdfUrl: receiptUrl } : prev,
            );
            return;
          } catch {
            /* fall through to stored URL */
          }
        }
        if (!cancelled) {
          setPreviewUrl(invoiceDocumentPreviewUrl(inv));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInvoice(null);
          setPreviewUrl(null);
          toast.error("Could not load invoice");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
          <Button
            variant="outline"
            onClick={() => navigate("/inventory/purchase/invoices")}
          >
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

  const externalOnly =
    invoice.documentSource === "EXTERNAL_LINK" &&
    invoice.externalDocumentUrl &&
    !previewUrl;

  const isPaid = isInvoiceReceiptView(invoice.status);
  const isGenerated = invoice.documentSource === "GENERATED";
  const showReceipt = isGenerated && isPaid;
  const openDocumentHref =
    invoice.externalDocumentUrl ||
    (showReceipt ? invoice.receiptPdfUrl : null) ||
    invoice.pdfUrl ||
    undefined;

  const handleDownloadPdf = async () => {
    try {
      const url = await getInvoicePdfUrl(invoice.id);
      if (url && !url.includes("dummy.url")) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("PDF is not available.");
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax?.response?.data?.message ||
          (err instanceof Error ? err.message : "Could not download PDF."),
      );
    }
  };

  const handleEmailDocument = async () => {
    if (!isGenerated) return;
    try {
      if (isPaid) {
        await apiClient.post(`/invoices/${invoice.id}/receipt-email`);
        toast.success("Receipt email sent (when mail is configured).");
      } else {
        await apiClient.post(`/invoices/${invoice.id}/email`);
        toast.success("Invoice email sent (when mail is configured).");
      }
    } catch {
      toast.error(
        isPaid ? "Could not send receipt email." : "Could not send invoice email.",
      );
    }
  };

  if (isGenerated && documentInvoice) {
    const orderNo =
      documentInvoice.orderNumber ||
      documentInvoice.purchaseOrder?.orderNumber;
    return (
      <div className="space-y-6 bg-slate-100 p-4 sm:p-6">
        <PurchasePageHeader
          title={documentInvoice.invoiceId}
          description={[
            orderNo ? `PO ${orderNo}` : null,
            documentInvoice.toParty,
            documentInvoice.dueDate
              ? `Due ${formatInvoiceDate(documentInvoice.dueDate)}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          backHref={resolveBackHref(
            location.state,
            "/inventory/purchase/invoices",
          )}
          actions={
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                onClick={() => void handleDownloadPdf()}
              >
                {showReceipt ? "Download receipt" : "Download invoice"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                onClick={() => void handleEmailDocument()}
              >
                {showReceipt ? "Email receipt" : "Email invoice"}
              </Button>
              {openDocumentHref && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                  asChild
                >
                  <a
                    href={openDocumentHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open PDF
                  </a>
                </Button>
              )}
              <Badge
                className={statusColors[statusRaw] || "bg-gray-100 text-gray-800"}
              >
                {safeInvoiceValue(invoice.status)}
              </Badge>
            </>
          }
        />

        <InvoiceDocumentPreview
          invoice={documentInvoice}
          currencyCode={documentInvoice.currencyCode}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PurchasePageHeader
        title={invoice.invoiceId}
        description={[
          invoice.orderNumber || invoice.purchaseOrder?.orderNumber
            ? `PO ${invoice.orderNumber || invoice.purchaseOrder?.orderNumber}`
            : null,
          "Supplier document and posted amounts.",
        ]
          .filter(Boolean)
          .join(" · ")}
        backHref={resolveBackHref(
          location.state,
          "/inventory/purchase/invoices",
        )}
        actions={
          <>
            {isGenerated && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                onClick={() => void handleDownloadPdf()}
              >
                {showReceipt ? "Download receipt" : "Download invoice"}
              </Button>
            )}
            {isGenerated && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                onClick={() => void handleEmailDocument()}
              >
                {showReceipt ? "Email receipt" : "Email invoice"}
              </Button>
            )}
            {openDocumentHref && (
              <Button
                variant="secondary"
                size="sm"
                className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                asChild
              >
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
              className={statusColors[statusRaw] || "bg-gray-100 text-gray-800"}
            >
              {(invoice.status || "—")
                .replace(/_/g, " ")
                .toLowerCase()
                .split(" ")
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" ")}
            </Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {showReceipt ? "Receipt" : "Invoice"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Source:{" "}
              <span className="text-foreground font-medium">
                {invoice.documentSource === "SUPPLIER_UPLOAD" && "Uploaded PDF"}
                {invoice.documentSource === "EXTERNAL_LINK" && "External link"}
                {invoice.documentSource === "GENERATED" &&
                  (showReceipt ? "Generated receipt (ERP)" : "Generated invoice (ERP)")}
              </span>
            </div>
            {previewUrl ? (
              <div className="border rounded-md overflow-hidden bg-muted/30 h-[min(70vh,560px)]">
                <iframe
                  title={showReceipt ? "Receipt document" : "Invoice document"}
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
                  <p className="text-sm text-muted-foreground">
                    Purchase order
                  </p>
                  <p className="font-medium">
                    {invoice.orderNumber ||
                      invoice.purchaseOrder?.orderNumber ||
                      "—"}
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

          <Card className="ml-auto w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Amounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    <CurrencyAmount amount={invoice.subtotalAmount ?? 0} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>
                    <CurrencyAmount amount={invoice.taxAmount ?? 0} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>
                    <CurrencyAmount amount={invoice.discountAmount ?? 0} />
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total Due</span>
                  <span>
                    <CurrencyAmount amount={invoice.amount ?? 0} />
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span>
                    <CurrencyAmount
                      amount={invoice.outstanding ?? invoice.openAmount ?? 0}
                    />
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
