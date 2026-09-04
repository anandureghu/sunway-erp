import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  cancelSubscription,
  downloadSubscriptionInvoicePdf,
  downloadSubscriptionPaymentReceiptPdf,
  extendSubscription,
  fetchSubscription,
  generateSubscriptionInvoice,
  openBlobPreview,
  regenerateSubscriptionInvoice,
  sendSubscriptionInvoice,
  sendSubscriptionPaymentReceipt,
  triggerBlobDownload,
} from "@/service/subscriptionService";
import type {
  CompanySubscription,
  SubscriptionInvoice,
  SubscriptionPayment,
} from "@/types/subscription";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { AssignSubscriptionDialog } from "./assign-subscription-dialog";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { SubscriptionInvoiceHistoryTable } from "./subscription-invoice-history-table";
import {
  paymentStatusBadge,
  subscriptionStatusBadge,
} from "./subscription-badges";
import {
  Ban,
  CalendarPlus,
  CreditCard,
  Download,
  Eye,
  FileText,
  Mail,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return "—";
  return `${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${currency ? ` ${currency}` : ""}`;
}

export default function SubscriptionDetailPage() {
  const { companyId: companyIdParam } = useParams();
  const companyId = Number(companyIdParam);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const tab = searchParams.get("tab") ?? "overview";
  const setTab = (value: string) => {
    setSearchParams(value === "overview" ? {} : { tab: value }, { replace: true });
  };
  const [data, setData] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState<
    "generate" | "regenerate" | "send" | "preview" | null
  >(null);
  const [receiptBusyId, setReceiptBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(companyId)) return;
    setLoading(true);
    try {
      setData(await fetchSubscription(companyId));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load subscription"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    void load();
  }, [isSuperAdmin, load]);

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!Number.isFinite(companyId)) {
    return <Navigate to="/admin/subscriptions" replace />;
  }

  const handleGenerateInvoice = async (regenerate = false) => {
    setInvoiceBusy(regenerate ? "regenerate" : "generate");
    try {
      const inv = regenerate
        ? await regenerateSubscriptionInvoice(companyId)
        : await generateSubscriptionInvoice(companyId);
      toast.success(
        regenerate
          ? `Invoice ${inv.invoiceNo} regenerated — review the PDF before sending`
          : `Invoice ${inv.invoiceNo} generated — review the PDF before sending`,
      );
      setTab("invoices");
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to generate invoice"));
    } finally {
      setInvoiceBusy(null);
    }
  };

  const handleSendInvoice = async (resend = false) => {
    if (
      !resend &&
      currentPeriodInvoice &&
      (!currentPeriodInvoice.generated || currentPeriodInvoice.stale)
    ) {
      toast.error("Generate and verify the invoice before sending.");
      return;
    }
    const recipients = currentPeriodInvoice?.recipientPreview?.join(", ");
    if (
      !(await confirm(
        resend
          ? `Resend invoice ${currentPeriodInvoice?.invoiceNo ?? ""} to ${recipients ?? "billing contacts"}?`
          : `Send invoice ${currentPeriodInvoice?.invoiceNo ?? ""} to ${recipients ?? "billing contacts"}?`,
      ))
    ) {
      return;
    }
    setInvoiceBusy("send");
    try {
      const inv = await sendSubscriptionInvoice(companyId, resend);
      toast.success(
        inv.sent
          ? `Invoice ${inv.invoiceNo} sent to ${inv.toEmail ?? "billing email"}`
          : `Invoice ${inv.invoiceNo} could not be sent`,
      );
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send invoice"));
    } finally {
      setInvoiceBusy(null);
    }
  };

  const handlePreview = async (inv: SubscriptionInvoice) => {
    setInvoiceBusy("preview");
    try {
      const blob = await downloadSubscriptionInvoicePdf(companyId, inv.id);
      openBlobPreview(blob);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to preview PDF"));
    } finally {
      setInvoiceBusy(null);
    }
  };

  const handleDownload = async (inv: SubscriptionInvoice) => {
    try {
      const blob = await downloadSubscriptionInvoicePdf(companyId, inv.id);
      triggerBlobDownload(blob, `${inv.invoiceNo}.pdf`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to download PDF"));
    }
  };

  const handleDownloadReceipt = async (payment: SubscriptionPayment) => {
    try {
      const blob = await downloadSubscriptionPaymentReceiptPdf(
        companyId,
        payment.id,
      );
      triggerBlobDownload(
        blob,
        `${payment.receiptNo ?? `receipt-${payment.id}`}.pdf`,
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to download receipt"));
    }
  };

  const handleSendReceipt = async (payment: SubscriptionPayment, resend = false) => {
    if (
      !(await confirm(
        resend
          ? `Resend receipt ${payment.receiptNo ?? ""} to billing contacts?`
          : `Send receipt ${payment.receiptNo ?? ""} to billing contacts?`,
      ))
    ) {
      return;
    }
    setReceiptBusyId(payment.id);
    try {
      const updated = await sendSubscriptionPaymentReceipt(
        companyId,
        payment.id,
        resend,
      );
      toast.success(
        updated.receiptSent
          ? `Receipt sent to ${updated.receiptToEmail ?? "billing contacts"}`
          : "Receipt could not be sent",
      );
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send receipt"));
    } finally {
      setReceiptBusyId(null);
    }
  };

  const handleExtend = async () => {
    if (!data) return;
    const base = data.endsAt ? new Date(data.endsAt + "T00:00:00") : new Date();
    if (data.planType === "YEARLY") base.setFullYear(base.getFullYear() + 1);
    else base.setMonth(base.getMonth() + 1);
    const newEndsAt = base.toISOString().slice(0, 10);
    if (!(await confirm(`Extend subscription to ${newEndsAt}?`))) return;
    try {
      await extendSubscription(companyId, { newEndsAt });
      toast.success("Subscription extended");
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to extend"));
    }
  };

  const handleCancel = async () => {
    if (!data) return;
    if (
      !(await confirm(
        `Cancel subscription for "${data.companyName}"? Users will be hard-locked.`,
      ))
    ) {
      return;
    }
    try {
      await cancelSubscription(companyId, { status: "CANCELLED" });
      toast.success("Subscription cancelled");
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to cancel"));
    }
  };

  const currentPeriodInvoice = data?.invoices?.find(
    (inv) =>
      inv.periodStart === data.startsAt &&
      (inv.periodEnd ?? null) === (data.endsAt ?? null),
  );

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title={data?.companyName ?? `Company #${companyId}`}
        description="Subscription detail, payments, invoices, and reminders"
        backHref="/admin/subscriptions"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTab("invoices")}
              disabled={loading || !data}
            >
              <FileText className="mr-2 h-4 w-4" />
              Invoice workflow
            </Button>
          </div>
        }
      />

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data ? (
        <p className="text-sm text-destructive">Subscription not found.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {subscriptionStatusBadge(data.status)}
            {paymentStatusBadge(data.paymentStatus)}
            <Badge variant="secondary">{data.planType}</Badge>
            {data.locked && <Badge variant="destructive">Locked</Badge>}
            {currentPeriodInvoice?.sent && (
              <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">
                Invoice sent
              </Badge>
            )}
            {currentPeriodInvoice?.generated && !currentPeriodInvoice.sent && (
              <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                {currentPeriodInvoice.stale ? "Invoice stale" : "Ready to send"}
              </Badge>
            )}
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                  label="Amount"
                  value={formatMoney(data.amount, data.currencyCode)}
                />
                <InfoCard
                  label="Period"
                  value={`${data.startsAt} → ${data.endsAt ?? "open"}`}
                />
                <InfoCard
                  label="Days left"
                  value={
                    data.daysRemaining == null ? "—" : String(data.daysRemaining)
                  }
                />
                <InfoCard
                  label="Last payment"
                  value={
                    data.lastPaymentOn
                      ? `${data.lastPaymentOn} (${formatMoney(data.lastPaymentAmount, data.currencyCode)})`
                      : "—"
                  }
                />
                <InfoCard
                  label="Max storage"
                  value={formatBytes(data.maxStorageBytes)}
                />
              </div>
              {data.notes && (
                <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  {data.notes}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignOpen(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit plan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentOpen(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record payment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleExtend()}
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Extend
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => void handleCancel()}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="button" variant="ghost" size="sm" asChild>
                  <Link to={`/companies/${companyId}`}>Open company</Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <SubscriptionPaymentsTable
                payments={data.payments ?? []}
                currencyCode={data.currencyCode}
                receiptBusyId={receiptBusyId}
                onDownloadReceipt={(p) => void handleDownloadReceipt(p)}
                onSendReceipt={(p, resend) => void handleSendReceipt(p, resend)}
              />
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <CurrentPeriodInvoicePanel
                subscription={data}
                invoice={currentPeriodInvoice}
                busy={invoiceBusy}
                onGenerate={() => void handleGenerateInvoice(false)}
                onRegenerate={() => void handleGenerateInvoice(true)}
                onPreview={(inv) => void handlePreview(inv)}
                onDownload={(inv) => void handleDownload(inv)}
                onSend={(resend) => void handleSendInvoice(resend)}
              />

              <SubscriptionInvoiceHistoryTable
                invoices={data.invoices ?? []}
                currentPeriodStart={data.startsAt}
                currentPeriodEnd={data.endsAt}
                emptyMessage="No invoices yet. Generate an invoice for the current period to begin."
                onPreview={(inv) => void handlePreview(inv)}
                onDownload={(inv) => void handleDownload(inv)}
                previewBusy={invoiceBusy === "preview"}
              />
            </TabsContent>

            <TabsContent value="reminders">
              <HistoryTable
                empty="No reminder emails logged yet."
                headers={["Type", "Period", "Sent at", "To", "Result"]}
                rows={(data.reminders ?? []).map((r) => [
                  r.reminderType,
                  r.periodKey,
                  new Date(r.sentAt).toLocaleString(),
                  r.toEmail ?? "—",
                  r.success ? "OK" : r.error ?? "Failed",
                ])}
              />
            </TabsContent>
          </Tabs>

          <AssignSubscriptionDialog
            open={assignOpen}
            onOpenChange={setAssignOpen}
            companyId={companyId}
            companyName={data.companyName ?? undefined}
            initial={data}
            onSaved={() => void load()}
          />
          <RecordPaymentDialog
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            companyId={companyId}
            companyName={data.companyName ?? undefined}
            suggestedAmount={data.amount}
            invoices={data.invoices ?? []}
            onSaved={() => void load()}
          />
        </>
      )}

      <Button
        type="button"
        variant="link"
        className="px-0"
        onClick={() => navigate("/admin/subscriptions")}
      >
        Back to listing
      </Button>
    </div>
  );
}

function CurrentPeriodInvoicePanel({
  subscription,
  invoice,
  busy,
  onGenerate,
  onRegenerate,
  onPreview,
  onDownload,
  onSend,
}: {
  subscription: CompanySubscription;
  invoice?: SubscriptionInvoice;
  busy: "generate" | "regenerate" | "send" | "preview" | null;
  onGenerate: () => void;
  onRegenerate: () => void;
  onPreview: (inv: SubscriptionInvoice) => void;
  onDownload: (inv: SubscriptionInvoice) => void;
  onSend: (resend: boolean) => void;
}) {
  const recipients = invoice?.recipientPreview?.join(", ") || "—";
  const canSend =
    !!invoice?.generated && !invoice.stale && !invoice.sent;
  const canRegenerate = !!invoice && !invoice.sent;

  return (
    <div className="rounded-xl border bg-muted/20 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Current period invoice</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate → verify PDF → send for the current billing period (
            {subscription.startsAt} → {subscription.endsAt ?? "open"}). When the
            next period starts, extend the subscription or record payment with
            extend — then generate a new invoice; earlier periods remain in
            invoice history below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!invoice?.generated || invoice.stale ? (
            <Button
              type="button"
              size="sm"
              onClick={invoice?.generated ? onRegenerate : onGenerate}
              disabled={busy != null}
            >
              <FileText className="mr-2 h-4 w-4" />
              {busy === "generate" || busy === "regenerate"
                ? "Working…"
                : invoice?.generated
                  ? "Regenerate"
                  : "Generate invoice"}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => invoice && onPreview(invoice)}
                disabled={!invoice || busy != null}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => invoice && onDownload(invoice)}
                disabled={!invoice}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={!canRegenerate || busy != null}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </>
          )}
          {invoice?.sent ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onSend(true)}
              disabled={busy === "send"}
            >
              <Mail className="mr-2 h-4 w-4" />
              {busy === "send" ? "Sending…" : "Resend"}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => onSend(false)}
              disabled={!canSend || busy === "send"}
            >
              <Mail className="mr-2 h-4 w-4" />
              {busy === "send" ? "Sending…" : "Send invoice"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label="Subscription amount"
          value={formatMoney(subscription.amount, subscription.currencyCode)}
        />
        <InfoCard
          label="Invoice amount"
          value={
            invoice
              ? formatMoney(invoice.amount, invoice.currencyCode)
              : "Not generated"
          }
        />
        <InfoCard label="Recipients" value={recipients} />
        <InfoCard
          label="Status"
          value={
            invoice?.sent
              ? "Sent"
              : invoice?.stale
                ? "Stale — regenerate required"
                : invoice?.generated
                  ? "Generated — verify before send"
                  : invoice?.sendError
                    ? "Send failed"
                    : "Not generated"
          }
        />
      </div>

      {invoice?.stale && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Subscription details changed after the last generate. Update the plan if
          needed, then click Regenerate and verify the PDF before sending.
        </p>
      )}
      {invoice?.sendError && !invoice.sent && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          Last send failed: {invoice.sendError}
        </p>
      )}
      {invoice?.generatedAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          Last generated {new Date(invoice.generatedAt).toLocaleString()}
          {invoice.generatedBy ? ` · user ${invoice.generatedBy}` : ""}
        </p>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function SubscriptionPaymentsTable({
  payments,
  currencyCode,
  receiptBusyId,
  onDownloadReceipt,
  onSendReceipt,
}: {
  payments: SubscriptionPayment[];
  currencyCode?: string | null;
  receiptBusyId: number | null;
  onDownloadReceipt: (payment: SubscriptionPayment) => void;
  onSendReceipt: (payment: SubscriptionPayment, resend?: boolean) => void;
}) {
  if (payments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No payments recorded yet.
      </p>
    );
  }

  const sorted = [...payments].sort((a, b) => b.paidOn.localeCompare(a.paidOn));

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2.5">Paid on</th>
            <th className="px-3 py-2.5">Amount</th>
            <th className="px-3 py-2.5">Invoice</th>
            <th className="px-3 py-2.5">Period</th>
            <th className="px-3 py-2.5">Method</th>
            <th className="px-3 py-2.5">Receipt</th>
            <th className="px-3 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-3 py-2.5">{p.paidOn}</td>
              <td className="px-3 py-2.5">
                {formatMoney(p.amount, currencyCode)}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {p.invoiceNo ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {p.periodStart ?? "—"} → {p.periodEnd ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {p.methodNote ?? "—"}
              </td>
              <td className="px-3 py-2.5">
                {p.receiptGenerated ? (
                  <div className="space-y-0.5">
                    <Badge variant="secondary">{p.receiptNo ?? "Generated"}</Badge>
                    {p.receiptSent ? (
                      <p className="text-xs text-muted-foreground">
                        Sent {p.receiptToEmail ? `to ${p.receiptToEmail}` : ""}
                      </p>
                    ) : p.receiptSendError ? (
                      <p className="text-xs text-destructive">{p.receiptSendError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not sent</p>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right">
                {p.receiptGenerated ? (
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownloadReceipt(p)}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Receipt
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSendReceipt(p, p.receiptSent)}
                      disabled={receiptBusyId === p.id}
                    >
                      <Mail className="mr-1 h-4 w-4" />
                      {receiptBusyId === p.id
                        ? "Sending…"
                        : p.receiptSent
                          ? "Resend"
                          : "Send"}
                    </Button>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
