import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/** Short module blurbs shown on sidebar hover (Hover Card). */
export const SIDEBAR_DESCRIPTIONS: Record<string, string> = {
  Home: "Return to your workspace overview, recent activity, and quick links across modules.",
  "Employee Overview":
    "Browse and manage employee records, profiles, and HR information for your organization.",
  "Employee Payroll":
    "Run payroll cycles, review salary details, and manage employee payment processing.",
  "HR Reports":
    "Generate and review HR reports including headcount, attendance, and immigration expiry.",
  "HR Settings":
    "Configure HR policies, leave types, payroll rules, and related company settings.",
  "Inventory (Stocks)":
    "Track stock levels, manage warehouse quantities, and monitor item availability.",
  Sales:
    "Handle Sales transactions, manage sales invoices and maintain customer information. Perform order fulfillment and track shipments.",
  Purchase:
    "Manage purchase requests and orders, receive goods, and track supplier transactions.",
  "Operations and management Reports":
    "View operations and inventory reports for stock movement, valuations, and performance.",
  "Inventory Settings":
    "Configure inventory categories, warehouses, and related inventory preferences.",
  Dashboard:
    "View finance KPIs, cash position, receivables and payables summaries at a glance.",
  "Accounts Receivable":
    "Manage customer invoices, collections, and outstanding receivables.",
  "Accounts Payable":
    "Track supplier bills, vendor payments, and outstanding payables.",
  "General Ledger":
    "Maintain the chart of accounts, journal entries, and general ledger activity.",
  "Finance Report":
    "Generate financial statements and analytical reports for accounting periods.",
  "Finance Settings":
    "Configure chart of accounts, budgets, reconciliation, and finance preferences.",
  Companies:
    "Manage platform companies, onboarding, and company-level administration.",
  "System Logs":
    "Review system activity logs for auditing and troubleshooting.",
  Company:
    "Edit company profile, modules, and organization-wide settings.",
};

type SidebarNavHoverLinkProps = {
  title: string;
  url: string;
  icon: LucideIcon;
  active: boolean;
  description?: string;
};

export function SidebarNavHoverLink({
  title,
  url,
  icon: Icon,
  active,
  description,
}: SidebarNavHoverLinkProps) {
  const blurb = description ?? SIDEBAR_DESCRIPTIONS[title];

  const linkClassName = cn(
    "flex min-w-0 w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
    active
      ? "bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 text-white shadow-md shadow-violet-500/25"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  );

  const iconWrapClassName = cn(
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors",
    active ? "bg-white/20" : "bg-slate-200 group-hover:bg-slate-300",
  );

  const link = (
    <Link to={url} className={linkClassName}>
      <span className={iconWrapClassName}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 break-words leading-snug">{title}</span>
    </Link>
  );

  if (!blurb) {
    return (
      <SidebarMenuButton asChild className="h-auto min-w-0 p-0">
        {link}
      </SidebarMenuButton>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <SidebarMenuButton asChild className="h-auto min-w-0 p-0">
          {link}
        </SidebarMenuButton>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="center"
        sideOffset={10}
        className="w-72 border-emerald-300 bg-white p-4 shadow-md"
      >
        <p className="mb-1.5 text-sm font-bold text-emerald-600">{title}</p>
        <p className="text-sm leading-relaxed text-slate-700">{blurb}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
