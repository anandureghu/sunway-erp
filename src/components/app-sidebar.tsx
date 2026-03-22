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
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { useEffect, useState } from "react";
import type { SidebarItem } from "@/types/company";
import type { ModulePermission } from "@/types/role";
import { useAuth } from "@/context/AuthContext";
import {
  getSidebarItems,
  fetchMyPermissions,
  getVisibleEmployeeSubModules,
} from "@/service/companyService";
import { toggleGlobalSettingsView } from "@/store/uiSlice";

// Roles that bypass all permission checks
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const path = location.pathname;
  const { selected } = useEmployeeSelection();
  const { user } = useAuth();

  const { adminView, globalSettingsView } = useAppSelector((s) => s.ui);

  const empBase = selected ? `/hr/employees/${selected.id}` : null;

  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);

  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");

  const adminSections = [
    {
      title: "Admin Settings",
      icon: LayoutDashboard,
      color: "text-sky-600",
      items: [
        { title: "Company", url: "/admin/company", icon: LayoutDashboard },
      ],
    },
  ];

  const globalSettings = [
    {
      title: "All",
      icon: LayoutDashboard,
      color: "text-sky-600",
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

  useEffect(() => {
    if (adminView) navigate("/admin/company");
    else navigate("/");
  }, [adminView]);

  useEffect(() => {
    if (!user?.companyId) return;

    if (isAdmin) {
      // Admin bypass — no permission filtering needed
      getSidebarItems(user.companyId).then(setSidebarItems);
      setPermissions([]); // empty = canView returns true for all
    } else {
      Promise.all([getSidebarItems(user.companyId), fetchMyPermissions()]).then(
        ([items, perms]) => {
          setSidebarItems(items);
          setPermissions(perms);
        },
      );
    }
  }, [user, isAdmin]);

  // empty permissions array = admin bypass = show all sub-modules
  const employeeSubModules = getVisibleEmployeeSubModules(
    isAdmin ? [] : permissions,
    empBase,
  );

  return (
    <Sidebar className="relative border-none">
      <SidebarHeader className="bg-white text-black border-b">
        <div className="flex items-center gap-3 px-3">
          <img
            src="/assets/logo-dark.svg"
            alt="sunway"
            width={38}
            className="my-2"
          />
          <div className="flex flex-col items-start">
            <h1 className="font-display font-bold text-xl text-blue-950">
              Sunway
            </h1>
            <p className="text-sm text-purple-800">ERP Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 bg-background pt-3">
        {/* Dashboard */}
        {!adminView && !globalSettingsView && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  to="/"
                  className={cn(
                    "flex gap-2 items-center",
                    path === "/" && "bg-primary-gradient text-secondary",
                  )}
                >
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        {globalSettingsView && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="py-5">
                <div className="text-2xl font-bold">
                  <span className="bg-primary-gradient min-w-10 min-h-10 flex items-center justify-center rounded-xl">
                    <Settings className="w-5 h-5 text-white" />{" "}
                  </span>
                  Global Settings
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        {/* Normal sections */}
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
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center gap-2">
                  <section.icon className={cn("w-5 h-5", section.color)} />
                  <span>{section.title}</span>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuSub key={item.title}>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link
                              to={item.url}
                              className={cn(
                                "flex gap-2 items-center",
                                path.startsWith(item.url) &&
                                  "bg-primary-gradient text-secondary hover:text-white/70",
                              )}
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>

                          {/* Employee sub-modules — permission filtered */}
                          {item.url === "/hr/employees" && selected && (
                            <div className="mt-1 space-y-1">
                              {employeeSubModules.map((sm) => {
                                const disabled = !sm.to || sm.to === "#";
                                const active = sm.to && path === sm.to;
                                return (
                                  <SidebarMenuButton asChild key={sm.title}>
                                    {disabled ? (
                                      <div
                                        className="ml-6 flex gap-2 items-center rounded-md cursor-not-allowed opacity-50"
                                        aria-disabled
                                        title="Select an employee first"
                                      >
                                        <sm.icon className="w-4 h-4" />
                                        <span>{sm.title}</span>
                                      </div>
                                    ) : (
                                      <Link
                                        to={sm.to}
                                        className={cn(
                                          "ml-6 flex gap-2 items-center rounded-md",
                                          active
                                            ? "bg-primary-gradient text-secondary hover:text-white/70"
                                            : "hover:bg-white/70",
                                        )}
                                      >
                                        <sm.icon className="w-4 h-4" />
                                        <span>{sm.title}</span>
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

        {/* Admin view */}
        {/* {adminView && adminSections.map((section) => (
          <Collapsible key={section.title} defaultOpen className="group/collapsible mt-2">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center gap-2">
                  <section.icon className={cn("w-5 h-5", section.color)} />
                  <span>{section.title}</span>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuSub key={item.title}>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link
                              to={item.url}
                              className={cn("flex gap-2 items-center", path.startsWith(item.url) && "bg-primary text-secondary")}
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenuSub>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))} */}
      </SidebarContent>

      <SidebarFooter className="bg-background border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                to={globalSettingsView ? "/" : `/settings/${user?.companyId}`}
                className="flex gap-2 items-center"
                onClick={() => {
                  dispatch(toggleGlobalSettingsView());
                }}
              >
                {globalSettingsView ? (
                  <ArrowLeft />
                ) : (
                  <Settings className="w-5 h-5" />
                )}
                <span>{globalSettingsView ? "go back" : "Settings"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
