import { useAuth } from "@/context/AuthContext";
import { getSidebarItems } from "@/service/companyService";
import type { SidebarItem } from "@/types/company";
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import {
  BarChart3,
  ClipboardList,
  LineChart,
  Users,
  FileText,
  Settings,
  ShoppingCart,
  Wallet,
  DollarSign,
  Loader2,
  ShieldAlert,
  LayoutGrid,
  Activity,
  BookOpen,
  Clock,
  ArrowRight,
  Package,
  Sparkles,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listKnowledgeBaseItems } from "@/service/knowledgeBaseService";
import { readRecentPages, type RecentPage } from "@/lib/recent-pages";
import type { LucideIcon } from "lucide-react";

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function sectionAccent(section: string): {
  chip: string;
  icon: string;
  bar: string;
} {
  const t = section.toLowerCase();
  if (t.includes("hr")) {
    return {
      chip: "bg-sky-50 text-sky-800 ring-sky-100",
      icon: "bg-sky-100 text-sky-700",
      bar: "from-sky-500 to-blue-600",
    };
  }
  if (t.includes("inventory") || t.includes("supply")) {
    return {
      chip: "bg-emerald-50 text-emerald-800 ring-emerald-100",
      icon: "bg-emerald-100 text-emerald-700",
      bar: "from-emerald-500 to-teal-600",
    };
  }
  if (t.includes("finance")) {
    return {
      chip: "bg-amber-50 text-amber-900 ring-amber-100",
      icon: "bg-amber-100 text-amber-800",
      bar: "from-amber-500 to-orange-600",
    };
  }
  if (t.includes("knowledge")) {
    return {
      chip: "bg-cyan-50 text-cyan-900 ring-cyan-100",
      icon: "bg-cyan-100 text-cyan-700",
      bar: "from-cyan-500 to-teal-600",
    };
  }
  return {
    chip: "bg-slate-50 text-slate-700 ring-slate-100",
    icon: "bg-slate-100 text-slate-600",
    bar: "from-slate-500 to-slate-700",
  };
}

const getModuleIcon = (title: string, defaultIcon: LucideIcon): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    "Employee Overview": Users,
    "HR Reports": FileText,
    "Immigration Expiry": ShieldAlert,
    "HR Settings": Settings,
    "Operations Reports": ClipboardList,
    "Management Reports": LineChart,
    "Operations and management Reports": FileText,
    "Inventory Reports": FileText,
    "Inventory Report": FileText,
    "Inventory (Stocks)": BarChart3,
    Sales: DollarSign,
    Purchase: ShoppingCart,
    "Procurement Inventory": ShoppingCart,
    CRM: Users,
    "Manage uploads": Settings,
    Library: FileText,
    "Inventory Settings": Settings,
    "Finance Reports": BarChart3,
    "Finance Report": BarChart3,
    "Accounts Receivable": FileText,
    "Accounts Payable": Wallet,
    "General Ledger": FileText,
    "Employee Payroll": Wallet,
    "Finance Settings": Settings,
  };
  return iconMap[title] || defaultIcon;
};

const getModuleDescription = (title: string): string => {
  const descriptions: Record<string, string> = {
    Dashboard: "Open the module dashboard",
    "Employee Overview":
      "Manage employee lifecycle from hiring to retirement",
    "Employee Payroll":
      "Process compensation, generate payroll runs, and manage deductions",
    "HR Reports":
      "Operations and management reports for workforce insights",
    "Immigration Expiry":
      "Passports and residence permits that are expired or expiring soon",
    "HR Settings":
      "Configure leave types, HR policies, job codes, roles, appraisals, and permissions",
    "Inventory (Stocks)":
      "Manage stock levels, adjustments, and goods receipt",
    Sales:
      "Orders, invoices, customers, fulfillment, and shipments",
    Purchase:
      "Requisitions, POs, receipts, invoices, and payments",
    "Procurement Inventory":
      "Requisitions, POs, receipts, invoices, and payments",
    CRM: "Customers and suppliers in one place",
    "Manage uploads": "Upload and remove training materials",
    Library: "Browse training videos and documents",
    "Operations Reports":
      "Movements, batches, low stock, and expiry alerts",
    "Management Reports":
      "Valuation, turnover, and capital concentration",
    "Operations and management Reports": "Operations and management reports",
    "Inventory Reports": "Operations and management reports",
    "Inventory Report": "Operations and management reports",
    "Inventory Settings":
      "Categories, warehouses, partners, and permissions",
    "Accounts Receivable": "Sales invoices and customer payments",
    "Accounts Payable": "Supplier invoices and vendor payments",
    "General Ledger":
      "Chart of accounts, journals, transactions, and budgets",
    "Finance Reports": "Finance performance reports",
    "Finance Report": "Finance performance reports",
    "Finance Settings":
      "Accounting periods, defaults, and permissions",
  };
  return descriptions[title] || "Open this area to continue";
};

const getSystemTheme = (title: string) => {
  if (title.toLowerCase().includes("hr")) {
    return {
      bgColor: "bg-blue-50",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      hoverBorderColor: "hover:border-blue-300",
    };
  }
  if (
    title.toLowerCase().includes("inventory") ||
    title.toLowerCase().includes("supply chain")
  ) {
    return {
      bgColor: "bg-green-50",
      iconBg: "bg-gradient-to-br from-green-500 to-green-600",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      hoverBorderColor: "hover:border-green-300",
    };
  }
  if (title.toLowerCase().includes("finance")) {
    return {
      bgColor: "bg-purple-50",
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
      textColor: "text-purple-700",
      borderColor: "border-purple-200",
      hoverBorderColor: "hover:border-purple-300",
    };
  }
  if (title.toLowerCase().includes("knowledge")) {
    return {
      bgColor: "bg-teal-50",
      iconBg: "bg-gradient-to-br from-teal-500 to-teal-600",
      textColor: "text-teal-700",
      borderColor: "border-teal-200",
      hoverBorderColor: "hover:border-teal-300",
    };
  }
  return {
    bgColor: "bg-gray-50",
    iconBg: "bg-gradient-to-br from-gray-500 to-gray-600",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    hoverBorderColor: "hover:border-gray-300",
  };
};

const getSystemSubtitle = (title: string): string => {
  if (title.toLowerCase().includes("hr")) return "HRMS and payroll management";
  if (
    title.toLowerCase().includes("inventory") ||
    title.toLowerCase().includes("supply chain")
  ) {
    return "Inventory and supply chain management";
  }
  if (title.toLowerCase().includes("finance")) {
    return "Financial management and accounting";
  }
  if (title.toLowerCase().includes("knowledge")) {
    return "Training videos and documents for end users";
  }
  return "Business management solutions";
};

function formatRelativeTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

const Dashboard = () => {
  const {
    user,
    company,
    activeCompanyId,
    permissions: authPermissions,
    permissionsLoading,
  } = useAuth();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kbCount, setKbCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentPage[]>([]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab =
    searchParams.get("tab") === "modules" ? "modules" : "overview";

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "overview") next.delete("tab");
    else next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!activeCompanyId) {
      setIsLoading(false);
      return;
    }

    if (permissionsLoading) {
      setIsLoading(true);
      return;
    }

    const isAdmin =
      (user?.role ?? "").toString().toUpperCase() === "ADMIN" ||
      (user?.role ?? "").toString().toUpperCase() === "SUPER_ADMIN";

    getSidebarItems(String(activeCompanyId), {
      skipPermissions: isAdmin,
      permissions: authPermissions,
      permissionsLoading,
      canManageKnowledgeBase: (user?.role ?? "").toUpperCase() === "SUPER_ADMIN",
      company:
        company?.id != null && Number(company.id) === activeCompanyId
          ? company
          : undefined,
    }).then((items) => {
      setSidebarItems(items);
      setIsLoading(false);
    });
  }, [activeCompanyId, company, user, authPermissions, permissionsLoading]);

  useEffect(() => {
    setRecent(readRecentPages(activeCompanyId));
  }, [activeCompanyId, tab]);

  useEffect(() => {
    listKnowledgeBaseItems()
      .then((items) => setKbCount(items.length))
      .catch(() => setKbCount(0));
  }, []);

  const pageCount = useMemo(
    () => sidebarItems.reduce((n, s) => n + s.items.length, 0),
    [sidebarItems],
  );

  const employeeCount =
    company?.employeeCount ?? company?.noOfEmployees ?? null;

  const enabledModules = useMemo(() => {
    const flags = [
      company?.hrEnabled && "HRMS",
      company?.inventoryEnabled && "Inventory",
      company?.financeEnabled && "Finance",
      "Knowledge Base",
    ].filter(Boolean) as string[];
    return flags;
  }, [company]);

  const quickLinks = useMemo(() => {
    const links: {
      title: string;
      url: string;
      icon: LucideIcon;
      section: string;
    }[] = [];
    for (const section of sidebarItems) {
      for (const item of section.items.slice(0, 2)) {
        links.push({
          title: item.title,
          url: item.url,
          icon: getModuleIcon(item.title, item.icon),
          section: section.title,
        });
      }
    }
    return links.slice(0, 8);
  }, [sidebarItems]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  const displayName = user?.username || "there";

  return (
    <div className="relative min-h-full space-y-5 p-4 sm:p-6">
      {/* Soft atmosphere behind Overview content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden"
      >
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute right-0 top-10 h-64 w-80 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_at_top,_rgba(15,23,42,0.04),_transparent_55%)]" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="relative z-[1] gap-5">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-fit">
          <StyledTabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </StyledTabsTrigger>
          <StyledTabsTrigger value="modules" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Modules
          </StyledTabsTrigger>
        </TabsList>

        {/* ── Overview: KPIs + recent activity ─────────────────────────────── */}
        <TabsContent value="overview" className="mt-0 space-y-6">
          <WorkspaceHero
            eyebrow="Workspace overview"
            title={`${greetingForNow()}, ${displayName}`}
            description={
              <>
                Pick up where you left off, jump into a module, or scan what’s
                available for{" "}
                <span className="font-medium text-white">
                  {company?.companyName || "your company"}
                </span>
                .
              </>
            }
            modules={enabledModules}
          />

          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Employees"
              value={employeeCount != null ? String(employeeCount) : "—"}
              hint="Active workforce"
              icon={Users}
              tone="sky"
              delay={0}
            />
            <KpiCard
              label="Modules"
              value={String(enabledModules.length)}
              hint={enabledModules.join(" · ") || "None enabled"}
              icon={Package}
              tone="emerald"
              delay={60}
            />
            <KpiCard
              label="Shortcuts"
              value={String(pageCount)}
              hint="Pages you can open"
              icon={LayoutGrid}
              tone="amber"
              delay={120}
            />
            <KpiCard
              label="Knowledge Base"
              value={kbCount != null ? String(kbCount) : "—"}
              hint="Training materials"
              icon={BookOpen}
              tone="cyan"
              delay={180}
              onClick={() => navigate("/knowledge-base")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Recent */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur lg:col-span-3">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-slate-900">
                    Recent activity
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Pages you opened in this company
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-500">
                  {recent.length} recent
                </span>
              </div>
              <div className="px-2 py-2 sm:px-3">
                {recent.length === 0 ? (
                  <div className="m-3 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-10 text-center">
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F2744] text-teal-300 shadow-lg shadow-slate-900/10">
                      <Compass className="h-5 w-5" />
                    </span>
                    <p className="font-serif text-lg font-semibold text-slate-800">
                      Your trail starts here
                    </p>
                    <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                      Open any module once and it will show up here for faster
                      return trips.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab("modules")}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0F2744] px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Browse modules
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {recent.map((item, idx) => (
                      <li
                        key={`${item.path}-${item.visitedAt}`}
                        className="animate-in fade-in slide-in-from-bottom-1 duration-300"
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(item.path)}
                          className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 text-teal-200 shadow-sm transition group-hover:scale-105">
                            <Clock className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-800">
                              {item.title}
                            </span>
                            <span className="block truncate font-mono text-[11px] text-slate-400">
                              {item.path}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                            {formatRelativeTime(item.visitedAt)}
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Quick links */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur lg:col-span-2">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-serif text-xl font-bold text-slate-900">
                  Quick links
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Jump into the areas you use most
                </p>
              </div>
              <div className="space-y-2 p-3">
                {quickLinks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No modules available for your permissions.
                  </p>
                ) : (
                  quickLinks.map((link, idx) => {
                    const accent = sectionAccent(link.section);
                    return (
                      <button
                        key={`${link.section}-${link.title}`}
                        type="button"
                        onClick={() => navigate(link.url)}
                        className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-left transition hover:border-slate-200 hover:shadow-md"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-y-0 left-0 w-1 bg-gradient-to-b opacity-80",
                            accent.bar,
                          )}
                        />
                        <span
                          className={cn(
                            "ml-1 flex h-9 w-9 items-center justify-center rounded-xl transition group-hover:scale-105",
                            accent.icon,
                          )}
                        >
                          <link.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800">
                            {link.title}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 inline-flex rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider ring-1 ring-inset",
                              accent.chip,
                            )}
                          >
                            {link.section}
                          </span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Modules: current launcher with quick wins ────────────────────── */}
        <TabsContent value="modules" className="mt-0 space-y-6">
          <WorkspaceHero
            eyebrow="Module launcher"
            title={`${greetingForNow()}, ${displayName}`}
            description={
              <>
                Browse every area you can access for{" "}
                <span className="font-medium text-white">
                  {company?.companyName || "your company"}
                </span>
                .
              </>
            }
            modules={enabledModules}
          />

          {sidebarItems.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-xs text-muted-foreground">
                No modules available for this company or your current
                permissions.
              </CardContent>
            </Card>
          ) : null}

          {sidebarItems.map((item) => {
            const theme = getSystemTheme(item.title);
            const systemSubtitle = getSystemSubtitle(item.title);

            return (
              <div key={item.title} className="space-y-3">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5",
                    theme.bgColor,
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      theme.iconBg,
                    )}
                  >
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2
                      className={cn(
                        "font-serif text-lg font-semibold leading-tight",
                        theme.textColor,
                      )}
                    >
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-600">{systemSubtitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {item.items.map((subItem) => {
                    const ModuleIcon = getModuleIcon(
                      subItem.title,
                      subItem.icon,
                    );
                    const description = getModuleDescription(subItem.title);

                    return (
                      <button
                        key={subItem.title}
                        type="button"
                        onClick={() => navigate(subItem.url)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border bg-white p-3.5 text-left transition",
                          "hover:shadow-md active:scale-[0.99]",
                          theme.borderColor,
                          theme.hoverBorderColor,
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            theme.bgColor,
                          )}
                        >
                          <ModuleIcon
                            className={cn("h-4 w-4", theme.textColor)}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800">
                            {subItem.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                            {description}
                          </p>
                        </div>
                        <ArrowRight
                          className={cn(
                            "mt-1 h-4 w-4 shrink-0 opacity-40",
                            theme.textColor,
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

function WorkspaceHero({
  eyebrow,
  title,
  description,
  modules,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  modules: string[];
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800/10 bg-[#0F2744] px-5 py-6 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-7">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 100% 0%, rgba(45,212,191,0.35), transparent 50%), radial-gradient(ellipse 60% 70% at 0% 100%, rgba(56,189,248,0.25), transparent 45%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-200/90">
            <Sparkles className="h-3 w-3" />
            {eyebrow}
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-[2.15rem]">
            {title}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-300">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <span
              key={m}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-teal-50 backdrop-blur"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  delay = 0,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  tone: "sky" | "emerald" | "amber" | "cyan";
  delay?: number;
  onClick?: () => void;
}) {
  const tones = {
    sky: {
      icon: "bg-sky-100 text-sky-700",
      bar: "from-sky-400 to-blue-600",
      glow: "hover:shadow-sky-200/50",
    },
    emerald: {
      icon: "bg-emerald-100 text-emerald-700",
      bar: "from-emerald-400 to-teal-600",
      glow: "hover:shadow-emerald-200/50",
    },
    amber: {
      icon: "bg-amber-100 text-amber-800",
      bar: "from-amber-400 to-orange-500",
      glow: "hover:shadow-amber-200/50",
    },
    cyan: {
      icon: "bg-cyan-100 text-cyan-700",
      bar: "from-cyan-400 to-teal-600",
      glow: "hover:shadow-cyan-200/50",
    },
  } as const;

  const t = tones[tone];
  const className = cn(
    "group relative w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-4 text-left shadow-sm backdrop-blur transition duration-200",
    "hover:-translate-y-0.5 hover:shadow-lg",
    t.glow,
    "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
  );

  const body = (
    <>
      <span
        aria-hidden
        className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", t.bar)}
      />
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </span>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl transition group-hover:scale-110",
            t.icon,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="font-serif text-[1.75rem] font-bold leading-none tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 truncate text-xs text-slate-500">{hint}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        style={{ animationDelay: `${delay}ms` }}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={className} style={{ animationDelay: `${delay}ms` }}>
      {body}
    </div>
  );
}

export default Dashboard;
