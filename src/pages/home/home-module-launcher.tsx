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
  Users,
  FileText,
  Settings,
  ShoppingCart,
  Wallet,
  DollarSign,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const getModuleIcon = (title: string, defaultIcon: React.ComponentType<{ className?: string }>) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "Employee Overview": Users,
    "HR Reports": FileText,
    "Immigration Expiry": ShieldAlert,
    "HR Settings": Settings,
    "Operations and management Reports": FileText,
    "Operations Reports": FileText,
    "Management Reports": FileText,
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

const getModuleDescription = (title: string): string => {
  const descriptions: Record<string, string> = {
    "Employee Overview":
      "Manage employee lifecycle management from hiring to retirement",
    "Employee Payroll":
      "Administer employee Compensation and payroll processes",
    "HR Reports":
      "Manage Operations and management Reports on HR metrics and performance",
    "Immigration Expiry":
      "Passports and residence permits that are expired or expiring soon.",
    "HR Settings":
      "Configure leave types, establish HR policies, define job codes, set up departments, manage system roles, manage appraisals and control system permissions",
    "Inventory (Stocks)":
      "Manage Stocks levels, perform Inventory Adjustments and, receive goods.",
    Sales:
      "Handle Sales transactions, manage sales invoices and maintain customer information. Perform order fulfillment and track shipments",
    Purchase:
      "Execute the procurement workflow, including purchase requisitions, purchase orders, receiving goods, viewing and matching invoices, and processing payment receipts.",
    "Operations and management Reports": "Operations and management reports",
    "Operations Reports": "Daily operations and stock movement reports",
    "Management Reports": "Valuation, turnover, and management analytics",
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
  }
  if (title.toLowerCase().includes("inventory")) {
    return {
      bgColor: "bg-green-50",
      iconBg: "bg-gradient-to-br from-green-500 to-green-600",
      textColor: "text-green-700",
      buttonBg: "bg-green-50",
      buttonText: "text-green-700",
      borderColor: "border-green-200",
      hoverBorderColor: "hover:border-green-300",
    };
  }
  if (title.toLowerCase().includes("finance")) {
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

const getSystemSubtitle = (title: string): string => {
  if (title.toLowerCase().includes("hr")) {
    return "Human resource and payroll management";
  }
  if (title.toLowerCase().includes("inventory")) {
    return "Inventory and supply chain management";
  }
  if (title.toLowerCase().includes("finance")) {
    return "Financial management and accounting";
  }
  return "Business management solutions";
};

export function HomeModuleLauncher() {
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
      company:
        company?.id != null && Number(company.id) === activeCompanyId
          ? company
          : undefined,
    }).then((items) => {
      setSidebarItems(items);
      setIsLoading(false);
    });
  }, [activeCompanyId, company, user, authPermissions, permissionsLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (sidebarItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-xs text-muted-foreground">
          No modules available for this company or your current permissions.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      {sidebarItems.map((item) => {
        const theme = getSystemTheme(item.title);
        const systemSubtitle = getSystemSubtitle(item.title);

        return (
          <div key={item.title} className="space-y-6">
            <div
              className={cn(
                "flex items-center gap-4 rounded-lg p-4",
                theme.bgColor,
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  theme.iconBg,
                )}
              >
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className={cn("text-xl font-semibold", theme.textColor)}>
                  Sunway {item.title} System
                </h2>
                <p className="mt-1 text-xs capitalize text-gray-600">
                  {systemSubtitle}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {item.items.map((subItem) => {
                const ModuleIcon = getModuleIcon(subItem.title, subItem.icon);
                const description = getModuleDescription(subItem.title);

                return (
                  <Card
                    key={subItem.title}
                    onClick={() => navigate(subItem.url)}
                    className={cn(
                      "flex h-full cursor-pointer flex-col transition-all hover:shadow-lg",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      "border-2",
                      theme.borderColor,
                      theme.hoverBorderColor,
                    )}
                  >
                    <CardHeader className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className={cn("rounded-lg p-2", theme.bgColor)}>
                          <ModuleIcon
                            className={cn("h-4 w-4", theme.textColor)}
                          />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="mb-2 text-base font-semibold">
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
                          "w-full rounded-md px-4 py-2 text-center text-xs font-medium",
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
  );
}
