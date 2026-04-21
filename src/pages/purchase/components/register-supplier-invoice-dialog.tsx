import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/service/apiClient";
import type { Company } from "@/types/company";
import { useAuth } from "@/context/AuthContext";
import { hasPurchaseAccountingDefaults } from "@/lib/accounting-defaults";
import { toast } from "sonner";
import { listPurchaseOrders } from "@/service/purchaseFlowService";
import type { PurchaseOrder } from "@/types/purchase";
import {
  createInvoiceWithDocument,
  previewPdfText,
  type CreatePurchaseInvoicePayload,
} from "@/service/invoiceService";
import type { InvoiceDocumentSource } from "@/types/finance-invoice";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export function RegisterSupplierInvoiceDialog({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [toParty, setToParty] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [orderId, setOrderId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [tax, setTax] = useState("");
  const [discount, setDiscount] = useState("");
  const [documentSource, setDocumentSource] =
    useState<InvoiceDocumentSource>("SUPPLIER_UPLOAD");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (!open || !user?.companyId) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<Company>(`/companies/${user.companyId}`)
      .then((res) => {
        if (!cancelled) setCompany(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    listPurchaseOrders()
      .then((o) => {
        if (!cancelled) setOrders(o);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, user?.companyId]);

  useEffect(() => {
    if (!invoiceDate) return;
    const d = new Date(invoiceDate);
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().slice(0, 10));
  }, [invoiceDate]);

  const defaultsMissing =
    company != null && !hasPurchaseAccountingDefaults(company);
  const cannotSubmitAccounting =
    !company || !hasPurchaseAccountingDefaults(company);

  const runExtract = async () => {
    if (!file || file.type !== "application/pdf") {
      toast.error("Choose a PDF file first.");
      return;
    }
    setExtracting(true);
    setExtractedText(null);
    try {
      const text = await previewPdfText(file);
      setExtractedText(text || "(no text found)");
    } catch (e: unknown) {
      toast.error("Could not extract text", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cannotSubmitAccounting) {
      toast.error("Configure purchase default accounts in Global Settings.");
      return;
    }
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid total amount.");
      return;
    }
    if (!toParty.trim()) {
      toast.error("Enter supplier name (to party).");
      return;
    }
    if (documentSource === "EXTERNAL_LINK" && !externalUrl.trim()) {
      toast.error("Enter the external document URL.");
      return;
    }
    if (documentSource === "SUPPLIER_UPLOAD" && !file) {
      toast.error("Attach a PDF, or switch to external link / generated.");
      return;
    }
    if (documentSource === "GENERATED" && !orderId) {
      toast.error("Select a purchase order for a generated ERP document.");
      return;
    }

    const debit = company.defaultPurchaseDebitAccountId!;
    const credit = company.defaultPurchaseCreditAccountId!;

    const sub = subtotal ? parseFloat(subtotal) : amt;
    const tx = tax ? parseFloat(tax) : 0;
    const disc = discount ? parseFloat(discount) : 0;

    const payload: CreatePurchaseInvoicePayload = {
      type: "PURCHASE",
      toParty: toParty.trim(),
      invoiceDate,
      dueDate: dueDate || undefined,
      amount: amt,
      subtotalAmount: Number.isNaN(sub) ? amt : sub,
      taxAmount: Number.isNaN(tx) ? 0 : tx,
      discountAmount: Number.isNaN(disc) ? 0 : disc,
      orderId: orderId ? Number(orderId) : null,
      debitAccount: debit,
      creditAccount: credit,
      bankAccountId: company.defaultBankAccountId ?? null,
      supplierInvoiceNumber: supplierInvoiceNumber.trim() || undefined,
      documentSource,
      externalDocumentUrl:
        documentSource === "EXTERNAL_LINK" ? externalUrl.trim() : undefined,
      itemDescription: supplierInvoiceNumber.trim()
        ? `Supplier invoice ${supplierInvoiceNumber.trim()}`
        : "Purchase invoice",
      notesRemarks: notes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await createInvoiceWithDocument(
        payload,
        documentSource === "SUPPLIER_UPLOAD" ? file : null,
      );
      toast.success("Supplier invoice recorded.");
      onCreated();
      onOpenChange(false);
      setToParty("");
      setSupplierInvoiceNumber("");
      setOrderId("");
      setAmount("");
      setSubtotal("");
      setTax("");
      setDiscount("");
      setFile(null);
      setNotes("");
      setExtractedText(null);
      setExternalUrl("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists for this purchase order")) {
        toast.error("This PO already has an invoice", {
          description:
            "Open Purchase Invoices, find the invoice for this PO, and attach your supplier PDF there.",
        });
      } else {
        toast.error("Failed to create invoice", {
          description: msg,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register supplier invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {defaultsMissing && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              Default accounts required: set purchase debit/credit under Global
              Settings → Default accounts before recording AP invoices.
            </div>
          )}

          <div className="space-y-2">
            <Label>Document source</Label>
            <Select
              value={documentSource}
              onValueChange={(v) =>
                setDocumentSource(v as InvoiceDocumentSource)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPPLIER_UPLOAD">Upload supplier PDF</SelectItem>
                <SelectItem value="EXTERNAL_LINK">External link</SelectItem>
                <SelectItem value="GENERATED">
                  Generated from purchase order
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toParty">Supplier (to party)</Label>
            <Input
              id="toParty"
              value={toParty}
              onChange={(e) => setToParty(e.target.value)}
              placeholder="Vendor name as on invoice"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supInv">Supplier invoice number (optional)</Label>
            <Input
              id="supInv"
              value={supplierInvoiceNumber}
              onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
              placeholder="Their reference — avoids duplicates per PO"
            />
          </div>

          <div className="space-y-2">
            <Label>Purchase order (optional)</Label>
            <Select value={orderId || "__none__"} onValueChange={(v) => setOrderId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Link to PO" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.orderNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="invDate">Invoice date</Label>
              <Input
                id="invDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Due date</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amt">Total amount</Label>
            <Input
              id="amt"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="sub">Subtotal</Label>
              <Input
                id="sub"
                type="number"
                step="0.01"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                placeholder="opt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx">Tax</Label>
              <Input
                id="tx"
                type="number"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                placeholder="opt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disc">Discount</Label>
              <Input
                id="disc"
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="opt"
              />
            </div>
          </div>

          {documentSource === "SUPPLIER_UPLOAD" && (
            <div className="space-y-2">
              <Label htmlFor="pdf">Supplier PDF</Label>
              <Input
                id="pdf"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setExtractedText(null);
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={runExtract}
                  disabled={extracting || !file}
                >
                  {extracting ? "Reading…" : "Preview PDF text"}
                </Button>
              </div>
              {extractedText != null && (
                <pre className="text-xs bg-muted p-2 rounded-md max-h-40 overflow-auto whitespace-pre-wrap">
                  {extractedText}
                </pre>
              )}
            </div>
          )}

          {documentSource === "EXTERNAL_LINK" && (
            <div className="space-y-2">
              <Label htmlFor="ext">Document URL</Label>
              <Input
                id="ext"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://…"
              />
              <p className="text-xs text-muted-foreground">
                Portal pages open in a new tab; direct .pdf links can be embedded
                on the detail page.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || loading || cannotSubmitAccounting}
            >
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
