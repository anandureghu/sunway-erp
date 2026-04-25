import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  ShoppingCart,
  FileText,
  Package,
  Truck,
  Users,
  Receipt,
  Search,
  Clock,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { salesOrders, invoices, dispatches, customers } from "@/lib/sales-data";
import { formatMoney } from "@/lib/utils";

type ActionCard = {
  title: string;
  description: string;
  to: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
};

export default function SalesLandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    const lowerQuery = query.toLowerCase();
    const foundOrder = salesOrders.find(
      (o) =>
        o.orderNo.toLowerCase().includes(lowerQuery) ||
        o.customerName.toLowerCase().includes(lowerQuery),
    );
    const foundCustomer = customers.find(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.code.toLowerCase().includes(lowerQuery) ||
        c.contactPerson?.toLowerCase().includes(lowerQuery),
    );

    if (foundOrder) {
      navigate("/inventory/sales/orders", { state: { searchQuery: query } });
      return;
    }
    if (foundCustomer) {
      navigate("/inventory/sales/customers", { state: { searchQuery: query } });
      return;
    }
    alert(`No results found for "${query}".`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card className="border-0 shadow-md bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge className="mb-3 bg-white/20 text-white hover:bg-white/20">
                Inventory Sales Hub
              </Badge>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
                Modern Sales Operations
              </h1>
              <p className="mt-2 text-white/80 max-w-2xl">
                Create orders, manage pipeline, and monitor fulfillment from one
                workspace.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90">
                <Link to="/inventory/sales/orders/new">Create Order</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="bg-white/10 text-white border-white/20">
                <Link to="/inventory/sales/orders">Manage Orders</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Gross Sales"
          value={formatMoney(totalSales)}
          icon={DollarSign}
          hint="Invoice total"
        />
        <MetricCard
          label="Pending Orders"
          value={String(pendingOrders)}
          icon={Clock}
          hint="Draft + confirmed"
        />
        <MetricCard
          label="Dispatches Today"
          value={String(dispatchesToday)}
          icon={Truck}
          hint="Created today"
        />
        <MetricCard
          label="Unpaid Invoices"
          value={String(unpaidInvoices)}
          icon={FileText}
          hint="Unpaid + overdue"
        />
      </div>

      <Card className="shadow-sm">
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
      </Card>

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
                  <Link to={action.to} className="flex items-center justify-center gap-2">
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

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          </div>
          <div className="rounded-xl bg-muted p-2.5">
            <Icon className="h-5 w-5 text-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
