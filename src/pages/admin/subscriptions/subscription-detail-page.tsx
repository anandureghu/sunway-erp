import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  cancelSubscription,
  downloadSubscriptionInvoicePdf,
  extendSubscription,
  fetchSubscription,
  sendSubscriptionInvoice,
  triggerBlobDownload,
} from "@/service/subscriptionService";
import type {
  CompanySubscription,
  SubscriptionInvoice,
} from "@/types/subscription";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { AssignSubscriptionDialog } from "./assign-subscription-dialog";
import { RecordPaymentDialog } from "./record-payment-dialog";
import {
  paymentStatusBadge,
  subscriptionStatusBadge,
} from "./subscription-badges";
import {
  Ban,
  CalendarPlus,
  CreditCard,
  Download,
  Mail,
  Pencil,
  RefreshCw,
} from "lucide-react";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [sending, setSending] = useState(false);

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

  const handleSendInvoice = async (resend = false) => {
    setSending(true);
    try {
      const inv = await sendSubscriptionInvoice(companyId, resend);
      toast.success(
        inv.sent
          ? `Invoice ${inv.invoiceNo} sent to ${inv.toEmail ?? "billing email"}`
          : `Invoice ${inv.invoiceNo} prepared`,
      );
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send invoice"));
    } finally {
      setSending(false);
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
              size="sm"
              onClick={() =>
                void handleSendInvoice(Boolean(currentPeriodInvoice?.sent))
              }
              disabled={sending || loading || !data}
            >
              <Mail className="mr-2 h-4 w-4" />
              {currentPeriodInvoice?.sent ? "Resend invoice" : "Send invoice"}
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
              <HistoryTable
                empty="No payments recorded yet."
                headers={["Paid on", "Amount", "Period", "Method"]}
                rows={(data.payments ?? []).map((p) => [
                  p.paidOn,
                  formatMoney(p.amount, data.currencyCode),
                  `${p.periodStart ?? "—"} → ${p.periodEnd ?? "—"}`,
                  p.methodNote ?? "—",
                ])}
              />
            </TabsContent>

            <TabsContent value="invoices" className="space-y-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    void handleSendInvoice(Boolean(currentPeriodInvoice?.sent))
                  }
                  disabled={sending}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {currentPeriodInvoice?.sent
                    ? "Resend invoice"
                    : "Send invoice"}
                </Button>
              </div>
              {(data.invoices ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No invoices yet. Send an invoice to create the first one.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5">Invoice</th>
                        <th className="px-3 py-2.5">Period</th>
                        <th className="px-3 py-2.5">Amount</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.invoices ?? []).map((inv) => (
                        <tr key={inv.id} className="border-t">
                          <td className="px-3 py-2.5 font-medium">
                            {inv.invoiceNo}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {inv.periodStart} → {inv.periodEnd ?? "open"}
                          </td>
                          <td className="px-3 py-2.5">
                            {formatMoney(inv.amount, inv.currencyCode)}
                          </td>
                          <td className="px-3 py-2.5">
                            {inv.sent ? (
                              <div className="space-y-0.5">
                                <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">
                                  Sent
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {inv.toEmail}
                                  {inv.sentAt
                                    ? ` · ${new Date(inv.sentAt).toLocaleString()}`
                                    : ""}
                                </p>
                              </div>
                            ) : (
                              <Badge variant="outline">Not sent</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleDownload(inv)}
                            >
                              <Download className="mr-1 h-4 w-4" />
                              PDF
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
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
