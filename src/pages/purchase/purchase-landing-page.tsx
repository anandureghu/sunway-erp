import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  FileText,
  Package,
  Users,
  Receipt,
  Clock,
  ArrowRight,
  ClipboardList,
  ScanSearch,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  listGoodsReceipts,
  listPurchaseOrders,
} from "@/service/purchaseFlowService";
import { listPurchaseInvoices } from "@/service/invoiceService";
import type { PurchaseOrder, GoodsReceipt } from "@/types/purchase";
import type { FinanceInvoice } from "@/types/finance-invoice";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { PageHeader } from "@/components/PageHeader";

type ActionCard = {
  title: string;
  description: string;
  to: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }> | string;
  tone: string;
};

const normalizeStatus = (status?: string | null) =>
  (status || "").toString().toLowerCase();

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function PurchaseLandingPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [allReceipts, setAllReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [ordersData, invoicesData, receiptsData] = await Promise.all([
          listPurchaseOrders().catch(() => [] as PurchaseOrder[]),
          listPurchaseInvoices().catch(() => [] as FinanceInvoice[]),
          listGoodsReceipts().catch(() => [] as GoodsReceipt[]),
        ]);
        if (cancelled) return;
        setOrders(ordersData);
        setInvoices(invoicesData);
        setAllReceipts(receiptsData);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingOrders = useMemo(
    () =>
      orders.filter((o) => {
        const status = normalizeStatus(o.status);
        return status === "quotation" || status === "pending" || status === "approved";
      }).length,
    [orders],
  );

  const receiptsToday = useMemo(() => {
    const today = new Date();
    return allReceipts.filter((r) => {
      const d = r.receiptDate ? new Date(r.receiptDate) : null;
      return d && !Number.isNaN(d.getTime()) && isSameDay(d, today);
    }).length;
  }, [allReceipts]);

  const pendingInspection = useMemo(
    () =>
      allReceipts.filter(
        (r) => normalizeStatus(r.status) === "pending_inspection",
      ).length,
    [allReceipts],
  );

  const unpaidInvoices = useMemo(
    () =>
      invoices.filter((inv) => {
        if (inv.archived) return false;
        const status = normalizeStatus(inv.status);
        return (
          status === "unpaid" ||
          status === "pending" ||
          status === "overdue" ||
          status === "partially_paid"
        );
      }).length,
    [invoices],
  );

  const quickActions: ActionCard[] = [
    {
      title: "Manage Requisitions",
      description: "List, submit, and approve requisitions.",
      to: "/inventory/purchase/requisitions",
      cta: "All requisitions",
      icon: ClipboardList,
      tone: "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/50",
    },

    {
      title: "Manage Purchase Orders",
      description: "Track Purchase Orders, statuses, and supplier commitments.",
      to: "/inventory/purchase/orders",
      cta: "Open orders",
      icon: ShoppingCart,
      tone: "text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/50",
    },
    {
      title: "Goods receipt / Inspect",
      description: "Log arrivals and confirm inspection before receiving into stock.",
      to: "/inventory/purchase/inspection",
      cta: "Inspect",
      icon: Package,
      tone: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50",
    },

    {
      title: "Purchase invoices",
      description: "Review invoices, matching, and payment status.",
      to: "/inventory/purchase/invoices",
      cta: "View invoices",
      icon: Receipt,
      tone: "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/50",
    },
    {
      title: "Suppliers",
      description: "Maintain vendor master data and contacts.",
      to: "/inventory/purchase/suppliers",
      cta: "Manage suppliers",
      icon: Users,
      tone: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50",
    },
  ];

  const purchaseHubKpis: KpiSummaryStat[] = [
    {
      label: "Pending orders",
      value: pendingOrders,
      hint: "Quotation, pending, approved",
      accent: "orange",
      icon: Clock,
    },
    {
      label: "Receipts today",
      value: receiptsToday,
      hint: "Goods received today",
      accent: "sky",
      icon: Package,
    },
    {
      label: "Awaiting inspection",
      value: pendingInspection,
      hint: "Goods receipts awaiting inspect",
      accent: "amber",
      icon: ScanSearch,
    },
    {
      label: "Unpaid invoices",
      value: unpaidInvoices,
      hint: "Pending or overdue",
      accent: "violet",
      icon: FileText,
    },
  ];

  return (
    <div className="mx-auto w-full space-y-6 p-4 sm:p-6 py-2">
      <PageHeader
        title="Purchase & Suppliers"
        description="Requisition, Orders, Payables, Receipts - Procurement workflow"
        icon={<ShoppingCart className="w-6 h-6" />}
        variant="darkGreen"
        actions={
          <>
            <Button
              asChild
              size="lg"
              className="bg-white text-slate-900 shadow-md hover:bg-white/90"
            >
              <Link to="/inventory/purchase/requisitions/new">
                Create requisition
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              <Link to="/inventory/purchase/orders">Purchase orders</Link>
            </Button>
          </>
        }
      />

      {!loading ? <KpiSummaryStrip items={purchaseHubKpis} /> : null}

      {/* Actions */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.to}
                className="group border-border/70 hover:border-emerald-500/25 hover:shadow-md transition-all duration-200 bg-card/50"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base leading-snug">
                        {action.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {action.description}
                      </CardDescription>
                    </div>
                    <div
                      className={`rounded-xl p-2.5 shrink-0 transition-transform group-hover:scale-105 ${action.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex items-end h-full">
                  <Button
                    asChild
                    variant="secondary"
                    className="w-full group/btn border border-border/60 bg-emerald-600 hover:bg-emerald-600/90 hover:border-emerald-600 text-white"
                  >
                    <Link
                      to={action.to}
                      className="flex items-center justify-center gap-2"
                    >
                      {action.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
