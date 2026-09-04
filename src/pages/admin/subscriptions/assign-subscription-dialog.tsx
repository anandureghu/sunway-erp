import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ItemSectionCard } from "@/components/inventory/item-section-card";
import type {
  AssignSubscriptionRequest,
  CompanySubscription,
  SubscriptionPlanType,
} from "@/types/subscription";
import { assignSubscription } from "@/service/subscriptionService";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { CalendarRange, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

/** Default quota shown when assigning a new plan (matches backend plan default). */
const DEFAULT_MAX_STORAGE_GIB = 5;
const GIB = 1024 * 1024 * 1024;

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

function bytesToGiBInput(bytes?: number | null): string {
  if (bytes == null || bytes <= 0) return String(DEFAULT_MAX_STORAGE_GIB);
  const gib = bytes / GIB;
  return String(Math.round(gib * 100) / 100);
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
  const [maxStorageGiB, setMaxStorageGiB] = useState(
    bytesToGiBInput(initial?.maxStorageBytes),
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
    setMaxStorageGiB(bytesToGiBInput(initial?.maxStorageBytes));
    setNotes(initial?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open only
  }, [open]);

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
    const gib = Number(maxStorageGiB);
    if (!Number.isFinite(gib) || gib < 0) {
      toast.error("Max storage must be zero or a positive number (GiB)");
      return;
    }
    const body: AssignSubscriptionRequest = {
      planType,
      amount: planType === "FREE" ? 0 : Number(amount),
      startsAt,
      endsAt:
        planType === "FREE"
          ? endsAt || null
          : endsAt || defaultEndsAt(planType, startsAt) || undefined,
      warningDays: Number(warningDays) || 7,
      maxStorageBytes: Math.round(gib * GIB),
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
      <DialogContent className="flex h-fit max-h-[90vh] w-full max-w-xl flex-col gap-0 overflow-y-auto border-0 bg-slate-100 p-0 sm:rounded-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-100 bg-white px-5 py-3.5 text-left">
          <DialogTitle className="text-base font-semibold text-slate-900">
            {initial ? "Edit subscription" : "Assign subscription"}
            {companyName ? ` — ${companyName}` : ""}
          </DialogTitle>
          <p className="text-[13px] font-normal text-slate-500">
            {initial
              ? "Update plan, billing window, and storage limits."
              : "Set plan, billing window, and storage limits for this company."}
          </p>
        </DialogHeader>

        <div className="space-y-3 p-4">
          <ItemSectionCard
            className="h-auto"
            icon={<CalendarRange className="h-3.5 w-3.5 text-white" />}
            title="Plan & billing"
          >
            <F label="Plan" required>
              <Select
                value={planType}
                onValueChange={(v) => setPlanType(v as SubscriptionPlanType)}
              >
                <SelectTrigger className={icls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </F>

            {planType !== "FREE" && (
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
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Starts" required>
                <Input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className={icls}
                />
              </F>
              <F label={planType === "FREE" ? "Ends (optional)" : "Ends"} required={planType !== "FREE"}>
                <Input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className={icls}
                />
              </F>
            </div>
          </ItemSectionCard>

          <ItemSectionCard
            className="h-auto"
            icon={<HardDrive className="h-3.5 w-3.5 text-white" />}
            title="Limits & notes"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Warning days">
                <Input
                  type="number"
                  min={0}
                  value={warningDays}
                  onChange={(e) => setWarningDays(e.target.value)}
                  className={icls}
                />
              </F>
              <F label="Max storage (GiB)" required>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={maxStorageGiB}
                  onChange={(e) => setMaxStorageGiB(e.target.value)}
                  className={icls}
                />
              </F>
            </div>
            <p className="text-[11px] text-slate-400">
              Default for all plans is {DEFAULT_MAX_STORAGE_GIB} GiB. Cloud and
              database usage both count toward this limit; uploads are blocked
              when the total is reached.
            </p>
            <F label="Notes">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={icls}
                placeholder="Optional internal notes"
              />
            </F>
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
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
