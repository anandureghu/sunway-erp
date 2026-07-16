import { useAuth } from "@/context/AuthContext";
import { getSidebarItems } from "@/service/companyService";
import type { SidebarItem } from "@/types/company";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
  Building,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";

// Icon mapping for modules
const getModuleIcon = (title: string, defaultIcon: any) => {
  const iconMap: Record<string, any> = {
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

// Description mapping for modules
const getModuleDescription = (title: string): string => {
  const descriptions: Record<string, string> = {
    "Employee Overview":
      "Manage employee lifecycle from hiring to retirement",
    "Employee Payroll":
      "Process compensation, generate payroll runs, and manage deductions",
    "HR Reports":
      "Operations and management reports for workforce insights",
    "Immigration Expiry":
      "Passports and residence permits that are expired or expiring soon.",
    "HR Settings":
      "Configure leave types.Establish HR policies, define job codes, manage system roles and appraisals, control system permissions",
    "Inventory (Stocks)":
      "Manage Stocks levels, perform Inventory Adjustments and, receive goods.",
    Sales:
      "Handle Sales transactions, manage sales invoices and maintain customer information. Perform order fulfillment and track shipments",
    Purchase:
      "Execute the procurement workflow, including purchase requisitions, purchase orders, receiving goods, viewing and matching invoices, and processing payment receipts.",
    "Operations Reports":
      "Day-to-day stock health — movements, batches, low stock, and expiry alerts",
    "Management Reports":
      "Valuation, turnover, and capital concentration for leadership",
    "Operations and management Reports": "Operations and management reports",
    "Inventory Reports": "Operations and management reports",
    "Inventory Report": "Operations and management reports",
    "Inventory Settings":
      "Configure item categories and warehouses, manage suppliers and customers and set system permissions",
    "Accounts Receivable":
      "View sales invoices and record customer payments",
    "Accounts Payable":
      "Manage Supplier invoices and process vendor payments",
    "General Ledger":
      "Maintain chart of accounts, process manual journal Entries, view transactions, create and distribution budget",
    "Finance Reports":
      "Generate operations and management reports related to finance performances",
    "Finance Report":
      "Generate operations and management reports related to finance performances",
    "Finance Settings":
      "Setup accounting periods, approve suppliers, configure debit/credit accounts for transactions and system permissions",
  };
  return descriptions[title] || "Open this module to continue.";
};

// System theme configuration
const getSystemTheme = (title: string) => {
  if (title.toLowerCase().includes("hr")) {
    return {
      bgColor: "bg-blue-50",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      textColor: "text-blue-700",
      buttonBg: "bg-blue-50",
      buttonText: "text-blue-700",
      borderColor: "border-blue-200",
      hoverBorderColor: "hover:border-blue-300",
    };
  } else if (title.toLowerCase().includes("inventory")) {
    return {
      bgColor: "bg-green-50",
      iconBg: "bg-gradient-to-br from-green-500 to-green-600",
      textColor: "text-green-700",
      buttonBg: "bg-green-50",
      buttonText: "text-green-700",
      borderColor: "border-green-200",
      hoverBorderColor: "hover:border-green-300",
    };
  } else if (title.toLowerCase().includes("finance")) {
    return {
      bgColor: "bg-purple-50",
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
      textColor: "text-purple-700",
      buttonBg: "bg-purple-50",
      buttonText: "text-purple-700",
      borderColor: "border-purple-200",
      hoverBorderColor: "hover:border-purple-300",
    };
  }
  return {
    bgColor: "bg-gray-50",
    iconBg: "bg-gradient-to-br from-gray-500 to-gray-600",
    textColor: "text-gray-700",
    buttonBg: "bg-gray-50",
    buttonText: "text-gray-700",
    borderColor: "border-gray-200",
    hoverBorderColor: "hover:border-gray-300",
  };
};

// System subtitle mapping
const getSystemSubtitle = (title: string): string => {
  if (title.toLowerCase().includes("hr")) {
    return "Human resource and payroll management";
  } else if (title.toLowerCase().includes("inventory")) {
    return "Inventory and supply chain management";
  } else if (title.toLowerCase().includes("finance")) {
    return "Financial management and accounting";
  }
  return "Business management solutions";
};

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
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeCompanyId) {
      setIsLoading(false);
      return;
    }

    // FIX: Check if permissions are still loading
    // Don't fetch sidebar items until permissions are ready
    if (permissionsLoading) {
      console.debug("Dashboard: Permissions still loading...");
      setIsLoading(true);
      return;
    }

    const isAdmin =
      (user?.role ?? "").toString().toUpperCase() === "ADMIN" ||
      (user?.role ?? "").toString().toUpperCase() === "SUPER_ADMIN";

    console.debug("Dashboard: Fetching sidebar items", {
      companyId: activeCompanyId,
      isAdmin,
      hasPermissions: !!authPermissions,
      permissionKeys: authPermissions ? Object.keys(authPermissions) : null,
    });

    // Pass permissionsLoading flag so canView() knows the state
    getSidebarItems(String(activeCompanyId), {
      skipPermissions: isAdmin,
      permissions: authPermissions,
      permissionsLoading,
      company:
        company?.id != null && Number(company.id) === activeCompanyId
          ? company
          : undefined,
    }).then((items) => {
      setSidebarItems(items);
      setIsLoading(false);
      console.debug("Dashboard: Fetched sidebar items:", items);
    });
  }, [activeCompanyId, company, user, authPermissions, permissionsLoading]);

  // Show loading state while permissions are being fetched
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-7 w-7 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-sm text-gray-600">Loading your modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header banner */}

      <PageHeader
        title="Sunway ERP"
        description="Comprehensive Business Management Solution"
        variant="default"
        icon={<Building className="w-5 h-5" />}
      />

      {/* Fallback when no modules are available */}
      {sidebarItems.length === 0 && (
        <div className="mb-6">
          <Card>
            <CardContent className="py-6 text-center text-xs text-muted-foreground">
              No modules available for this company or your current permissions.
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Sections */}
      <div className="space-y-12">
        {sidebarItems.map((item) => {
          const theme = getSystemTheme(item.title);
          const systemSubtitle = getSystemSubtitle(item.title);

          return (
            <div key={item.title} className="space-y-6">
              {/* System Header */}
              <div
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg",
                  theme.bgColor,
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    theme.iconBg,
                  )}
                >
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={cn("text-xl font-semibold", theme.textColor)}>
                    Sunway {item.title} System
                  </h2>
                  <p className="text-xs text-gray-600 mt-1 capitalize">
                    {systemSubtitle}
                  </p>
                </div>
              </div>

              {/* Module Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {item.items.map((subItem) => {
                  const ModuleIcon = getModuleIcon(subItem.title, subItem.icon);
                  const description = getModuleDescription(subItem.title);

                  return (
                    <Card
                      key={subItem.title}
                      onClick={() => navigate(subItem.url)}
                      className={cn(
                        "hover:shadow-lg transition-all cursor-pointer flex flex-col h-full",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        "border-2",
                        theme.borderColor,
                        theme.hoverBorderColor,
                      )}
                    >
                      <CardHeader className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg", theme.bgColor)}>
                            <ModuleIcon
                              className={cn("w-4 h-4", theme.textColor)}
                            />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base font-semibold mb-2">
                              {subItem.title}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div
                          className={cn(
                            "w-full rounded-md font-medium text-center py-2 px-4 text-xs",
                            theme.buttonBg,
                            theme.buttonText,
                          )}
                        >
                          {item.title.toUpperCase()} MODULE
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
