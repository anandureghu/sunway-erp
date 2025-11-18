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
  Package,
  ShoppingCart,
  Receipt,
  FileText,
  DollarSign,
  Wallet,
  Landmark,
  PieChart,
  ChevronDown,
  Settings,
  FileSpreadsheet,
  // Database,
  LayoutDashboard,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
// import { useEmployeeSelection } from "@/context/employee-selection";
import { useAppSelector } from "@/store/store";

export function AppSidebar() {
  const location = useLocation();
  const path = location.pathname;
  // const { selected } = useEmployeeSelection();
  const adminView = useAppSelector((s) => s.ui.adminView);

  // const empBase = selected ? `/hr/employees/${selected.id}` : null;

  const sections = [
    {
      title: "HR and Payroll",
      icon: Users,
      color: "text-yellow-500",
      items: [
        { title: "Employee Overview", url: "/hr/employees", icon: Users },
        { title: "HR Reports", url: "/hr/reports", icon: FileSpreadsheet },
        { title: "HR Settings", url: "/hr/settings", icon: Settings },
      ],
    },
    {
      title: "Inventory",
      icon: Package,
      color: "text-amber-700",
      items: [
        {
          title: "Inventory (Stocks)",
          url: "/inventory/stocks",
          icon: Package,
        },
        { title: "Sales", url: "/inventory/sales", icon: ShoppingCart },
        {
          title: "Purchase & Suppliers",
          url: "/inventory/purchase",
          icon: Receipt,
        },
        {
          title: "Inventory Report",
          url: "/inventory/reports",
          icon: FileText,
        },
      ],
    },
    {
      title: "Finance",
      icon: DollarSign,
      color: "text-green-700",
      items: [
        {
          title: "Accounts Receivable",
          url: "/finance/receivable",
          icon: Wallet,
        },
        { title: "Accounts Payable", url: "/finance/payable", icon: Receipt },
        { title: "General Ledger", url: "/finance/ledger", icon: Landmark },
        { title: "Employee Payroll", url: "/finance/payroll", icon: Users },
        { title: "Finance Reports", url: "/finance/reports", icon: PieChart },
      ],
    },
  ] as const;

  // Admin-only sections
  const adminSections = [
    {
      title: "HR",
      icon: LayoutDashboard,
      color: "text-sky-600",
      items: [
        { title: "Company", url: "/admin/company", icon: LayoutDashboard },
        { title: "Department", url: "/admin/department", icon: FileText },
      ],
    },
  ];

  return (
    <Sidebar className="relative">
      <SidebarHeader className="bg-background border-b">
        <div className="flex items-center gap-3 px-3">
          <img
            src="/assets/logo-dark.svg"
            alt="sunway"
            width={38}
            className="my-2"
          />
          <div className="flex flex-col items-start">
            <h1 className="font-display font-bold text-xl text-primary">
              Sunway
            </h1>
            <p className="text-sm text-muted-foreground">ERP Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 bg-background pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                to="/"
                className={cn(
                  "flex gap-2 items-center",
                  path === "/" && "bg-primary text-secondary"
                )}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {!adminView &&
          sections.map((section) => (
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
                                    "bg-primary text-secondary"
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

        {/* Render admin sections only when adminView is true */}
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
                                    "bg-primary text-secondary"
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

      <SidebarFooter className="bg-background border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings" className="flex gap-2 items-center">
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
