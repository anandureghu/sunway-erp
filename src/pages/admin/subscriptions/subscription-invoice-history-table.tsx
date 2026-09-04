import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SubscriptionInvoice } from "@/types/subscription";
import { Download, Eye } from "lucide-react";

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return "—";
  return `${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${currency ? ` ${currency}` : ""}`;
}

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function invoiceStatusBadge(inv: SubscriptionInvoice) {
  if (inv.paid) {
    return (
      <div className="space-y-0.5">
        <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
          Paid
        </Badge>
        {inv.receiptNo ? (
          <p className="text-xs text-muted-foreground">{inv.receiptNo}</p>
        ) : null}
      </div>
    );
  }
  if (inv.sent) {
    return (
      <div className="space-y-0.5">
        <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Sent</Badge>
        {inv.toEmail ? (
          <p className="text-xs text-muted-foreground">{inv.toEmail}</p>
        ) : null}
      </div>
    );
  }
  if (inv.stale) {
    return <Badge variant="destructive">Stale</Badge>;
  }
  if (inv.generated) {
    return (
      <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
        Generated
      </Badge>
    );
  }
  if (inv.sendError) {
    return (
      <div className="space-y-0.5">
        <Badge variant="destructive">Send failed</Badge>
        <p className="text-xs text-destructive">{inv.sendError}</p>
      </div>
    );
  }
  return <Badge variant="outline">Draft</Badge>;
}

function isCurrentPeriod(
  inv: SubscriptionInvoice,
  periodStart?: string | null,
  periodEnd?: string | null,
) {
  if (!periodStart) return false;
  return (
    inv.periodStart === periodStart &&
    (inv.periodEnd ?? null) === (periodEnd ?? null)
  );
}

type Props = {
  invoices: SubscriptionInvoice[];
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  emptyMessage?: string;
  onPreview?: (inv: SubscriptionInvoice) => void;
  onDownload: (inv: SubscriptionInvoice) => void;
  previewBusy?: boolean;
};

export function SubscriptionInvoiceHistoryTable({
  invoices,
  currentPeriodStart,
  currentPeriodEnd,
  emptyMessage = "No subscription invoices yet.",
  onPreview,
  onDownload,
  previewBusy,
}: Props) {
  if (invoices.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const sorted = [...invoices].sort((a, b) => {
    const aKey = `${a.periodStart}_${a.periodEnd ?? "open"}`;
    const bKey = `${b.periodStart}_${b.periodEnd ?? "open"}`;
    return bKey.localeCompare(aKey);
  });

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Invoice history</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          One invoice row per billing period. Past periods stay here after you
          extend the subscription and generate the next invoice.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5">Invoice</th>
              <th className="px-3 py-2.5">Period</th>
              <th className="px-3 py-2.5">Amount</th>
              <th className="px-3 py-2.5">Generated</th>
              <th className="px-3 py-2.5">Sent</th>
              <th className="px-3 py-2.5">Payment</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((inv) => {
              const current = isCurrentPeriod(
                inv,
                currentPeriodStart,
                currentPeriodEnd,
              );
              return (
                <tr
                  key={inv.id}
                  className={current ? "border-t bg-violet-50/40" : "border-t"}
                >
                  <td className="px-3 py-2.5 font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      {inv.invoiceNo}
                      {current ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Current period
                        </Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {inv.periodStart} → {inv.periodEnd ?? "open"}
                  </td>
                  <td className="px-3 py-2.5">
                    {formatMoney(inv.amount, inv.currencyCode)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {formatWhen(inv.generatedAt)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {formatWhen(inv.sentAt)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {inv.paid
                      ? `${inv.paidOn ?? "—"}${inv.receiptNo ? ` · ${inv.receiptNo}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5">{invoiceStatusBadge(inv)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      {onPreview ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onPreview(inv)}
                          disabled={previewBusy}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Preview
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(inv)}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
