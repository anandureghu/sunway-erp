import { toast } from "sonner";
import { apiClient } from "./apiClient";
import type { Company, SidebarItem } from "@/types/company";
import {
  Users,
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
} from "lucide-react";

export const fetchCompany = async (id: string) => {
  try {
    const res = await apiClient.get(`/companies/${id}`);
    return res.data;
  } catch (err) {
    console.error("fetchCompany:", err);
    toast.error("Failed to load company");
  }
};

export const getAllCompanies = async () => {
  try {
    const res = await apiClient.get("/companies");
    return res.data;
  } catch (err) {
    console.error("getAllCompanies:", err);
    toast.error("Failed to load companies");
  }
};

export const getSidebarItems = async (
  companyId: string
): Promise<SidebarItem[]> => {
  const company: Company = await fetchCompany(companyId);
  if (company) {
    return [
      ...(company.hrEnabled
        ? [
            {
              title: "HR and Payroll",
              icon: Users,
              color: "text-yellow-500",
              image: "/assets/images/hr.svg",
              url: "/hr/dashboard",
              items: [
                {
                  title: "HR Analytics",
                  url: "/hr/dashboard",
                  icon: Users,
                },
                // Employee Overview
                {
                  title: "Employee Overview",
                  url: "/hr/employees",
                  icon: Users,
                },

                // Core HR Functions
                {
                  title: "HR Reports",
                  url: "/hr/reports",
                  icon: FileSpreadsheet,
                },
                { title: "HR Settings", url: "/hr/settings", icon: Settings },
              ],
            },
          ]
        : []),
      ...(company.inventoryEnabled
        ? [
            {
              title: "Inventory",
              icon: Package,
              color: "text-amber-700",
              image: "/assets/images/inventory.svg",
              url: "/inventory/dashboard",
              items: [
                {
                  title: "Inventory Report",
                  url: "/inventory/reports",
                  icon: FileText,
                },
                {
                  title: "Inventory (Stocks)",
                  url: "/inventory/stocks",
                  icon: Package,
                },
                { title: "Sales", url: "/inventory/sales", icon: ShoppingCart },
                {
                  title: "Purchase",
                  url: "/inventory/purchase",
                  icon: Receipt,
                },
                {
                  title: "Inventory Settings",
                  url: "/inventory/settings",
                  icon: Settings,
                },
              ],
            },
          ]
        : []),
      ...(company.financeEnabled
        ? [
            {
              title: "Finance",
              icon: DollarSign,
              color: "text-green-700",
              image: "/assets/images/finance.svg",
              url: "/finance/dashboard",
              items: [
                {
                  title: "Finance Reports",
                  url: "/finance/reports",
                  icon: PieChart,
                },
                {
                  title: "Accounts Receivable",
                  url: "/finance/receivable",
                  icon: Wallet,
                },
                {
                  title: "Accounts Payable",
                  url: "/finance/payable",
                  icon: Receipt,
                },
                {
                  title: "General Ledger",
                  url: "/finance/ledger",
                  icon: Landmark,
                },
                {
                  title: "Employee Payroll",
                  url: "/finance/payroll",
                  icon: Users,
                },
                {
                  title: "Finance Settings",
                  url: "/finance/settings",
                  icon: Settings,
                },
              ],
            },
          ]
        : []),
    ] as const;
  }
  return [];
};
