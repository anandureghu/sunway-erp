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
  CalendarDays,
  GraduationCap,
  Star,
  FileSpreadsheet,
  Settings,
  Package,
  ShoppingCart,
  Receipt,
  FileText,
  DollarSign,
  Wallet,
  Landmark,
  PieChart,
  ChevronDown,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function AppSidebar() {
  const location = useLocation();
  const path = location.pathname;

  const sections = [
    {
      title: "HR and Payroll",
      icon: Users,
      color: "text-yellow-500",
      items: [
        { title: "Employee Overview", url: "/hr/employee", icon: Users },
        {
          title: "Leave and Attendance",
          url: "/hr/attendance",
          icon: CalendarDays,
        },
        {
          title: "Training and Development",
          url: "/hr/training",
          icon: GraduationCap,
        },
        { title: "Performance Appraisal", url: "/hr/appraisal", icon: Star },
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
        { title: "Purchase", url: "/inventory/purchase", icon: Receipt },
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
  ];

  return (
    <Sidebar className="relative">
      {/* Header */}
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
                  path === "/" && "bg-primary text-secondary"
                )}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Groups */}
        {sections.map((section) => (
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
                                path === item.url && "bg-primary text-secondary"
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
