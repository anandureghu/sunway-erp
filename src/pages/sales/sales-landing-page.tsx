import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  ShoppingCart,
  FileText,
  Package,
  Truck,
  Users,
  Receipt,
  Clock,
  ArrowRight,
  CircleDollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import { salesOrders, invoices, dispatches } from "@/lib/sales-data";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { SalesPageHeader } from "./components/sales-page-header";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";

type ActionCard = {
  title: string;
  description: string;
  to: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
};

export default function SalesLandingPage() {
  const totalSales = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const pendingOrders = salesOrders.filter(
    (o) => o.status === "draft" || o.status === "confirmed",
  ).length;
  const dispatchesToday = dispatches.filter((d) => {
    const today = new Date().toDateString();
    const dispatchDate = new Date(d.createdAt).toDateString();
    return dispatchDate === today;
  }).length;
  const unpaidInvoices = invoices.filter(
    (inv) => inv.status === "Unpaid" || inv.status === "Overdue",
  ).length;

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
      title: "Create New Sales Order",
      description: "Start a new order with customer, items, and pricing.",
      to: "/inventory/sales/orders/new",
      cta: "Create Order",
      icon: ShoppingBag,
      tone: "text-emerald-600 bg-emerald-100",
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
      icon: CircleDollarSign,
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
      <SalesPageHeader
        title="Modern Sales Operations"
        description="Create, Manage and Track Sales Orders"
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

      <KpiSummaryStrip items={salesHubKpis} />

      {/* <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Quick Search</CardTitle>
          <CardDescription>
            Search by order number, customer name, or code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, customers, invoices..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
            />
          </div>
        </CardContent>
      </Card> */}

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
