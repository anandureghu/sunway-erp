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
  Truck,
  Users,
  Receipt,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  listSalesOrders,
  listShipmentsAsDispatches,
} from "@/service/salesFlowService";
import { apiClient } from "@/service/apiClient";
import type { Dispatch, Invoice, SalesOrder } from "@/types/sales";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { createCurrencySymbolIcon } from "@/components/currency/currency-symbol-icon";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
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
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
};

const normalizeStatus = (status?: string | null) =>
  (status || "").toString().toLowerCase();

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function SalesLandingPage() {
  const { currencySymbol } = useCompanyCurrency();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [ordersData, invoicesRes, dispatchesData] = await Promise.all([
          listSalesOrders().catch(() => [] as SalesOrder[]),
          apiClient
            .get<Invoice[]>("/invoices", { params: { type: "SALES" } })
            .then((res) => res.data ?? [])
            .catch(() => [] as Invoice[]),
          listShipmentsAsDispatches().catch(() => [] as Dispatch[]),
        ]);
        if (cancelled) return;
        setOrders(ordersData);
        setInvoices(invoicesRes);
        setDispatches(dispatchesData);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSales = useMemo(
    () =>
      invoices
        .filter((inv) => !inv.archived)
        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0),
    [invoices],
  );

  const pendingOrders = useMemo(
    () =>
      orders.filter((o) => {
        const status = normalizeStatus(o.status);
        return status === "draft" || status === "confirmed";
      }).length,
    [orders],
  );

  const dispatchesToday = useMemo(() => {
    const today = new Date();
    return dispatches.filter((d) => {
      const created = d.createdAt ? new Date(d.createdAt) : null;
      return (
        created && !Number.isNaN(created.getTime()) && isSameDay(created, today)
      );
    }).length;
  }, [dispatches]);

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

  const grossSalesIcon = createCurrencySymbolIcon(currencySymbol);

  const quickActions: ActionCard[] = [
    {
      title: "Manage Sales Orders",
      description: "Review order pipeline, statuses, and next actions.",
      to: "/inventory/sales/orders",
      cta: "Open Orders",
      icon: ShoppingCart,
      tone: "text-blue-600 bg-blue-100",
    },
    {
      title: "Sales Invoices",
      description: "Track invoices, payments, and outstanding balances.",
      to: "/inventory/sales/invoices",
      cta: "View Invoices",
      icon: Receipt,
      tone: "text-purple-600 bg-purple-100",
    },
    {
      title: "Customer Management",
      description: "Maintain customers, contacts, and account details.",
      to: "/inventory/sales/customers",
      cta: "Manage Customers",
      icon: Users,
      tone: "text-amber-600 bg-amber-100",
    },
    {
      title: "Picklist & Dispatch",
      description: "Move confirmed orders to fulfillment and shipment.",
      to: "/inventory/sales/picklist",
      cta: "Open Fulfillment",
      icon: Package,
      tone: "text-orange-600 bg-orange-100",
    },
    {
      title: "Delivery Tracking",
      description: "Monitor shipment movement and delivery milestones.",
      to: "/inventory/sales/tracking",
      cta: "Track Deliveries",
      icon: Truck,
      tone: "text-cyan-600 bg-cyan-100",
    },
  ];

  const salesHubKpis: KpiSummaryStat[] = [
    {
      label: "Gross sales",
      value: <CurrencyAmount amount={totalSales} />,
      hint: "Invoice total",
      accent: "emerald",
      icon: grossSalesIcon,
    },
    {
      label: "Pending orders",
      value: pendingOrders,
      hint: "Draft + confirmed",
      accent: "orange",
      icon: Clock,
    },
    {
      label: "Dispatches today",
      value: dispatchesToday,
      hint: "Created today",
      accent: "sky",
      icon: Truck,
    },
    {
      label: "Unpaid invoices",
      value: unpaidInvoices,
      hint: "Unpaid + overdue",
      accent: "violet",
      icon: FileText,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Modern Sales Operations"
        description="Create, Manage and Track Sales Orders"
        variant="darkBlue"
        icon={<ShoppingCart className="w-6 h-6" />}
        actions={
          <>
            <Button
              asChild
              size="lg"
              className="bg-white text-slate-900 hover:bg-white/90"
            >
              <Link to="/inventory/sales/orders/new">Create Order</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              <Link to="/inventory/sales/orders">Manage Orders</Link>
            </Button>
          </>
        }
      />

      {!loading ? <KpiSummaryStrip items={salesHubKpis} /> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.title}
              className="group hover:shadow-md transition-all border-muted/70"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {action.description}
                    </CardDescription>
                  </div>
                  <div className={`rounded-xl p-2 ${action.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link
                    to={action.to}
                    className="flex items-center justify-center gap-2"
                  >
                    {action.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
