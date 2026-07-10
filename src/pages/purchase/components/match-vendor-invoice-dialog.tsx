import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { matchVendorInvoice } from "@/service/invoiceService";
import type { FinanceInvoice } from "@/types/finance-invoice";
import { toast } from "sonner";
import { CheckSquare, Loader2, Upload } from "lucide-react";

type Props = {
  invoice: FinanceInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatched: () => void;
};

export function MatchVendorInvoiceDialog({
  invoice,
  open,
  onOpenChange,
  onMatched,
}: Props) {
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setVendorInvoiceNumber(invoice?.supplierInvoiceNumber || "");
      setFile(null);
    }
  }, [open, invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    if (!vendorInvoiceNumber.trim()) {
      toast.error("The vendor invoice code is required.");
      return;
    }
    setSubmitting(true);
    try {
      await matchVendorInvoice(invoice.id, vendorInvoiceNumber.trim(), file);
      toast.success("Vendor invoice matched.");
      onMatched();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to match vendor invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-emerald-600" />
            Match Vendor Invoice
          </DialogTitle>
          <DialogDescription>
            Record the vendor&apos;s invoice number before this purchase
            order&apos;s vendor payment can be confirmed. Attaching their
            invoice document is optional but recommended.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vendorInvoiceNumber">Vendor invoice code</Label>
            <Input
              id="vendorInvoiceNumber"
              value={vendorInvoiceNumber}
              onChange={(e) => setVendorInvoiceNumber(e.target.value)}
              placeholder="Vendor's own invoice number"
              className="rounded-lg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendorInvoiceDoc">
              Vendor invoice document (optional)
            </Label>
            {invoice?.vendorInvoiceDocumentUrl && (
              <a
                href={invoice.vendorInvoiceDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-primary underline underline-offset-2"
              >
                View current document
              </a>
            )}
            <label
              htmlFor="vendorInvoiceDoc"
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-colors",
                file
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50/50 hover:border-emerald-200 hover:bg-emerald-50/30",
              )}
            >
              <Upload className="mb-2 h-6 w-6 text-slate-400" />
              <p className="text-sm font-medium text-slate-900">
                {file
                  ? file.name
                  : invoice?.vendorInvoiceDocumentUrl
                    ? "Click to replace the attached document"
                    : "Click to choose a PDF or image"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                PDF, JPG, or PNG · max 15MB
              </p>
              <Input
                id="vendorInvoiceDoc"
                type="file"
                accept="application/pdf,image/*"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
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
              disabled={submitting || !vendorInvoiceNumber.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Matching…
                </>
              ) : (
                "Match invoice"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
