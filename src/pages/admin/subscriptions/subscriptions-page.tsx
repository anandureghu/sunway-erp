import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cancelSubscription,
  extendSubscription,
  fetchSubscription,
  fetchSubscriptionAnalytics,
  fetchSubscriptions,
} from "@/service/subscriptionService";
import type {
  CompanySubscription,
  SubscriptionAnalytics,
  SubscriptionPaymentStatus,
  SubscriptionPlanType,
  SubscriptionStatus,
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
  CreditCard,
  CalendarPlus,
  Pencil,
  Ban,
  RefreshCw,
  MoreHorizontal,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return "—";
  return `${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${currency ? ` ${currency}` : ""}`;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [tab, setTab] = useState("listing");
  const [rows, setRows] = useState<CompanySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus | "">("");
  const [planType, setPlanType] = useState<SubscriptionPlanType | "">("");
  const [paymentStatus, setPaymentStatus] = useState<
    SubscriptionPaymentStatus | ""
  >("");
  const [expiringWithin, setExpiringWithin] = useState<string>("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selected, setSelected] = useState<CompanySubscription | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSubscriptions({
        status,
        planType,
        paymentStatus,
        expiringWithinDays: expiringWithin ? Number(expiringWithin) : undefined,
        page,
        size: 20,
      });
      setRows(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load subscriptions"));
    } finally {
      setLoading(false);
    }
  }, [status, planType, paymentStatus, expiringWithin, page]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      setAnalytics(await fetchSubscriptionAnalytics());
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load analytics"));
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    void loadList();
  }, [isSuperAdmin, loadList]);

  useEffect(() => {
    if (!isSuperAdmin || tab !== "analysis") return;
    void loadAnalytics();
  }, [isSuperAdmin, tab, loadAnalytics]);

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const openAssign = async (row: CompanySubscription) => {
    try {
      const detail = await fetchSubscription(row.companyId);
      setSelected(detail);
    } catch {
      setSelected(row);
    }
    setAssignOpen(true);
  };

  const openPayment = (row: CompanySubscription) => {
    setSelected(row);
    setPaymentOpen(true);
  };

  const handleExtend = async (row: CompanySubscription) => {
    const base = row.endsAt ? new Date(row.endsAt + "T00:00:00") : new Date();
    if (row.planType === "YEARLY") base.setFullYear(base.getFullYear() + 1);
    else base.setMonth(base.getMonth() + 1);
    const newEndsAt = base.toISOString().slice(0, 10);
    if (
      !(await confirm(
        `Extend "${row.companyName}" subscription to ${newEndsAt}?`,
      ))
    ) {
      return;
    }
    try {
      await extendSubscription(row.companyId, { newEndsAt });
      toast.success("Subscription extended");
      void loadList();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to extend"));
    }
  };

  const handleCancel = async (row: CompanySubscription) => {
    if (
      !(await confirm(
        `Cancel subscription for "${row.companyName}"? Users will be hard-locked.`,
      ))
    ) {
      return;
    }
    try {
      await cancelSubscription(row.companyId, { status: "CANCELLED" });
      toast.success("Subscription cancelled");
      void loadList();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to cancel"));
    }
  };

  const handleSendInvoice = async (row: CompanySubscription) => {
    navigate(`/admin/subscriptions/${row.companyId}?tab=invoices`);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title="Subscriptions"
        description="Platform billing: plans, renewals, and subscription health"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="listing">Listing</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="listing" className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Select
                value={status || "all"}
                onValueChange={(v) => {
                  setPage(0);
                  setStatus(v === "all" ? "" : (v as SubscriptionStatus));
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRING">Expiring</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Plan</p>
              <Select
                value={planType || "all"}
                onValueChange={(v) => {
                  setPage(0);
                  setPlanType(v === "all" ? "" : (v as SubscriptionPlanType));
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Payment</p>
              <Select
                value={paymentStatus || "all"}
                onValueChange={(v) => {
                  setPage(0);
                  setPaymentStatus(
                    v === "all" ? "" : (v as SubscriptionPaymentStatus),
                  );
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="NOT_REQUIRED">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Expiring within days</p>
              <Input
                className="w-[120px]"
                type="number"
                min={1}
                placeholder="e.g. 7"
                value={expiringWithin}
                onChange={(e) => {
                  setPage(0);
                  setExpiringWithin(e.target.value);
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadList()}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">Company</th>
                  <th className="px-3 py-2.5">Plan</th>
                  <th className="px-3 py-2.5">Amount</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Period</th>
                  <th className="px-3 py-2.5">Days left</th>
                  <th className="px-3 py-2.5">Payment</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/30"
                      onClick={() =>
                        navigate(`/admin/subscriptions/${row.companyId}`)
                      }
                    >
                      <td className="px-3 py-2.5 font-medium">
                        <Link
                          to={`/admin/subscriptions/${row.companyId}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.companyName ?? `#${row.companyId}`}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">{row.planType}</td>
                      <td className="px-3 py-2.5">
                        {formatMoney(row.amount, row.currencyCode)}
                      </td>
                      <td className="px-3 py-2.5">
                        {subscriptionStatusBadge(row.status)}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {row.startsAt}
                        {" → "}
                        {row.endsAt ?? "open"}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.daysRemaining == null ? "—" : row.daysRemaining}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1">
                          {paymentStatusBadge(row.paymentStatus)}
                          {row.lastPaymentOn ? (
                            <span className="text-xs text-muted-foreground">
                              {row.lastPaymentOn} (
                              {formatMoney(row.lastPaymentAmount)})
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div data-no-row-nav onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/admin/subscriptions/${row.companyId}`,
                                  )
                                }
                              >
                                View detail
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => void openAssign(row)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit plan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPayment(row)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Record payment
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => void handleSendInvoice(row)}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Invoice workflow
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => void handleExtend(row)}
                              >
                                <CalendarPlus className="mr-2 h-4 w-4" />
                                Extend
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => void handleCancel(row)}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel subscription
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analyticsLoading || !analytics ? (
            <p className="text-sm text-muted-foreground">Loading analytics…</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard label="Total companies" value={String(analytics.totalCompanies)} />
                <KpiCard
                  label="Est. monthly recurring"
                  value={formatMoney(analytics.estimatedMonthlyRecurring)}
                />
                <KpiCard
                  label="Revenue (period)"
                  value={formatMoney(analytics.revenueCollectedInRange)}
                />
                <KpiCard
                  label="Expiring in 7 days"
                  value={String(analytics.expiringIn7Days)}
                />
                <KpiCard
                  label="Expiring in 30 days"
                  value={String(analytics.expiringIn30Days)}
                />
                <KpiCard label="New in period" value={String(analytics.newInPeriod)} />
                <KpiCard
                  label="Expired in period"
                  value={String(analytics.expiredInPeriod)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <BreakdownCard title="By status" data={analytics.countByStatus} />
                <BreakdownCard title="By plan" data={analytics.countByPlanType} />
              </div>

              <div className="rounded-lg border bg-background p-4">
                <h3 className="mb-3 text-sm font-semibold">Payments by month</h3>
                {analytics.paymentsByMonth?.length ? (
                  <ul className="space-y-1.5 text-sm">
                    {analytics.paymentsByMonth.map((p) => (
                      <li
                        key={p.month}
                        className="flex justify-between border-b border-dashed py-1 last:border-0"
                      >
                        <span className="text-muted-foreground">{p.month}</span>
                        <span className="font-medium">{formatMoney(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No payments in range</p>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {selected && (
        <>
          <AssignSubscriptionDialog
            open={assignOpen}
            onOpenChange={setAssignOpen}
            companyId={selected.companyId}
            companyName={selected.companyName ?? undefined}
            initial={selected}
            onSaved={() => void loadList()}
          />
          <RecordPaymentDialog
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            companyId={selected.companyId}
            companyName={selected.companyName ?? undefined}
            suggestedAmount={selected.amount}
            onSaved={() => void loadList()}
          />
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function BreakdownCard({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-1.5 text-sm">
        {Object.entries(data ?? {}).map(([key, count]) => (
          <li key={key} className="flex justify-between">
            <span className="text-muted-foreground">{key}</span>
            <span className="font-medium">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
