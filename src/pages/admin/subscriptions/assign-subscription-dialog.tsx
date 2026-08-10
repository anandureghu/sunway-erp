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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AssignSubscriptionRequest,
  CompanySubscription,
  SubscriptionPlanType,
} from "@/types/subscription";
import { assignSubscription } from "@/service/subscriptionService";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  companyName?: string;
  initial?: CompanySubscription | null;
  onSaved: () => void;
};

function defaultEndsAt(plan: SubscriptionPlanType, startsAt: string): string {
  const start = new Date(startsAt + "T00:00:00");
  if (plan === "MONTHLY") {
    start.setMonth(start.getMonth() + 1);
    return start.toISOString().slice(0, 10);
  }
  if (plan === "YEARLY") {
    start.setFullYear(start.getFullYear() + 1);
    return start.toISOString().slice(0, 10);
  }
  return "";
}

export function AssignSubscriptionDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  initial,
  onSaved,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [planType, setPlanType] = useState<SubscriptionPlanType>(
    initial?.planType ?? "FREE",
  );
  const [amount, setAmount] = useState(String(initial?.amount ?? "0"));
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? today);
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? "");
  const [warningDays, setWarningDays] = useState(
    String(initial?.warningDays ?? 7),
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlanType(initial?.planType ?? "FREE");
    setAmount(String(initial?.amount ?? "0"));
    setStartsAt(initial?.startsAt ?? today);
    setEndsAt(initial?.endsAt ?? "");
    setWarningDays(String(initial?.warningDays ?? 7));
    setNotes(initial?.notes ?? "");
  }, [open, initial, today]);

  useEffect(() => {
    if (planType === "FREE") {
      setAmount("0");
      return;
    }
    if (planType === "MONTHLY" || planType === "YEARLY") {
      if (!endsAt) setEndsAt(defaultEndsAt(planType, startsAt));
    }
  }, [planType, startsAt]);

  const handleSave = async () => {
    const body: AssignSubscriptionRequest = {
      planType,
      amount: planType === "FREE" ? 0 : Number(amount),
      startsAt,
      endsAt:
        planType === "FREE"
          ? endsAt || null
          : endsAt || defaultEndsAt(planType, startsAt) || undefined,
      warningDays: Number(warningDays) || 7,
      notes: notes || undefined,
      syncCompanyModules: true,
    };
    if (planType === "CUSTOM" && !body.endsAt) {
      toast.error("End date is required for custom plans");
      return;
    }
    setSaving(true);
    try {
      await assignSubscription(companyId, body);
      toast.success("Subscription saved");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save subscription"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit subscription" : "Assign subscription"}
            {companyName ? ` — ${companyName}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select
              value={planType}
              onValueChange={(v) => setPlanType(v as SubscriptionPlanType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {planType !== "FREE" && (
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
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Starts</Label>
              <Input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ends {planType === "FREE" ? "(optional)" : ""}</Label>
              <Input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Warning days</Label>
            <Input
              type="number"
              min={0}
              value={warningDays}
              onChange={(e) => setWarningDays(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
