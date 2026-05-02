import { useEmployeeSelection } from "@/context/employee-selection";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  CollapsibleTrigger,
  CollapsibleContent,
  Collapsible,
} from "@radix-ui/react-collapsible";
import {
  Home,
  FileText,
  ChevronDown,
  Settings,
  LayoutDashboard,
  Split,
  Banknote,
  Receipt,
  ArrowLeft,
  Building,
  Pin,
  PinOff,
  Wallet,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { SidebarItem } from "@/types/company";
import type { ModulePermission } from "@/types/role";
import { useAuth } from "@/context/AuthContext";
import {
  getSidebarItems,
  getVisibleEmployeeSubModules,
} from "@/service/companyService";
import { toggleGlobalSettingsView } from "@/store/uiSlice";


const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/* ── Per-module color palette ─────────────────────────────── */
const MODULE_COLORS: Record<
  string,
  {
    bg: string;
    text: string;
    activeBg: string;
    activeText: string;
    dot: string;
  }
> = {
  Profile: {
    bg: "bg-violet-100",
    text: "text-violet-600",
    activeBg: "bg-violet-600",
    activeText: "text-white",
    dot: "bg-violet-500",
  },
  "Current Job": {
    bg: "bg-blue-100",
    text: "text-blue-600",
    activeBg: "bg-blue-600",
    activeText: "text-white",
    dot: "bg-blue-500",
  },
  Salary: {
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    activeBg: "bg-emerald-600",
    activeText: "text-white",
    dot: "bg-emerald-500",
  },
  Leaves: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    activeBg: "bg-amber-600",
    activeText: "text-white",
    dot: "bg-amber-500",
  },
  Loans: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    activeBg: "bg-orange-600",
    activeText: "text-white",
    dot: "bg-orange-500",
  },
  Dependents: {
    bg: "bg-pink-100",
    text: "text-pink-600",
    activeBg: "bg-pink-600",
    activeText: "text-white",
    dot: "bg-pink-500",
  },
  Appraisal: {
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    activeBg: "bg-yellow-600",
    activeText: "text-white",
    dot: "bg-yellow-500",
  },
  Immigration: {
    bg: "bg-indigo-100",
    text: "text-indigo-600",
    activeBg: "bg-indigo-600",
    activeText: "text-white",
    dot: "bg-indigo-500",
  },
};

const defaultColor = {
  bg: "bg-slate-100",
  text: "text-slate-600",
  activeBg: "bg-slate-600",
  activeText: "text-white",
  dot: "bg-slate-500",
};

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const path = location.pathname;
  const { selected } = useEmployeeSelection();
  const { user, permissions: authPermissions } = useAuth();

  const { adminView, globalSettingsView } = useAppSelector((s) => s.ui);

  const { setOpen, isMobile } = useSidebar();
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    return localStorage.getItem("sidebarPinned") === "1";
  });

  useEffect(() => {
    localStorage.setItem("sidebarPinned", isPinned ? "1" : "0");
    if (isPinned && !isMobile) {
      setOpen(true);
    }
  }, [isPinned, isMobile, setOpen]);

  const handlePointerLeaveSidebar = (e: MouseEvent<HTMLDivElement>) => {
    if (isMobile || isPinned) return;
    const related = e.relatedTarget as EventTarget | null;
    if (related && related instanceof Node) {
      if (e.currentTarget.contains(related)) return;
      const strip = document.querySelector('[data-sidebar="edge-strip"]');
      if (strip && strip instanceof Node && strip.contains(related)) return;
    }
    setOpen(false);
  };

  const handleTogglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      if (!next && !isMobile) setOpen(false);
      if (next && !isMobile) setOpen(true);
      return next;
    });
  };

  const empBase = selected ? `/hr/employees/${selected.id}` : null;

  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);

  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");
  const isHrManager = /hr\s*manager/i.test(user?.companyRole ?? "");
  const isPrivileged = isAdmin || isHrManager;

  const adminSections = [
    {
      title: "Admin Settings",
      icon: LayoutDashboard,
      color: "text-sky-600 dark:text-sky-400",
      items: [
        { title: "Company", url: "/admin/company", icon: LayoutDashboard },
      ],
    },
  ];

  const globalSettings = [
    {
      title: "All",
      icon: LayoutDashboard,
      color: "text-sky-600 dark:text-sky-400",
      items: [
        {
          title: "Company",
          url: `/settings/${user?.companyId}`,
          icon: Building,
        },
        {
          title: "Payroll",
          url: `/settings/payroll/${user?.companyId}`,
          icon: Wallet,
        },
        {
          title: "Social",
          url: "/admin/social-settings",
          icon: FileText,
        },
        { title: "Department", url: "/admin/department", icon: FileText },
        { title: "Division", url: "/admin/division", icon: Split },
        {
          title: "Roles",
          url: `/settings/roles/${user?.companyId}`,
          icon: Building,
        },
        {
          title: "Accounting Period",
          url: "/admin/accounting-period",
          icon: Banknote,
        },
        { title: "Bank Accounts", url: "/admin/bank-accounts", icon: Banknote },
        {
          title: "Default Accounts",
          url: "/admin/default-accounts",
          icon: Banknote,
        },
        {
          title: "Tax Settings",
          url: "/admin/tax-settings",
          icon: FileText,
        },
        {
          title: "Invoice Settings",
          url: "/admin/invoice-settings",
          icon: Receipt,
        },
      ],
    },
  ];

  const prevAdminView = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (prevAdminView.current === adminView) {
      prevAdminView.current = adminView;
      return;
    }
    if (adminView) {
      navigate("/admin/company");
    } else if (prevAdminView.current === true) {
      navigate("/");
    }
    prevAdminView.current = adminView;
  }, [adminView, navigate]);

useEffect(() => {
    if (!user?.companyId) return;

    if (isPrivileged) {
      getSidebarItems(String(user.companyId), { skipPermissions: true }).then(
        setSidebarItems,
      );
      setPermissions(null as any);
    } else {
      // Use permissions from AuthContext directly
      getSidebarItems(String(user.companyId), { permissions: authPermissions }).then(
        (items) => {
          setSidebarItems(items);
          setPermissions(authPermissions as any);
        },
      );
    }
  }, [user, isPrivileged, authPermissions]);

  const employeeSubModules = getVisibleEmployeeSubModules(
    isPrivileged ? null : permissions,
    empBase,
  );

  return (
    <Sidebar className="border-r border-slate-200/80 bg-white">
      <div
        className="relative flex h-full min-h-0 w-full flex-col"
        onMouseLeave={handlePointerLeaveSidebar}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <SidebarHeader className="border-b border-slate-100 bg-white p-0">
          {/* Gradient accent strip */}
          <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600" />
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-md shadow-violet-500/30">
                <img
                  src="/assets/logo-dark.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="invert"
                />
              </div>
              <div className="min-w-0">
                <span className="block truncate text-sm font-bold tracking-tight text-slate-800">
                  Sunway
                </span>
                <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  ERP Platform
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTogglePin}
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-150",
                isPinned
                  ? "border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100"
                  : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600",
              )}
              title={isPinned ? "Unstick sidebar" : "Stick sidebar"}
              aria-label={isPinned ? "Unstick sidebar" : "Stick sidebar"}
            >
              {isPinned ? (
                <Pin className="h-3.5 w-3.5" />
              ) : (
                <PinOff className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </SidebarHeader>

        {/* ── Content ─────────────────────────────────────── */}
        <SidebarContent className="gap-0 px-3 py-3 group-data-[collapsible=icon]:px-1">
          {/* Dashboard link */}
          {!adminView && !globalSettingsView && (
            <SidebarMenu className="mb-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-auto p-0">
                  <Link
                    to="/"
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      path === "/"
                        ? "bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 text-white shadow-md shadow-violet-500/25"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg",
                        path === "/" ? "bg-white/20" : "bg-slate-200",
                      )}
                    >
                      <Home className="h-3.5 w-3.5" />
                    </span>
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}

          {/* Global settings header */}
          {globalSettingsView && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 to-blue-50 px-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-sm">
                <Settings className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-bold text-slate-800">
                Global Settings
              </span>
            </div>
          )}

          {/* Main sections */}
          {(adminView
            ? adminSections
            : globalSettingsView
              ? globalSettings
              : sidebarItems
          ).map((section) => (
            <Collapsible
              key={section.title}
              defaultOpen
              className="group/collapsible mb-1"
            >
              <SidebarGroup className="py-0">
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50">
                    <section.icon
                      className={cn("h-3.5 w-3.5", section.color)}
                    />
                    <span className="flex-1 truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {section.title}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5 mt-0.5">
                      {section.items.map((item) => {
                        const active = path.startsWith(item.url);
                        return (
                          <SidebarMenuSub
                            key={item.title}
                            className="border-none"
                          >
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild className="h-auto p-0">
                                <Link
                                  to={item.url}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                                    active
                                      ? "bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 text-white shadow-md shadow-violet-500/25"
                                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors",
                                      active
                                        ? "bg-white/20"
                                        : "bg-slate-200 group-hover:bg-slate-300",
                                    )}
                                  >
                                    <item.icon className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="truncate">{item.title}</span>
                                </Link>
                              </SidebarMenuButton>

                              {/* ── Employee submodules ─────────────────── */}
                              {item.url === "/hr/employees" && selected && (
                                <div className="mt-2 mb-1 mx-1">
                                  {/* Employee card */}
                                  <div className="mb-2 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-bold text-white shadow-sm">
                                        {selected.firstName?.[0]?.toUpperCase() ??
                                          "E"}
                                        {selected.lastName?.[0]?.toUpperCase() ??
                                          ""}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-slate-800">
                                          {selected.firstName}{" "}
                                          {selected.lastName}
                                        </p>
                                        <p className="truncate text-xs text-slate-400">
                                          {selected.employeeNo ?? "Employee"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Submodule links — larger but distinct */}
                                  <div className="space-y-px">
                                    {employeeSubModules.map((sm) => {
                                      const disabled = !sm.to || sm.to === "#";
                                      const active = !!(
                                        sm.to && path.startsWith(sm.to)
                                      );
                                      const colors =
                                        MODULE_COLORS[sm.title] ?? defaultColor;

                                      return (
                                        <SidebarMenuButton asChild key={sm.title} className="h-auto p-0">
                                          {disabled ? (
                                            <div
                                              className="flex cursor-not-allowed items-center gap-2 rounded-md px-2.5 py-1.5 opacity-40"
                                              aria-disabled
                                              title="Select an employee first"
                                            >
                                              <span
                                                className={cn(
                                                  "flex h-6 w-6 items-center justify-center rounded-lg",
                                                  colors.bg,
                                                )}
                                              >
                                                <sm.icon
                                                  className={cn(
                                                    "h-3.5 w-3.5",
                                                    colors.text,
                                                  )}
                                                />
                                              </span>
                                              <span className="text-xs text-slate-500">
                                                {sm.title}
                                              </span>
                                            </div>
                                          ) : (
                                            <Link
                                              to={sm.to!}
                                              className={cn(
                                                "flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all duration-150",
                                                active
                                                  ? cn(
                                                      "shadow-sm",
                                                      colors.activeBg,
                                                      colors.activeText,
                                                    )
                                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                              )}
                                            >
                                              <span
                                                className={cn(
                                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors",
                                                  active
                                                    ? "bg-white/25"
                                                    : colors.bg,
                                                )}
                                              >
                                                <sm.icon
                                                  className={cn(
                                                    "h-3.5 w-3.5",
                                                    active
                                                      ? colors.activeText
                                                      : colors.text,
                                                  )}
                                                />
                                              </span>
                                              <span className="truncate text-xs font-medium">
                                                {sm.title}
                                              </span>
                                              {active && (
                                                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                                              )}
                                            </Link>
                                          )}
                                        </SidebarMenuButton>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </SidebarMenuItem>
                          </SidebarMenuSub>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
        </SidebarContent>

        {/* ── Footer ──────────────────────────────────────── */}
        <SidebarFooter className="border-t border-slate-100 bg-white p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-auto p-0">
                <Link
                  to={globalSettingsView ? "/" : `/settings/${user?.companyId}`}
                  onClick={() => dispatch(toggleGlobalSettingsView())}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    globalSettingsView
                      ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg",
                      globalSettingsView ? "bg-violet-100" : "bg-slate-200",
                    )}
                  >
                    {globalSettingsView ? (
                      <ArrowLeft className="h-3.5 w-3.5 text-violet-600" />
                    ) : (
                      <Settings className="h-3.5 w-3.5 text-slate-500" />
                    )}
                  </span>
                  <span>{globalSettingsView ? "Back to app" : "Settings"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </div>
    </Sidebar>
  );
}
