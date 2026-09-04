import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recordSubscriptionPayment } from "@/service/subscriptionService";
import type { SubscriptionInvoice } from "@/types/subscription";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  companyName?: string;
  suggestedAmount?: number;
  invoices?: SubscriptionInvoice[];
  onSaved: () => void;
};

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return "—";
  return `${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${currency ? ` ${currency}` : ""}`;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  suggestedAmount,
  invoices = [],
  onSaved,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState(String(suggestedAmount ?? ""));
  const [paidOn, setPaidOn] = useState(today);
  const [methodNote, setMethodNote] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [invoiceId, setInvoiceId] = useState<string>("auto");
  const [sendReceipt, setSendReceipt] = useState(true);
  const [saving, setSaving] = useState(false);

  const unpaidInvoices = useMemo(
    () => invoices.filter((inv) => !inv.paid),
    [invoices],
  );

  const selectedInvoice = useMemo(() => {
    if (invoiceId === "auto" || invoiceId === "none") return null;
    return unpaidInvoices.find((inv) => String(inv.id) === invoiceId) ?? null;
  }, [invoiceId, unpaidInvoices]);

  useEffect(() => {
    if (!open) return;
    setAmount(String(suggestedAmount ?? ""));
    setPaidOn(today);
    setMethodNote("");
    setPeriodEnd("");
    setSendReceipt(true);
    const defaultInvoice =
      unpaidInvoices.length === 1 ? String(unpaidInvoices[0].id) : "auto";
    setInvoiceId(defaultInvoice);
  }, [open, suggestedAmount, today, unpaidInvoices]);

  useEffect(() => {
    if (!selectedInvoice) return;
    setAmount(String(selectedInvoice.amount));
  }, [selectedInvoice]);

  const handleSave = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    setSaving(true);
    try {
      await recordSubscriptionPayment(companyId, {
        amount: amt,
        paidOn,
        methodNote: methodNote || undefined,
        periodEnd: periodEnd || undefined,
        invoiceId:
          invoiceId !== "auto" && invoiceId !== "none"
            ? Number(invoiceId)
            : undefined,
        linkInvoice: invoiceId !== "none",
        extendSubscription: true,
        sendReceipt,
      });
      toast.success(
        sendReceipt
          ? "Payment recorded — receipt generated and sent"
          : "Payment recorded — receipt generated",
      );
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to record payment"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Record payment{companyName ? ` — ${companyName}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {unpaidInvoices.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Invoice</Label>
              <Select value={invoiceId} onValueChange={setInvoiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to invoice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    Current period invoice (if available)
                  </SelectItem>
                  {unpaidInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={String(inv.id)}>
                      {inv.invoiceNo} · {inv.periodStart} →{" "}
                      {inv.periodEnd ?? "open"} ·{" "}
                      {formatMoney(inv.amount, inv.currencyCode)}
                    </SelectItem>
                  ))}
                  <SelectItem value="none">No invoice link</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Payment is linked to the selected invoice. A PDF receipt is
                generated automatically.
              </p>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              No unpaid invoices found. Payment will be recorded without an
              invoice link unless you generate one first.
            </p>
          )}
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Paid on</Label>
            <Input
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reference / method note</Label>
            <Input
              placeholder="Bank transfer ref…"
              value={methodNote}
              onChange={(e) => setMethodNote(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>New period end (optional)</Label>
            <Input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to auto-extend by one billing period.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={sendReceipt}
              onCheckedChange={(v) => setSendReceipt(v === true)}
            />
            Email receipt to billing contacts
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Record payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
