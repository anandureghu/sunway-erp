import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  cancelSubscription,
  archiveSubscriptionInvoice,
  archiveSubscriptionPayment,
  archiveSubscriptionReminder,
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
  SubscriptionReminderLog,
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
  Archive,
  ArchiveRestore,
  Ban,
  Building2,
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
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const HISTORY_PAGE_SIZE = 10;

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return "—";
  return `${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${currency ? ` ${currency}` : ""}`;
}

function usePagedRows<T>(rows: T[], pageSize = HISTORY_PAGE_SIZE) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = rows.slice(safePage * pageSize, safePage * pageSize + pageSize);
  return {
    page: safePage,
    setPage,
    totalPages,
    slice,
    total: rows.length,
  };
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
  const [includeArchived, setIncludeArchived] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState<
    "generate" | "regenerate" | "send" | "preview" | null
  >(null);
  const [receiptBusyId, setReceiptBusyId] = useState<number | null>(null);
  const [archiveBusyId, setArchiveBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(companyId)) return;
    setLoading(true);
    try {
      setData(await fetchSubscription(companyId, includeArchived));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load subscription"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, includeArchived]);

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
      const message = getApiErrorMessage(err, "Failed to send invoice");
      toast.error(
        /MAIL_|Authentication failed|not configured/i.test(message)
          ? `${message} Payment recording still works without email.`
          : message,
      );
      void load();
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
      toast.error(
        getApiErrorMessage(
          err,
          inv.paid ? "Failed to preview receipt" : "Failed to preview PDF",
        ),
      );
    } finally {
      setInvoiceBusy(null);
    }
  };

  const handleDownload = async (inv: SubscriptionInvoice) => {
    try {
      const blob = await downloadSubscriptionInvoicePdf(companyId, inv.id);
      const filename = inv.paid
        ? `${inv.receiptNo ?? `receipt-${inv.paymentId ?? inv.id}`}.pdf`
        : `${inv.invoiceNo}.pdf`;
      triggerBlobDownload(blob, filename);
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          inv.paid ? "Failed to download receipt" : "Failed to download PDF",
        ),
      );
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
      if (updated.receiptSent) {
        toast.success(
          `Receipt sent to ${updated.receiptToEmail ?? "billing contacts"}`,
        );
      } else {
        toast.error(
          updated.receiptSendError ??
            "Receipt could not be sent. Check server MAIL_* SMTP settings.",
        );
      }
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send receipt"));
    } finally {
      setReceiptBusyId(null);
    }
  };

  const handleArchivePayment = async (
    payment: SubscriptionPayment,
    archived: boolean,
  ) => {
    setArchiveBusyId(`pay-${payment.id}`);
    try {
      await archiveSubscriptionPayment(companyId, payment.id, archived);
      toast.success(archived ? "Payment archived" : "Payment restored");
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update payment"));
    } finally {
      setArchiveBusyId(null);
    }
  };

  const handleArchiveInvoice = async (
    invoice: SubscriptionInvoice,
    archived: boolean,
  ) => {
    setArchiveBusyId(`inv-${invoice.id}`);
    try {
      await archiveSubscriptionInvoice(companyId, invoice.id, archived);
      toast.success(archived ? "Invoice archived" : "Invoice restored");
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update invoice"));
    } finally {
      setArchiveBusyId(null);
    }
  };

  const handleArchiveReminder = async (
    reminder: SubscriptionReminderLog,
    archived: boolean,
  ) => {
    setArchiveBusyId(`rem-${reminder.id}`);
    try {
      await archiveSubscriptionReminder(companyId, reminder.id, archived);
      toast.success(archived ? "Reminder archived" : "Reminder restored");
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update reminder"));
    } finally {
      setArchiveBusyId(null);
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

  const mailErrorHint =
    data?.payments?.find((p) => p.receiptSendError)?.receiptSendError ??
    data?.invoices?.find((inv) => inv.sendError && !inv.sent)?.sendError ??
    null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        variant="darkBlue"
        title={data?.companyName ?? `Company #${companyId}`}
        description={
          data?.companyCode
            ? `${data.companyCode} · Subscription detail, payments, invoices, and reminders`
            : "Subscription detail, payments, invoices, and reminders"
        }
        backHref="/admin/subscriptions"
        icon={<Building2 className="h-5 w-5 text-white" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
              onClick={() => setTab("invoices")}
              disabled={loading || !data}
            >
              <FileText className="mr-2 h-4 w-4" />
              Invoice workflow
            </Button>
          </div>
        }
      />

      {mailErrorHint ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Email delivery is failing on this server</p>
          <p className="mt-1 text-[13px] text-amber-900/90">{mailErrorHint}</p>
          <p className="mt-1 text-[12px] text-amber-800/80">
            Payments and invoice PDFs still work. Fix SMTP credentials
            (MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM) to send email.
          </p>
        </div>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data ? (
        <p className="text-sm text-destructive">Subscription not found.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {subscriptionStatusBadge(data.status)}
              {currentPeriodInvoice && !currentPeriodInvoice.paid ? (
                <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                  Invoice unpaid
                </Badge>
              ) : (
                paymentStatusBadge(data.paymentStatus)
              )}
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
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <Checkbox
                checked={includeArchived}
                onCheckedChange={(v) => setIncludeArchived(v === true)}
              />
              Show archived
            </label>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList className="h-10 rounded-xl bg-slate-100 p-1">
              <TabsTrigger
                value="overview"
                className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Invoices
              </TabsTrigger>
              <TabsTrigger
                value="reminders"
                className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Reminders
              </TabsTrigger>
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
                archiveBusyId={archiveBusyId}
                onDownloadReceipt={(p) => void handleDownloadReceipt(p)}
                onSendReceipt={(p, resend) => void handleSendReceipt(p, resend)}
                onArchive={(p, archived) => void handleArchivePayment(p, archived)}
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
                invoices={(data.invoices ?? []).filter(
                  (inv) =>
                    !(
                      inv.periodStart === data.startsAt &&
                      (inv.periodEnd ?? null) === (data.endsAt ?? null)
                    ),
                )}
                currentPeriodStart={data.startsAt}
                currentPeriodEnd={data.endsAt}
                emptyMessage="No prior invoices yet. Generate an invoice for the current period to begin."
                onPreview={(inv) => void handlePreview(inv)}
                onDownload={(inv) => void handleDownload(inv)}
                onArchive={(inv, archived) =>
                  void handleArchiveInvoice(inv, archived)
                }
                archiveBusyId={archiveBusyId}
                previewBusy={invoiceBusy === "preview"}
                pageSize={HISTORY_PAGE_SIZE}
              />
            </TabsContent>

            <TabsContent value="reminders">
              <RemindersTable
                reminders={data.reminders ?? []}
                archiveBusyId={archiveBusyId}
                onArchive={(r, archived) =>
                  void handleArchiveReminder(r, archived)
                }
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
                {invoice?.paid ? "Preview receipt" : "Preview PDF"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => invoice && onDownload(invoice)}
                disabled={!invoice}
              >
                <Download className="mr-2 h-4 w-4" />
                {invoice?.paid ? "Download receipt" : "Download"}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TablePager({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <p className="px-3 py-2 text-xs text-muted-foreground">
        {total} record{total === 1 ? "" : "s"}
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
      <p className="text-xs text-muted-foreground">
        {total} record{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-xl"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {page + 1} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-xl"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function SubscriptionPaymentsTable({
  payments,
  currencyCode,
  receiptBusyId,
  archiveBusyId,
  onDownloadReceipt,
  onSendReceipt,
  onArchive,
}: {
  payments: SubscriptionPayment[];
  currencyCode?: string | null;
  receiptBusyId: number | null;
  archiveBusyId: string | null;
  onDownloadReceipt: (payment: SubscriptionPayment) => void;
  onSendReceipt: (payment: SubscriptionPayment, resend?: boolean) => void;
  onArchive: (payment: SubscriptionPayment, archived: boolean) => void;
}) {
  const sorted = [...payments].sort((a, b) => b.paidOn.localeCompare(a.paidOn));
  const { page, setPage, totalPages, slice, total } = usePagedRows(sorted);

  if (payments.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        No payments recorded yet.
      </p>
    );
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-medium uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-3">Paid on</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Invoice</th>
              <th className="px-3 py-3">Period</th>
              <th className="px-3 py-3">Method</th>
              <th className="px-3 py-3">Receipt</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((p) => (
              <tr
                key={p.id}
                className={`border-t border-slate-100 ${p.archived ? "bg-slate-50/70 opacity-80" : ""}`}
              >
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
                      <Badge variant="secondary">
                        {p.receiptNo ?? "Generated"}
                      </Badge>
                      {p.receiptSent ? (
                        <p className="text-xs text-muted-foreground">
                          Sent {p.receiptToEmail ? `to ${p.receiptToEmail}` : ""}
                        </p>
                      ) : p.receiptSendError ? (
                        <p className="max-w-xs text-xs text-destructive">
                          {p.receiptSendError}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not sent</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    {p.receiptGenerated ? (
                      <>
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
                      </>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={archiveBusyId === `pay-${p.id}`}
                      onClick={() => onArchive(p, !p.archived)}
                    >
                      {p.archived ? (
                        <ArchiveRestore className="mr-1 h-4 w-4" />
                      ) : (
                        <Archive className="mr-1 h-4 w-4" />
                      )}
                      {p.archived ? "Restore" : "Archive"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </Card>
  );
}

function RemindersTable({
  reminders,
  archiveBusyId,
  onArchive,
}: {
  reminders: SubscriptionReminderLog[];
  archiveBusyId: string | null;
  onArchive: (reminder: SubscriptionReminderLog, archived: boolean) => void;
}) {
  const sorted = [...reminders].sort((a, b) =>
    b.sentAt.localeCompare(a.sentAt),
  );
  const { page, setPage, totalPages, slice, total } = usePagedRows(sorted);

  if (reminders.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        No reminder emails logged yet.
      </p>
    );
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-medium uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Period</th>
              <th className="px-3 py-3">Sent at</th>
              <th className="px-3 py-3">To</th>
              <th className="px-3 py-3">Result</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-slate-100 ${r.archived ? "bg-slate-50/70 opacity-80" : ""}`}
              >
                <td className="px-3 py-2.5">{r.reminderType}</td>
                <td className="px-3 py-2.5">{r.periodKey}</td>
                <td className="px-3 py-2.5">
                  {new Date(r.sentAt).toLocaleString()}
                </td>
                <td className="px-3 py-2.5">{r.toEmail ?? "—"}</td>
                <td className="px-3 py-2.5">
                  {r.success ? "OK" : r.error ?? "Failed"}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={archiveBusyId === `rem-${r.id}`}
                    onClick={() => onArchive(r, !r.archived)}
                  >
                    {r.archived ? (
                      <ArchiveRestore className="mr-1 h-4 w-4" />
                    ) : (
                      <Archive className="mr-1 h-4 w-4" />
                    )}
                    {r.archived ? "Restore" : "Archive"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </Card>
  );
}
