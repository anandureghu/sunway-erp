import { toast } from "sonner";
import { apiClient } from "./apiClient";
import type { Company, SidebarItem } from "@/types/company";
import type { ModulePermission } from "@/types/role";
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
  UserRound,
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  Star,
  Shield,
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

// ── Permission helper ─────────────────────────────────────────────────────────

/**
 * Fetch current user's permissions from backend.
 * Returns empty array on failure so sidebar degrades gracefully.
 */
export async function fetchMyPermissions(): Promise<ModulePermission[]> {
  try {
    const res = await apiClient.get<ModulePermission[]>(
      "/role-permissions/my-permissions"
    );
    return res.data || [];
  } catch {
    return [];
  }
}

/**
 * Returns true if the user has at least VIEW_OWN or VIEW_ALL for a module.
 * If no permissions found at all (empty array) → allow everything (ADMIN/HR bypass).
 */
export function canView(permissions: ModulePermission[], module: string): boolean {
  if (permissions.length === 0) return true; // ADMIN bypass — no restrictions
  const p = permissions.find((x) => x.module === module);
  if (!p) return false;
  return p.viewOwn || p.viewAll;
}

export const getSidebarItems = async (
  companyId: string
): Promise<SidebarItem[]> => {

  const [company, permissions]: [Company, ModulePermission[]] =
    await Promise.all([fetchCompany(companyId), fetchMyPermissions()]);

  if (!company) return [];

  return [

    // ── HR and Payroll ────────────────────────────────────────────────────────
    ...(company.hrEnabled ? [{
      title: "HR and Payroll",
      icon: Users,
      color: "text-yellow-500",
      image: "/assets/images/hr.svg",
      url: "/hr/dashboard",
      items: [
        // HR Analytics — always visible if HR is enabled
        { title: "HR Analytics",      url: "/hr/dashboard",  icon: Users },

        // Employee Overview — gated by EMPLOYEE_PROFILE
        ...(canView(permissions, "EMPLOYEE_PROFILE") ? [{
          title: "Employee Overview", url: "/hr/employees",  icon: Users,
        }] : []),

        // HR Reports — gated by HR_REPORTS
        ...(canView(permissions, "HR_REPORTS") ? [{
          title: "HR Reports",        url: "/hr/reports",    icon: FileSpreadsheet,
        }] : []),

        // HR Settings — gated by HR_SETTINGS
        ...(canView(permissions, "HR_SETTINGS") ? [{
          title: "HR Settings",       url: "/hr/settings",   icon: Settings,
        }] : []),
      ],
    }] : []),

    // ── Inventory ─────────────────────────────────────────────────────────────
    ...(company.inventoryEnabled ? [{
      title: "Inventory",
      icon: Package,
      color: "text-amber-700",
      image: "/assets/images/inventory.svg",
      url: "/inventory/dashboard",
      items: [
        { title: "Inventory Report",    url: "/inventory/reports",   icon: FileText      },
        { title: "Inventory (Stocks)",  url: "/inventory/stocks",    icon: Package       },
        { title: "Sales",               url: "/inventory/sales",     icon: ShoppingCart  },
        { title: "Purchase",            url: "/inventory/purchase",  icon: Receipt       },
        { title: "Inventory Settings",  url: "/inventory/settings",  icon: Settings      },
      ],
    }] : []),

    // ── Finance ───────────────────────────────────────────────────────────────
    ...(company.financeEnabled ? [{
      title: "Finance",
      icon: DollarSign,
      color: "text-green-700",
      image: "/assets/images/finance.svg",
      url: "/finance/dashboard",
      items: [
        { title: "Finance Reports",      url: "/finance/reports",    icon: PieChart   },
        { title: "Accounts Receivable",  url: "/finance/receivable", icon: Wallet     },
        { title: "Accounts Payable",     url: "/finance/payable",    icon: Receipt    },
        { title: "General Ledger",       url: "/finance/ledger",     icon: Landmark   },
        { title: "Employee Payroll",     url: "/finance/payroll",    icon: Users      },
        { title: "Finance Settings",     url: "/finance/settings",    icon: Settings   },
      ],
    }] : []),

  ] as SidebarItem[];
};

// ── Employee sub-modules (used in AppSidebar) ─────────────────────────────────
// Export this so AppSidebar can filter sub-modules too

export const getVisibleEmployeeSubModules = (
  permissions: ModulePermission[],
  empBase: string | null
) => {
  const all = [
    { title: "Profile",      icon: UserRound,        module: "EMPLOYEE_PROFILE", to: empBase ? `${empBase}/profile`      : "#" },
    { title: "Current Job",  icon: BriefcaseBusiness,module: "CURRENT_JOB",      to: empBase ? `${empBase}/current-job`  : "#" },
    { title: "Salary",       icon: DollarSign,        module: "SALARY",           to: empBase ? `${empBase}/salary`       : "#" },
    { title: "Leaves",       icon: CalendarDays,      module: "LEAVES",           to: empBase ? `${empBase}/leaves`       : "#" },
    { title: "Loans",        icon: CreditCard,        module: "LOANS",            to: empBase ? `${empBase}/loans`        : "#" },
    { title: "Dependents",   icon: Users,             module: "DEPENDENTS",       to: empBase ? `${empBase}/dependents`   : "#" },
    { title: "Appraisal",    icon: Star,              module: "APPRAISAL",        to: empBase ? `${empBase}/appraisal`    : "#" },
    { title: "Immigration",  icon: Shield,            module: "IMMIGRATION",      to: empBase ? `${empBase}/immigration`  : "#" },
  ];

  return all.filter((sm) => canView(permissions, sm.module));
};
