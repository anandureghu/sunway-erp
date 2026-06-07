import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  attachSupplierDocument,
  createInvoiceWithDocument,
  findPurchaseInvoiceForOrder,
  invoiceApiError,
  previewPdfText,
  updatePurchaseInvoice,
  type CreatePurchaseInvoicePayload,
} from "@/service/invoiceService";
import type { InvoiceDocumentSource } from "@/types/finance-invoice";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  Info,
  Link2,
  Loader2,
  Paperclip,
  Receipt,
  Sparkles,
  Upload,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const DOCUMENT_SOURCES: Array<{
  value: InvoiceDocumentSource;
  label: string;
  description: string;
  icon: typeof Upload;
}> = [
  {
    value: "SUPPLIER_UPLOAD",
    label: "Upload PDF",
    description: "Attach the supplier's invoice file",
    icon: Upload,
  },
  {
    value: "EXTERNAL_LINK",
    label: "External link",
    description: "Reference a document hosted elsewhere",
    icon: Link2,
  },
  {
    value: "GENERATED",
    label: "From PO",
    description: "Use the ERP document for a purchase order",
    icon: Sparkles,
  },
];

function FormField({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

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
  const [invoiceDate, setInvoiceDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
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
  const [linkedInvoiceId, setLinkedInvoiceId] = useState<number | null>(null);
  const [resolvingLinkedInvoice, setResolvingLinkedInvoice] = useState(false);

  useEffect(() => {
    if (!open || !user?.companyId) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<Company>(`/companies/${user.companyId}`)
      .then((res) => {
        if (!cancelled) setCompany(res.data);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Could not load company accounting defaults.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    listPurchaseOrders()
      .then((o) => {
        if (!cancelled) setOrders(o);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Could not load purchase orders.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, user?.companyId]);

  useEffect(() => {
    if (!open || !orderId) {
      setLinkedInvoiceId(null);
      return;
    }

    const po = orders.find((o) => o.id === orderId);
    if (po?.purchaseInvoiceId != null) {
      setLinkedInvoiceId(po.purchaseInvoiceId);
      return;
    }

    let cancelled = false;
    setResolvingLinkedInvoice(true);
    findPurchaseInvoiceForOrder(orderId)
      .then((invoice) => {
        if (!cancelled) setLinkedInvoiceId(invoice?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setLinkedInvoiceId(null);
      })
      .finally(() => {
        if (!cancelled) setResolvingLinkedInvoice(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, orderId, orders]);

  const handleOrderChange = (value: string) => {
    const nextOrderId = value === "__none__" ? "" : value;
    setOrderId(nextOrderId);
    if (!nextOrderId) return;

    const po = orders.find((o) => o.id === nextOrderId);
    if (!po) return;

    if (po.supplierName) setToParty(po.supplierName);
    if (po.total != null) {
      const total = String(po.total);
      setAmount(total);
      if (!subtotal) setSubtotal(total);
    }
  };

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

    const resetForm = () => {
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
      setLinkedInvoiceId(null);
    };

    setSubmitting(true);
    try {
      let existingInvoiceId = linkedInvoiceId;
      if (!existingInvoiceId && orderId) {
        const existing = await findPurchaseInvoiceForOrder(orderId);
        existingInvoiceId = existing?.id ?? null;
      }

      if (existingInvoiceId && orderId) {
        if (documentSource === "GENERATED") {
          toast.info("This purchase order already has a system invoice.", {
            description:
              "Open the existing purchase invoice to view the generated document.",
          });
          return;
        }

        if (documentSource === "SUPPLIER_UPLOAD") {
          if (!file) {
            toast.error("Attach a supplier PDF to upload.");
            return;
          }
          await attachSupplierDocument(existingInvoiceId, file);
        }

        await updatePurchaseInvoice(existingInvoiceId, payload);
        toast.success(
          documentSource === "SUPPLIER_UPLOAD"
            ? "Supplier document attached to the purchase invoice."
            : "Purchase invoice updated.",
        );
      } else {
        if (documentSource === "GENERATED" && orderId) {
          const po = orders.find((o) => o.id === orderId);
          const status = (po?.status || "").toLowerCase();
          if (status === "draft" || status === "cancelled") {
            toast.error(
              "Generated invoices are created when the purchase order is released to the supplier.",
            );
            return;
          }
        }

        await createInvoiceWithDocument(
          payload,
          documentSource === "SUPPLIER_UPLOAD" ? file : null,
        );
        toast.success("Supplier invoice recorded.");
      }

      onCreated();
      onOpenChange(false);
      resetForm();
    } catch (err: unknown) {
      const msg = invoiceApiError(err, "Failed to save invoice");
      if (msg.includes("already exists for this purchase order")) {
        toast.error("This purchase order already has an invoice", {
          description:
            "Select the linked PO again — the form will attach your supplier document to the existing invoice.",
        });
      } else {
        toast.error("Failed to save invoice", {
          description: msg,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Register supplier invoice
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Record a supplier invoice for accounts payable — link it to a
              purchase order when available.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="space-y-4 overflow-y-auto px-6 py-5">
            {defaultsMissing && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Default accounts required: set purchase debit/credit under{" "}
                  <strong>Global Settings → Default accounts</strong> before
                  recording AP invoices.
                </p>
              </div>
            )}

            {orderId && linkedInvoiceId && (
              <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  This purchase order already has a system invoice. Saving will
                  update that invoice
                  {documentSource === "SUPPLIER_UPLOAD"
                    ? " and attach your supplier PDF"
                    : ""}
                  .
                </p>
              </div>
            )}

            {orderId && resolvingLinkedInvoice && (
              <p className="text-sm text-slate-500">
                Checking for an existing purchase invoice…
              </p>
            )}

            <SectionCard
              title="Document source"
              description="Choose how this invoice document will be stored."
              icon={<Paperclip className="h-4 w-4" />}
            >
              <div className="grid gap-2 sm:grid-cols-3">
                {DOCUMENT_SOURCES.map((source) => {
                  const Icon = source.icon;
                  const selected = documentSource === source.value;
                  return (
                    <button
                      key={source.value}
                      type="button"
                      onClick={() => setDocumentSource(source.value)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        selected
                          ? "border-emerald-300 bg-emerald-50/80 shadow-sm ring-1 ring-emerald-200"
                          : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mb-2 h-4 w-4",
                          selected ? "text-emerald-600" : "text-slate-500",
                        )}
                      />
                      <p className="text-sm font-semibold text-slate-900">
                        {source.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {source.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="Supplier & reference"
              description="Who issued the invoice and how it ties back to procurement."
              icon={<Building2 className="h-4 w-4" />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Supplier (to party)" htmlFor="toParty">
                  <Input
                    id="toParty"
                    value={toParty}
                    onChange={(e) => setToParty(e.target.value)}
                    placeholder="Vendor name as on invoice"
                    className="rounded-lg"
                    required
                  />
                </FormField>
                <FormField
                  label="Supplier invoice number"
                  htmlFor="supInv"
                  hint="Optional — helps avoid duplicates per purchase order"
                >
                  <Input
                    id="supInv"
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    placeholder="Their reference number"
                    className="rounded-lg"
                  />
                </FormField>
                <FormField
                  label="Purchase order"
                  hint={
                    documentSource === "GENERATED"
                      ? "Required when using a generated ERP document"
                      : "Optional link to a purchase order"
                  }
                  className="sm:col-span-2"
                >
                  <Select
                    value={orderId || "__none__"}
                    onValueChange={handleOrderChange}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Link to purchase order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.orderNo}
                          {o.supplierName ? ` — ${o.supplierName}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </SectionCard>

            <SectionCard
              title="Dates & amounts"
              description="Invoice timing and financial breakdown."
              icon={<Calendar className="h-4 w-4" />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Invoice date" htmlFor="invDate">
                  <Input
                    id="invDate"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="rounded-lg"
                    required
                  />
                </FormField>
                <FormField
                  label="Due date"
                  htmlFor="due"
                  hint="Defaults to 30 days after invoice date"
                >
                  <Input
                    id="due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="rounded-lg"
                  />
                </FormField>
                <FormField label="Total amount" htmlFor="amt" className="sm:col-span-2">
                  <Input
                    id="amt"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-lg font-medium"
                    required
                  />
                </FormField>
                <FormField label="Subtotal" htmlFor="sub">
                  <Input
                    id="sub"
                    type="number"
                    step="0.01"
                    value={subtotal}
                    onChange={(e) => setSubtotal(e.target.value)}
                    placeholder="Optional"
                    className="rounded-lg"
                  />
                </FormField>
                <FormField label="Tax" htmlFor="tx">
                  <Input
                    id="tx"
                    type="number"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    placeholder="Optional"
                    className="rounded-lg"
                  />
                </FormField>
                <FormField label="Discount" htmlFor="disc">
                  <Input
                    id="disc"
                    type="number"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="Optional"
                    className="rounded-lg"
                  />
                </FormField>
              </div>
            </SectionCard>

            {documentSource === "SUPPLIER_UPLOAD" && (
              <SectionCard
                title="Supplier PDF"
                description="Upload the invoice file received from the vendor."
                icon={<FileText className="h-4 w-4" />}
              >
                <div className="space-y-3">
                  <label
                    htmlFor="pdf"
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
                      file
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-slate-200 bg-slate-50/50 hover:border-emerald-200 hover:bg-emerald-50/30",
                    )}
                  >
                    <Upload className="mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-900">
                      {file ? file.name : "Click to choose a PDF file"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      PDF only · max one file
                    </p>
                    <Input
                      id="pdf"
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={(e) => {
                        setFile(e.target.files?.[0] ?? null);
                        setExtractedText(null);
                      }}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={runExtract}
                      disabled={extracting || !file}
                    >
                      {extracting ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Reading…
                        </>
                      ) : (
                        "Preview PDF text"
                      )}
                    </Button>
                    {file ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-slate-500"
                        onClick={() => {
                          setFile(null);
                          setExtractedText(null);
                        }}
                      >
                        Remove file
                      </Button>
                    ) : null}
                  </div>
                  {extractedText != null && (
                    <pre className="max-h-40 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs whitespace-pre-wrap text-slate-700">
                      {extractedText}
                    </pre>
                  )}
                </div>
              </SectionCard>
            )}

            {documentSource === "EXTERNAL_LINK" && (
              <SectionCard
                title="External document"
                description="Link to an invoice hosted on a supplier portal or storage."
                icon={<Link2 className="h-4 w-4" />}
              >
                <FormField
                  label="Document URL"
                  htmlFor="ext"
                  hint="Portal pages open in a new tab; direct .pdf links can be embedded on the detail page."
                >
                  <Input
                    id="ext"
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://…"
                    className="rounded-lg"
                  />
                </FormField>
              </SectionCard>
            )}

            <SectionCard
              title="Notes"
              description="Optional internal remarks for finance or procurement."
              icon={<Receipt className="h-4 w-4" />}
            >
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Payment terms, matching notes, or follow-up actions…"
                className="rounded-lg resize-none"
              />
            </SectionCard>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
              disabled={
                submitting ||
                loading ||
                cannotSubmitAccounting ||
                resolvingLinkedInvoice
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : linkedInvoiceId && orderId ? (
                "Update linked invoice"
              ) : (
                "Save invoice"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
