import { useEmployeeSelection } from "@/context/employee-selection";

// src/components/AppSidebar.tsx
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
  Users,
  FileText,
  FileSpreadsheet,
  DollarSign,
  ChevronDown,
  Settings,
  LayoutDashboard,
  UserRound,
  BriefcaseBusiness,
  CreditCard,
  Shield,
  CalendarDays,
  Star,
  Split,
  Banknote,
  Building2,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useEmployeeSelection } from "@/context/employee-selection";
import { useAppSelector } from "@/store/store";
import { useEffect, useState } from "react";
import type { SidebarItem } from "@/types/company";
import { useAuth } from "@/context/AuthContext";
import { getSidebarItems } from "@/service/companyService";

// ✅ Step 2 - Add canAccess Helper
// FIXED: Allow access when permissions are loading (null) and grant full access to SUPER_ADMIN
// FIXED: Made case-insensitive for module and action lookups
const canAccess = (
  permissions: Record<string, Record<string, boolean>> | null,
  module: string,
  action: string,
  userRole?: string,
  loading?: boolean
): boolean => {
  // ✅ Don't show anything while permissions are being fetched
  if (loading) return false;

  // ADMIN/SUPER_ADMIN bypass
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;

  // No permissions loaded = no access
  if (!permissions) return false;

  // Normalize module and action to lowercase for case-insensitive lookup
  const normalizedModule = module.toLowerCase();
  const normalizedAction = action.toLowerCase();

  // Try direct lookup first (case-sensitive)
  if (permissions[module]?.[action] === true) return true;

  // Try case-insensitive lookup
  for (const [permModule, perms] of Object.entries(permissions)) {
    if (permModule.toLowerCase() === normalizedModule) {
      for (const [permAction, value] of Object.entries(perms)) {
        if (permAction.toLowerCase() === normalizedAction && value === true) {
          return true;
        }
      }
    }
  }

  return false;
};

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { selected } = useEmployeeSelection();
  const { user, permissions, permissionsLoading } = useAuth();

  const adminView = useAppSelector((s) => s.ui.adminView);

  const empBase = selected ? `/hr/employees/${selected.id}` : null;

  // Don't return null - the sidebar should render even while permissions/company data is loading
  // We'll show the dashboard link at minimum and conditionally show other items based on permissions

  const employeeSubModules = [
    {
      title: "Profile",
      module: "employee_profile",
      action: "view_own",
      icon: UserRound,
      to: empBase ? `${empBase}/profile` : "#",
    },
    {
      title: "Current Job",
      module: "current_job",
      action: "view_own",
      icon: BriefcaseBusiness,
      to: empBase ? `${empBase}/current-job` : "#",
    },
    {
      title: "Salary",
      module: "salary",
      action: "view_own",
      icon: DollarSign,
      to: empBase ? `${empBase}/salary` : "#",
    },
    {
      title: "Leaves",
      module: "leaves",
      action: "view_own",
      icon: CalendarDays,
      to: empBase ? `${empBase}/leaves` : "#",
    },
    {
      title: "Loans",
      module: "loans",
      action: "view_own",
      icon: CreditCard,
      to: empBase ? `${empBase}/loans` : "#",
    },
    {
      title: "Dependents",
      module: "dependents",
      action: "view_own",
      icon: Users,
      to: empBase ? `${empBase}/dependents` : "#",
    },
    {
      title: "Appraisal",
      module: "appraisal",
      action: "view_own",
      icon: Star,
      to: empBase ? `${empBase}/appraisal` : "#",
    },
    {
      title: "Immigration",
      module: "immigration",
      action: "view_own",
      icon: Shield,
      to: empBase ? `${empBase}/immigration` : "#",
    },
  ];

  // Admin-only sections
  const adminSections = [
    {
      title: "Admin Settings",
      icon: LayoutDashboard,
      color: "text-sky-600",
      items: [
        { title: "Company", url: "/admin/company", icon: LayoutDashboard },
        { title: "Department", url: "/admin/department", icon: FileText },
        { title: "Customers", url: "/admin/customers", icon: Users },
        { title: "Vendors", url: "/admin/vendors", icon: Building2 },
        { title: "Division", url: "/admin/division", icon: Split },
        {
          title: "Accounting Period",
          url: "/admin/accounting-period",
          icon: Banknote,
        },
        { title: "Leaves", url: "/admin/leaves", icon: CalendarDays },
      ],
    },
  ];

  useEffect(() => {
    if (adminView) navigate("/admin/company");
    else navigate("/");
  }, [adminView]);

  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  
  // Default sidebar items to show when company data is unavailable
  const defaultSidebarItems: SidebarItem[] = [
    {
      title: "HR and Payroll",
      icon: Users,
      color: "text-yellow-500",
      image: "/assets/images/hr.svg",
      url: "/hr/dashboard",
      items: [
        { title: "HR Analytics", url: "/hr/dashboard", icon: Users },
        { title: "Employee Overview", url: "/hr/employees", icon: Users },
        { title: "HR Reports", url: "/hr/reports", icon: FileSpreadsheet },
        { title: "HR Settings", url: "/hr/settings", icon: Settings },
      ],
    },
  ];

  useEffect(() => {
    if (user?.companyId) {
      getSidebarItems(user.companyId).then((items) => {
        setSidebarItems(items);
      }).catch(() => {
        // Use default items if API fails
        setSidebarItems(defaultSidebarItems);
      });
    } else {
      // Use default items when companyId is not available
      setSidebarItems(defaultSidebarItems);
    }
  }, [user]);

  return (
    <Sidebar className="relative border-none">
      {/* Header */}
      <SidebarHeader className="bg-primary text-white border-b">
        <div className="flex items-center gap-3 px-3">
          <img
            src="/assets/logo.svg"
            alt="sunway"
            width={38}
            className="my-2"
          />
          <div className="flex flex-col items-start">
            <h1 className="font-display font-bold text-xl text-white">
              Sunway
            </h1>
            <p className="text-sm text-accent">ERP Platform</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-4 bg-background pt-3">
        {/* Dashboard */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                to="/"
                className={cn(
                  "flex gap-2 items-center",
                  path === "/" && "bg-primary text-secondary",
                )}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Groups */}
        {!adminView &&
          sidebarItems.map((section) => (
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
                      {/* render each item; when "Employee Overview", also render nested sub-mods */}
                      {section.items
                        .filter((item) => {
                          // ✅ Step 5 - Protect Top-Level Sections
                          // Allow access for HR Analytics and Employee Overview (no module check needed)
                          if (item.url === "/hr/dashboard" || item.url === "/hr/employees") return true;
                          // For other items, check if user has view_own permission for the module
                          // Using a complete mapping with correct casing
                          const moduleMap: Record<string, string> = {
                            "/hr/dashboard": "hr_dashboard",
                            "/hr/employees": "employee_profile",
                            "/hr/reports": "hr_reports",
                            "/hr/settings": "hr_settings",
                          };
                          const module = moduleMap[item.url];
                          if (module) {
                            return canAccess(permissions, module, "view_own", user?.role, permissionsLoading);
                          }
                          return true;
                        })
                        .map((item) => (
                        <SidebarMenuSub key={item.title}>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link
                                to={item.url}
                                className={cn(
                                  "flex gap-2 items-center",
                                  path.startsWith(item.url) &&
                                    "bg-primary text-secondary",
                                )}
                              >
                                <item.icon className="w-4 h-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>

                            {/* If this is Employee Overview, show nested sub-modules */}
                            {item.url === "/hr/employees" && selected && (
                              <div className="mt-1 space-y-1">
                                {/* ✅ Step 4 - Filter When Rendering */}
                                {employeeSubModules
                                  .filter((sm) => canAccess(permissions, sm.module, sm.action, user?.role, permissionsLoading))
                                  .map((sm) => {
                                  const disabled = !sm.to;
                                  const active = sm.to && path === sm.to;

                                  return (
                                    <SidebarMenuButton asChild key={sm.title}>
                                      {disabled ? (
                                        <div
                                          className={cn(
                                            "ml-6 flex gap-2 items-center rounded-md cursor-not-allowed opacity-50",
                                          )}
                                          aria-disabled
                                          title="Select an employee from the list first"
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
                                              ? "bg-primary text-secondary"
                                              : "hover:bg-muted",
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

        {adminView &&
          adminSections.map((section) => (
            <Collapsible
              key={section.title}
              defaultOpen
              className="group/collapsible mt-2"
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
                                    "bg-primary text-secondary",
                                )}
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
          ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="bg-background border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                to={`/settings/${user?.companyId}`}
                className="flex gap-2 items-center"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
