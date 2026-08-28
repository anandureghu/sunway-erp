import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  downloadMySubscriptionInvoicePdf,
  fetchMySubscription,
  triggerBlobDownload,
} from "@/service/subscriptionService";
import type {
  CompanySubscription,
  SubscriptionInvoice,
} from "@/types/subscription";
import {
  paymentStatusBadge,
  subscriptionStatusBadge,
} from "./subscription-badges";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { Download, RefreshCw } from "lucide-react";

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return "—";
  return `${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${currency ? ` ${currency}` : ""}`;
}

export default function CompanyBillingPage() {
  const { user } = useAuth();
  const role = (user?.role ?? "").toUpperCase();
  const canView = role === "ADMIN" || role === "SUPER_ADMIN";

  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchMySubscription());
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load billing"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) return;
    void load();
  }, [canView, load]);

  if (!canView) {
    return <Navigate to="/" replace />;
  }

  const handleDownload = async (inv: SubscriptionInvoice) => {
    try {
      const blob = await downloadMySubscriptionInvoicePdf(inv.id);
      triggerBlobDownload(blob, `${inv.invoiceNo}.pdf`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to download PDF"));
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title="Billing"
        description="Your company subscription and invoice history"
        actions={
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
        }
      />

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">
          No subscription found for this company.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {subscriptionStatusBadge(data.status)}
            {paymentStatusBadge(data.paymentStatus)}
            <Badge variant="secondary">{data.planType}</Badge>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="mt-1 font-semibold">
                  {formatMoney(data.amount, data.currencyCode)}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Period</p>
                <p className="mt-1 font-semibold">
                  {data.startsAt} → {data.endsAt ?? "open"}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Days left</p>
                <p className="mt-1 font-semibold">
                  {data.daysRemaining == null ? "—" : data.daysRemaining}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Payment</p>
                <div className="mt-1">{paymentStatusBadge(data.paymentStatus)}</div>
              </div>
            </TabsContent>

            <TabsContent value="invoices">
              {(data.invoices ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No invoices yet.
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
                              <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">
                                Sent
                              </Badge>
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
          </Tabs>
        </>
      )}
    </div>
  );
}
