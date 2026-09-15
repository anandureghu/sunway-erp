import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SubscriptionInvoice } from "@/types/subscription";
import { Archive, ArchiveRestore, Download, Eye } from "lucide-react";

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
  onArchive?: (inv: SubscriptionInvoice, archived: boolean) => void;
  archiveBusyId?: string | null;
  previewBusy?: boolean;
  pageSize?: number;
};

export function SubscriptionInvoiceHistoryTable({
  invoices,
  currentPeriodStart,
  currentPeriodEnd,
  emptyMessage = "No subscription invoices yet.",
  onPreview,
  onDownload,
  onArchive,
  archiveBusyId,
  previewBusy,
  pageSize = 10,
}: Props) {
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () =>
      [...invoices].sort((a, b) => {
        const aKey = `${a.periodStart}_${a.periodEnd ?? "open"}`;
        const bKey = `${b.periodStart}_${b.periodEnd ?? "open"}`;
        return bKey.localeCompare(aKey);
      }),
    [invoices],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = sorted.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );

  if (invoices.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Invoice history</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          One invoice row per billing period. Archive older periods as the list
          grows; use Show archived to restore them.
        </p>
      </div>
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-3">Invoice</th>
                <th className="px-3 py-3">Period</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Generated</th>
                <th className="px-3 py-3">Sent</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((inv) => {
                const current = isCurrentPeriod(
                  inv,
                  currentPeriodStart,
                  currentPeriodEnd,
                );
                return (
                  <tr
                    key={inv.id}
                    className={`border-t border-slate-100 ${
                      inv.archived
                        ? "bg-slate-50/70 opacity-80"
                        : current
                          ? "bg-violet-50/40"
                          : ""
                    }`}
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
                          {inv.paid ? "Receipt" : "PDF"}
                        </Button>
                        {onArchive && !current ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={archiveBusyId === `inv-${inv.id}`}
                            onClick={() => onArchive(inv, !inv.archived)}
                          >
                            {inv.archived ? (
                              <ArchiveRestore className="mr-1 h-4 w-4" />
                            ) : (
                              <Archive className="mr-1 h-4 w-4" />
                            )}
                            {inv.archived ? "Restore" : "Archive"}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {sorted.length} record{sorted.length === 1 ? "" : "s"}
          </p>
          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-xl"
                disabled={safePage <= 0}
                onClick={() => setPage(safePage - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {safePage + 1} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-xl"
                disabled={safePage + 1 >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
