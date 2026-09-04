import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ItemSectionCard } from "@/components/inventory/item-section-card";
import { recordSubscriptionPayment } from "@/service/subscriptionService";
import type { SubscriptionInvoice } from "@/types/subscription";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { CreditCard, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  companyName?: string;
  suggestedAmount?: number;
  invoices?: SubscriptionInvoice[];
  onSaved: () => void;
};

/** Stable default so omitting `invoices` does not recreate `[]` every render. */
const EMPTY_INVOICES: SubscriptionInvoice[] = [];

const icls =
  "h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

function F({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}

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
  invoices = EMPTY_INVOICES,
  onSaved,
}: Props) {
  const [amount, setAmount] = useState(String(suggestedAmount ?? ""));
  const [paidOn, setPaidOn] = useState("");
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

  // Reset only when the dialog opens — not on every keystroke / invoices identity change.
  useEffect(() => {
    if (!open) return;
    const unpaid = invoices.filter((inv) => !inv.paid);
    setAmount(String(suggestedAmount ?? ""));
    setPaidOn(new Date().toISOString().slice(0, 10));
    setMethodNote("");
    setPeriodEnd("");
    setSendReceipt(true);
    setInvoiceId(unpaid.length === 1 ? String(unpaid[0].id) : "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: open transition only
  }, [open]);

  useEffect(() => {
    if (!selectedInvoice) return;
    setAmount(String(selectedInvoice.amount));
  }, [selectedInvoice?.id, selectedInvoice?.amount]);

  const handleSave = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (!paidOn) {
      toast.error("Select a paid-on date");
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
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-0 bg-slate-50/80 p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-slate-100 bg-white px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Record payment{companyName ? ` — ${companyName}` : ""}
          </DialogTitle>
          <p className="text-[13px] font-normal text-slate-500">
            Capture payment details and optionally email a PDF receipt.
          </p>
        </DialogHeader>

        <div className="space-y-4 p-5">
          <ItemSectionCard
            icon={<CreditCard className="h-3.5 w-3.5 text-white" />}
            title="Payment details"
          >
            {unpaidInvoices.length > 0 ? (
              <F label="Invoice">
                <Select value={invoiceId} onValueChange={setInvoiceId}>
                  <SelectTrigger className={icls}>
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
                <p className="mt-1 text-[11px] text-slate-400">
                  Payment is linked to the selected invoice. A PDF receipt is
                  generated automatically.
                </p>
              </F>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
                No unpaid invoices found. Payment will be recorded without an
                invoice link unless you generate one first.
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Amount" required>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={icls}
                />
              </F>
              <F label="Paid on" required>
                <Input
                  type="date"
                  value={paidOn}
                  onChange={(e) => setPaidOn(e.target.value)}
                  className={icls}
                />
              </F>
            </div>

            <F label="Reference / method note">
              <Input
                placeholder="Bank transfer ref…"
                value={methodNote}
                onChange={(e) => setMethodNote(e.target.value)}
                className={icls}
              />
            </F>

            <F label="New period end (optional)">
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className={icls}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Leave blank to auto-extend by one billing period.
              </p>
            </F>
          </ItemSectionCard>

          <ItemSectionCard
            icon={<Mail className="h-3.5 w-3.5 text-white" />}
            title="Receipt"
          >
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-slate-700">
              <Checkbox
                checked={sendReceipt}
                onCheckedChange={(v) => setSendReceipt(v === true)}
              />
              Email receipt to billing contacts
            </label>
          </ItemSectionCard>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-slate-900 hover:bg-slate-800"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Record payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
