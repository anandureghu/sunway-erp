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
  ArrowLeft,
  Building,
  Pin,
  PinOff,
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
import permissionService from "@/service/permissionService";
import { toggleGlobalSettingsView } from "@/store/uiSlice";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const navLinkClass = (active: boolean) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
    active
      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
      : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );

const subNavLinkClass = (active: boolean) =>
  cn(
    "ml-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
    active
      ? "bg-primary/15 font-medium text-primary"
      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const path = location.pathname;
  const { selected } = useEmployeeSelection();
  const { user } = useAuth();

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
      if (!next && !isMobile) {
        setOpen(false);
      }
      if (next && !isMobile) {
        setOpen(true);
      }
      return next;
    });
  };

  const empBase = selected ? `/hr/employees/${selected.id}` : null;

  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);

  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");

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
        {
          title: "Bank Accounts",
          url: "/admin/bank-accounts",
          icon: Banknote,
        },
      ],
    },
  ];

  const prevAdminView = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (adminView) {
      navigate("/admin/company");
    } else if (prevAdminView.current === true) {
      navigate("/");
    }
    prevAdminView.current = adminView;
  }, [adminView, navigate]);

  useEffect(() => {
    if (!user?.companyId) return;

    if (isAdmin) {
      // Skip permission checks when building sidebar for admins
      getSidebarItems(String(user.companyId), { skipPermissions: true }).then(
        setSidebarItems,
      );
      // Represent ADMIN bypass with `null` so downstream checks can detect it
      setPermissions(null as any);
    } else {
      // First fetch the cached role-based permissions, then build sidebar using them
      permissionService.getMyPermissions().then((perms) => {
        getSidebarItems(String(user.companyId), { permissions: perms }).then((items) => {
          setSidebarItems(items);
          setPermissions(perms);
        });
      });
    }
  }, [user, isAdmin]);

  const employeeSubModules = getVisibleEmployeeSubModules(
    isAdmin ? null : permissions,
    empBase,
  );

  return (
    <Sidebar className="border-r border-sidebar-border/80 bg-white">
      <div
        className="relative flex h-full min-h-0 w-full flex-col"
        onMouseLeave={handlePointerLeaveSidebar}
      >
        <SidebarHeader className="border-b border-sidebar-border/60 bg-white py-[14px] px-4">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 items-center gap-2 flex-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border/60">
                <img
                  src="/assets/logo-dark.svg"
                  alt=""
                  width={22}
                  height={22}
                  className="dark:invert"
                />
              </div>
              <span className="truncate font-display text-sm font-semibold tracking-tight">
                Sunway
              </span>
            </div>
            <button
              type="button"
              onClick={handleTogglePin}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border/60 bg-background/70 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              title={isPinned ? "Unstick sidebar" : "Stick sidebar"}
              aria-label={isPinned ? "Unstick sidebar" : "Stick sidebar"}
            >
              {isPinned ? (
                <Pin className="h-4 w-4" />
              ) : (
                <PinOff className="h-4 w-4" />
              )}
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-1 px-2 py-4 group-data-[collapsible=icon]:px-1">
          {!adminView && !globalSettingsView && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-auto p-0">
                  <Link to="/" className={navLinkClass(path === "/")}>
                    <Home className="h-4 w-4 shrink-0 opacity-90" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}

          {globalSettingsView && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-auto p-0">
                  <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 px-3 py-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                      <Settings className="h-5 w-5" />
                    </span>
                    <span className="font-semibold text-sidebar-foreground">
                      Global Settings
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}

          {(adminView
            ? adminSections
            : globalSettingsView
              ? globalSettings
              : sidebarItems
          ).map((section) => (
            <Collapsible
              key={section.title}
              defaultOpen
              className="group/collapsible"
            >
              <SidebarGroup className="py-1">
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
                    <section.icon className={cn("h-4 w-4", section.color)} />
                    <span className="flex-1 truncate">{section.title}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5">
                      {section.items.map((item) => (
                        <SidebarMenuSub
                          key={item.title}
                          className="border-none"
                        >
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild className="h-auto p-0">
                              <Link
                                to={item.url}
                                className={navLinkClass(
                                  path.startsWith(item.url),
                                )}
                              >
                                <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                                <span className="truncate">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>

                            {item.url === "/hr/employees" && selected && (
                              <div className="mt-1 space-y-0.5 border-l border-sidebar-border/60 pl-1">
                                {employeeSubModules.map((sm) => {
                                  const disabled = !sm.to || sm.to === "#";
                                  const active = !!(sm.to && path === sm.to);
                                  return (
                                    <SidebarMenuButton
                                      asChild
                                      key={sm.title}
                                      className="h-auto p-0"
                                    >
                                      {disabled ? (
                                        <div
                                          className="ml-3 flex cursor-not-allowed items-center gap-2 rounded-lg px-2 py-1.5 text-sm opacity-50"
                                          aria-disabled
                                          title="Select an employee first"
                                        >
                                          <sm.icon className="h-3.5 w-3.5" />
                                          <span>{sm.title}</span>
                                        </div>
                                      ) : (
                                        <Link
                                          to={sm.to!}
                                          className={subNavLinkClass(active)}
                                        >
                                          <sm.icon className="h-3.5 w-3.5 shrink-0" />
                                          <span className="truncate">
                                            {sm.title}
                                          </span>
                                        </Link>
                                      )}
                                    </SidebarMenuButton>
                                  );
                                })}
                              </div>
                            )}
                          </SidebarMenuItem>
                        </SidebarMenuSub>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/60 bg-sidebar/80 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-auto p-0">
                <Link
                  to={globalSettingsView ? "/" : `/settings/${user?.companyId}`}
                  onClick={() => dispatch(toggleGlobalSettingsView())}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border border-sidebar-border/80 bg-background/50 px-3 py-2.5 text-sm font-medium text-sidebar-foreground shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  {globalSettingsView ? (
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                  ) : (
                    <Settings className="h-4 w-4 shrink-0" />
                  )}
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