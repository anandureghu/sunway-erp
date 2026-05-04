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
  ClipboardCheck,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  purchaseOrders,
  purchaseInvoices,
  goodsReceipts,
} from "@/lib/purchase-data";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { createCurrencySymbolIcon } from "@/components/currency/currency-symbol-icon";
import { PurchasePageHeader } from "./components/purchase-page-header";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { useCompanyCurrency } from "@/hooks/use-company-currency";

type ActionCard = {
  title: string;
  description: string;
  to: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }> | string;
  tone: string;
};

export default function PurchaseLandingPage() {
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
  const totalPurchasesIcon = createCurrencySymbolIcon(currencySymbol);

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
      title: "Create New requisition",
      description: "Create a requisition; approval generates a draft PO.",
      to: "/inventory/purchase/requisitions/new",
      cta: "Create requisition",
      icon: ClipboardCheck,
      tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50",
    },
    {
      title: "Manage Purchase Orders",
      description: "Track POs, statuses, and supplier commitments.",
      to: "/inventory/purchase/orders",
      cta: "Open orders",
      icon: ShoppingCart,
      tone: "text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/50",
    },
    {
      title: "Receive and Inspect",
      description: "Record receipts and quality checks.",
      to: "/inventory/purchase/receiving",
      cta: "Receiving",
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
      label: "Total purchases",
      value: <CurrencyAmount amount={totalPurchases} />,
      hint: "From sample invoice data",
      accent: "emerald",
      icon: totalPurchasesIcon,
    },
    {
      label: "Pending orders",
      value: pendingOrders,
      hint: "Draft, pending, approved",
      accent: "orange",
      icon: Clock,
    },
    {
      label: "Receipts today",
      value: receiptsToday,
      hint: "Goods receipts",
      accent: "sky",
      icon: Package,
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
      <PurchasePageHeader
        title="Purchase & supplier"
        description="Requisition, Orders, Payables, Receipts - Procurement workflow"
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

      <KpiSummaryStrip items={purchaseHubKpis} />

      {/* Search */}

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
