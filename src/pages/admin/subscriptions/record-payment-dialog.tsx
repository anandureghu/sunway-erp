import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recordSubscriptionPayment } from "@/service/subscriptionService";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  companyName?: string;
  suggestedAmount?: number;
  onSaved: () => void;
};

export function RecordPaymentDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  suggestedAmount,
  onSaved,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState(String(suggestedAmount ?? ""));
  const [paidOn, setPaidOn] = useState(today);
  const [methodNote, setMethodNote] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(String(suggestedAmount ?? ""));
    setPaidOn(today);
    setMethodNote("");
    setPeriodEnd("");
  }, [open, suggestedAmount, today]);

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
        extendSubscription: true,
      });
      toast.success("Payment recorded");
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
