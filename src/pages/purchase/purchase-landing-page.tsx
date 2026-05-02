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
  ShoppingCart,
  FileText,
  Package,
  Users,
  Receipt,
  Search,
  Clock,
  X,
  ClipboardCheck,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  purchaseOrders,
  purchaseInvoices,
  goodsReceipts,
  suppliers,
} from "@/lib/purchase-data";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import { CurrencyAmount } from "@/components/currency/currency-amount";

type ActionCard = {
  title: string;
  description: string;
  to: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }> | string;
  tone: string;
};

export default function PurchaseLandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { currencySymbol } = useCompanyCurrency();

  const totalPurchases = purchaseInvoices.reduce(
    (sum, inv) => sum + inv.total,
    0,
  );
  const pendingOrders = purchaseOrders.filter(
    (o) =>
      o.status === "draft" || o.status === "pending" || o.status === "approved",
  ).length;
  const receiptsToday = goodsReceipts.filter((gr) => {
    const today = new Date().toDateString();
    const receiptDate = new Date(gr.receiptDate).toDateString();
    return receiptDate === today;
  }).length;
  const unpaidInvoices = purchaseInvoices.filter(
    (inv) => inv.status === "pending" || inv.status === "overdue",
  ).length;

  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    const lowerQuery = query.toLowerCase();

    const foundOrder = purchaseOrders.find(
      (o) =>
        o.orderNo.toLowerCase().includes(lowerQuery) ||
        o.supplier?.name.toLowerCase().includes(lowerQuery),
    );

    const foundSupplier = suppliers.find(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.code.toLowerCase().includes(lowerQuery) ||
        s.contactPerson?.toLowerCase().includes(lowerQuery),
    );

    const foundInvoice = purchaseInvoices.find(
      (inv) =>
        inv.invoiceNo.toLowerCase().includes(lowerQuery) ||
        inv.supplierName.toLowerCase().includes(lowerQuery),
    );

    if (foundOrder) {
      navigate("/inventory/purchase/orders", { state: { searchQuery: query } });
      return;
    }
    if (foundSupplier) {
      navigate("/inventory/purchase/suppliers", {
        state: { searchQuery: query },
      });
      return;
    }
    if (foundInvoice) {
      navigate("/inventory/purchase/invoices", {
        state: { searchQuery: query },
      });
      return;
    }

    toast.info("No matches", {
      description: `Try an order number, supplier name, or invoice number.`,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const quickActions: ActionCard[] = [
    {
      title: "Manage Purchase Orders",
      description: "Track POs, statuses, and supplier commitments.",
      to: "/inventory/purchase/orders",
      cta: "Open orders",
      icon: ShoppingCart,
      tone: "text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/50",
    },
    {
      title: "New purchase requisition",
      description: "Create a requisition; approval generates a draft PO.",
      to: "/inventory/purchase/requisitions/new",
      cta: "Create requisition",
      icon: ClipboardCheck,
      tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50",
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
    {
      title: "Receiving & inspection",
      description: "Record receipts and quality checks.",
      to: "/inventory/purchase/receiving",
      cta: "Receiving",
      icon: Package,
      tone: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50",
    },
    {
      title: "Purchase requisitions",
      description: "List, submit, and approve requisitions.",
      to: "/inventory/purchase/requisitions",
      cta: "All requisitions",
      icon: ClipboardList,
      tone: "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/50",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero */}
      <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
        <CardContent className="p-6 sm:p-8 relative">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 45%)",
            }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 max-w-2xl">
              <Badge className="bg-white/15 text-white border-0 hover:bg-white/15">
                Inventory · Purchase hub
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Purchase & supplier
              </h1>
              <p className="text-white/75 text-sm sm:text-base leading-relaxed">
                Requisitions, orders, receipts, and payables in one place—
                aligned with your procurement workflow.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-white text-slate-900 hover:bg-white/90 shadow-md"
              >
                <Link to="/inventory/purchase/requisitions/new">
                  Create requisition
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white/10 text-white border border-white/20 hover:bg-white/15"
              >
                <Link to="/inventory/purchase/orders">Purchase orders</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total purchases"
          value={<CurrencyAmount amount={totalPurchases} />}
          icon={currencySymbol || ""}
          hint="From sample invoice data"
        />
        <MetricCard
          label="Pending orders"
          value={String(pendingOrders)}
          icon={Clock}
          hint="Draft, pending, approved"
        />
        <MetricCard
          label="Receipts today"
          value={String(receiptsToday)}
          icon={Package}
          hint="Goods receipts"
        />
        <MetricCard
          label="Unpaid invoices"
          value={String(unpaidInvoices)}
          icon={FileText}
          hint="Pending or overdue"
        />
      </div>

      {/* Search */}
      <Card className="shadow-sm border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick search</CardTitle>
          <CardDescription>
            Jump to orders, suppliers, or invoices by number or name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex gap-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search orders, suppliers, invoices…"
                className="pl-10 pr-10 h-11 bg-muted/30 border-muted-foreground/15 focus-visible:ring-emerald-500/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-md p-1"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Workspaces
        </h2>
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
                <CardContent className="pt-0">
                  <Button
                    asChild
                    variant="secondary"
                    className="w-full group/btn border border-border/60 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
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

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ComponentType<{ className?: string }> | string;
}) {
  return (
    <Card className="shadow-sm border-border/80 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums truncate">
              {value as string}
            </p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <div className="rounded-xl bg-muted/80 p-2.5 ring-1 ring-border/50 w-10 h-10 flex items-center justify-center">
            {typeof Icon === "string" ? (
              Icon
            ) : (
              <Icon className="h-5 w-5 text-foreground/80" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
