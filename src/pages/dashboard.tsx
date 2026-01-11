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
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for modules
const getModuleIcon = (title: string, defaultIcon: any) => {
  const iconMap: Record<string, any> = {
    "HR Analytics": BarChart3,
    "Employee Overview": Users,
    "HR Reports": FileText,
    "HR Settings": Settings,
    "Inventory Report": FileText,
    "Inventory (Stocks)": BarChart3,
    Sales: DollarSign,
    Purchase: ShoppingCart,
    "Inventory Settings": Settings,
    "Finance Reports": BarChart3,
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
    "HR Analytics":
      "Comprehensive HR metrics, workforce insights, and data-driven decision making.",
    "Employee Overview":
      "Complete employee profiles, organizational structure, and staff directory.",
    "HR Reports":
      "Generate detailed reports on attendance, performance, and compliance.",
    "HR Settings":
      "Configure departments, positions, benefits, and HR policies.",
    "Inventory Report":
      "Real-time stock reports, valuation analysis, and movement tracking.",
    "Inventory (Stocks)":
      "Manage stock levels, warehouses, and inventory adjustments.",
    Sales:
      "Sales orders, invoicing, customer management, and revenue tracking.",
    Purchase:
      "Purchase orders, supplier management, and procurement workflows.",
    "Inventory Settings":
      "Configure categories, units, warehouses, and inventory parameters.",
    "Finance Reports":
      "Financial statements, P&L, balance sheets, and cash flow analysis.",
    "Accounts Receivable":
      "Customer invoices, payments received, and aging reports.",
    "Accounts Payable":
      "Supplier bills, payment processing, and payables management.",
    "General Ledger":
      "Chart of accounts, journal entries, and financial transactions.",
    "Employee Payroll":
      "Salary processing, deductions, tax calculations, and payslips.",
    "Finance Settings":
      "Configure fiscal periods, currencies, tax rates, and accounting rules.",
  };
  return descriptions[title] || "Access module features and settings.";
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
    return "Complete human resource and payroll management";
  } else if (title.toLowerCase().includes("inventory")) {
    return "Advanced inventory and supply chain management";
  } else if (title.toLowerCase().includes("finance")) {
    return "Complete financial management and accounting";
  }
  return "Business management solutions";
};

const Dashboard = () => {
  const { user } = useAuth();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.companyId) {
      getSidebarItems(user.companyId).then((items) => {
        setSidebarItems(items);
      });
    }
  }, [user]);

  return (
    <div className="p-6">
      {/* Main Title Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Sunway ERP Modules
        </h1>
        <p className="text-lg text-gray-600">
          Comprehensive business management solutions
        </p>
      </div>

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
                  theme.bgColor
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    theme.iconBg
                  )}
                >
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={cn("text-2xl font-semibold", theme.textColor)}>
                    Sunway {item.title} System
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{systemSubtitle}</p>
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
                        theme.hoverBorderColor
                      )}
                    >
                      <CardHeader className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg", theme.bgColor)}>
                            <ModuleIcon
                              className={cn("w-5 h-5", theme.textColor)}
                            />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold mb-2">
                              {subItem.title}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div
                          className={cn(
                            "w-full rounded-md font-medium text-center py-2 px-4",
                            theme.buttonBg,
                            theme.buttonText
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
