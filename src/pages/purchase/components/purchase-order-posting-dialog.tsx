import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import type { PurchaseOrderPostingPreview } from "@/types/purchase";

export type PostingDialogAction = "release" | "cancel";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: PostingDialogAction;
  orderNo?: string;
  preview: PurchaseOrderPostingPreview | null;
  loading?: boolean;
  confirming?: boolean;
  onConfirm: () => void | Promise<void>;
};

const titles: Record<PostingDialogAction, string> = {
  release: "Release purchase order",
  cancel: "Cancel purchase order",
};

function formatBalance(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return "—";
  return <CurrencyAmount amount={value} />;
}

function AccountRow({
  label,
  code,
  name,
  before,
  after,
}: {
  label: string;
  code?: string;
  name?: string;
  before?: number;
  after?: number;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">
        {code ? `${code} — ` : ""}
        {name || "—"}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Current balance</p>
          <p className="font-medium tabular-nums">{formatBalance(before)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">After action</p>
          <p className="font-medium tabular-nums">{formatBalance(after)}</p>
        </div>
      </div>
    </div>
  );
}

export function PurchaseOrderPostingDialog({
  open,
  onOpenChange,
  action,
  orderNo,
  preview,
  loading = false,
  confirming = false,
  onConfirm,
}: Props) {
  const canConfirm =
    preview &&
    preview.sufficientFunds &&
    !(action === "release" && preview.fundsAlreadyCommitted);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titles[action]}</DialogTitle>
          <DialogDescription>
            {orderNo ? `${orderNo} — ` : ""}
            Review how this action affects your purchase debit and credit accounts
            before continuing.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading account impact…
          </div>
        )}

        {!loading && preview && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm text-muted-foreground">Order total</span>
              <span className="font-semibold tabular-nums">
                <CurrencyAmount amount={preview.amount} />
              </span>
            </div>

            {preview.summary && (
              <p className="text-sm text-muted-foreground">{preview.summary}</p>
            )}

            {!preview.sufficientFunds && preview.insufficientFundsMessage && (
              <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{preview.insufficientFundsMessage}</span>
              </div>
            )}

            {preview.fundsAlreadyCommitted && action === "release" && (
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Funds are already committed for this order.</span>
              </div>
            )}

            <AccountRow
              label="Debit account (funds from)"
              code={preview.debitAccountCode}
              name={preview.debitAccountName}
              before={preview.debitBalanceBefore}
              after={preview.debitBalanceAfter}
            />
            <AccountRow
              label="Credit account (committed to)"
              code={preview.creditAccountCode}
              name={preview.creditAccountName}
              before={preview.creditBalanceBefore}
              after={preview.creditBalanceAfter}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            Back
          </Button>
          <Button
            type="button"
            variant={action === "cancel" ? "destructive" : "default"}
            disabled={loading || confirming || !canConfirm}
            onClick={() => void onConfirm()}
          >
            {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === "release" ? "Release to supplier" : "Cancel order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
