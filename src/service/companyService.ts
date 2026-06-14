import { toast } from "sonner";
import { apiClient } from "./apiClient";
import type { SidebarItem } from "@/types/company";
import {
  Users,
  FileSpreadsheet,
  ShieldAlert,
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

export const fetchCompany = async (
  id: string,
  options?: { silent?: boolean },
) => {
  try {
    const res = await apiClient.get(`/companies/${id}`);
    return res.data;
  } catch (err) {
    console.error("fetchCompany:", err);
    if (!options?.silent) {
      toast.error("Failed to load company");
    }
    return undefined;
  }
};

// ── HR policies (leave accrual + retirement compensation + loan policy) ─────
export interface HrPoliciesPayload {
  annualLeaveAccrualEnabled?: boolean;
  annualLeaveAccrualDaysPerMonth?: number;
  minServiceMonthsForAnnualLeave?: number;
  retirementCompensationEnabled?: boolean;
  retirementCompensationMonthsPerYear?: number;
  loanPolicyEnabled?: boolean;
  loanMinServiceDays?: number;
  loanMaxRepaymentMonths?: number;
}

export const fetchHrPolicies = async (
  companyId: number | string,
): Promise<HrPoliciesPayload> => {
  const res = await apiClient.get<HrPoliciesPayload>(
    `/companies/${companyId}/hr-policies`,
  );
  return res.data;
};

export const updateHrPolicies = async (
  companyId: number | string,
  payload: HrPoliciesPayload,
): Promise<HrPoliciesPayload> => {
  const res = await apiClient.put<HrPoliciesPayload>(
    `/companies/${companyId}/hr-policies`,
    payload,
  );
  return res.data;
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

/**
 * Check if user has permission to view a module
 *
 * @param permissions - Converted frontend format: { MODULE_NAME: { view_own, view_all, ... } }
 * @param module - Module name to check (e.g., "EMPLOYEE_PROFILE")
 * @returns true if user has view_own or view_all permission
 */
export function canView(
  permissions: Record<string, any> | null | undefined,
  module: string,
): boolean {
  // ADMIN bypass - null means admin has full access
  if (permissions === null) {
    console.debug(`✅ canView("${module}"): ADMIN bypass`);
    return true;
  }

  // LOADING state - permissions not yet fetched
  if (permissions === undefined) {
    console.debug(
      `⏳ canView("${module}"): Permissions loading - allowing for now`,
    );
    return true; // Show during loading, will be filtered after
  }

  // Empty permissions object
  if (
    typeof permissions === "object" &&
    Object.keys(permissions).length === 0
  ) {
    console.debug(`❌ canView("${module}"): No permissions granted`);
    return false;
  }

  // Normalize module name to match permission keys
  const moduleKey = module
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .replace(/^_+|_+$/g, "");

  console.debug(
    `🔍 canView("${module}"): Looking for key "${moduleKey}" in permission keys:`,
    Object.keys(permissions).slice(0, 5) +
      (Object.keys(permissions).length > 5 ? "..." : ""),
  );

  // Get module permissions
  let modPerms = permissions[moduleKey];

  // Try alternate formats if exact match not found
  if (!modPerms) {
    const alternateKey = module.toLowerCase().replace(/\s+/g, "_");
    modPerms = permissions[alternateKey];
  }

  if (!modPerms) {
    modPerms = permissions[module];
  }

  if (!modPerms) {
    console.debug(`❌ canView("${module}"): Module not found in permissions`);
    return false;
  }

  // Check both viewOwn and viewAll - handle both camelCase and snake_case
  const hasViewOwnPermission = !!(
    modPerms.view_own ||
    modPerms.viewOwn ||
    modPerms.VIEW_OWN
  );

  const hasViewAllPermission = !!(
    modPerms.view_all ||
    modPerms.viewAll ||
    modPerms.VIEW_ALL
  );

  const canAccess = hasViewOwnPermission || hasViewAllPermission;

  console.debug(
    `✅ canView("${module}"): view_own=${hasViewOwnPermission}, view_all=${hasViewAllPermission}, result=${canAccess}`,
  );

  return canAccess;
}

export const getSidebarItems = async (
  companyId: string,
  options?: {
    skipPermissions?: boolean;
    permissions?: Record<string, any> | null;
    permissionsLoading?: boolean;
    company?: {
      hrEnabled?: boolean;
      inventoryEnabled?: boolean;
      financeEnabled?: boolean;
    } | null;
  },
): Promise<SidebarItem[]> => {
  const permissions = options?.skipPermissions ? null : options?.permissions;
  const isLoadingPermissions = options?.permissionsLoading ?? false;

  console.debug("📋 getSidebarItems called:", {
    companyId,
    skipPermissions: options?.skipPermissions,
    permissionsLoading: isLoadingPermissions,
    hasPermissions: !!permissions,
    permissionKeys:
      permissions && typeof permissions === "object"
        ? Object.keys(permissions).slice(0, 5)
        : "N/A",
  });

  const company =
    options?.company ??
    (await fetchCompany(companyId, { silent: true }));
  if (!company) {
    console.warn("❌ Company not found");
    return [];
  }

  console.debug("✅ Company loaded:", {
    hrEnabled: company.hrEnabled,
    inventoryEnabled: company.inventoryEnabled,
    financeEnabled: company.financeEnabled,
  });

  return [
    // ── HR and Payroll ────────────────────────────────────────────────────────
    ...(company.hrEnabled
      ? [
          {
            title: "HR and Payroll",
            icon: Users,
            color: "text-yellow-500",
            image: "/assets/images/hr.svg",
            url: "/hr/dashboard",
            items: [
              // Employee Overview — gated by EMPLOYEE_PROFILE
              ...(canView(permissions, "EMPLOYEE_PROFILE")
                ? [
                    {
                      title: "Employee Overview",
                      url: "/hr/employees",
                      icon: Users,
                    },
                  ]
                : []),

              {
                title: "Payroll",
                url: "/hr/payroll",
                icon: Wallet,
              },

              // HR Reports — gated by HR_REPORTS
              ...(canView(permissions, "HR_REPORTS")
                ? [
                    {
                      title: "HR Reports",
                      url: "/hr/reports",
                      icon: FileSpreadsheet,
                    },
                  ]
                : []),

              // Immigration Expiry — gated by IMMIGRATION (VIEW_ALL on backend)
              ...(canView(permissions, "IMMIGRATION")
                ? [
                    {
                      title: "Immigration Expiry",
                      url: "/hr/immigration-expiry",
                      icon: ShieldAlert,
                    },
                  ]
                : []),

              // HR Settings — gated by HR_SETTINGS
              ...(canView(permissions, "HR_SETTINGS")
                ? [
                    {
                      title: "HR Settings",
                      url: "/hr/settings",
                      icon: Settings,
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),

    // ── Inventory ─────────────────────────────────────────────────────────────
    ...(company.inventoryEnabled
      ? (() => {
          const inventoryItems = [
            ...(canView(permissions, "INVENTORY_STOCK") ||
            canView(permissions, "INVENTORY_ITEM")
              ? [
                  {
                    title: "Inventory (Stocks)",
                    url: "/inventory/stocks",
                    icon: Package,
                  },
                ]
              : []),
            ...(canView(permissions, "INVENTORY_SALES")
              ? [{ title: "Sales", url: "/inventory/sales", icon: ShoppingCart }]
              : []),
            ...(canView(permissions, "INVENTORY_PURCHASE")
              ? [{ title: "Purchase", url: "/inventory/purchase", icon: Receipt }]
              : []),
            ...(canView(permissions, "INVENTORY_STOCK")
              ? [
                  {
                    title: "Inventory Reports",
                    url: "/inventory/reports",
                    icon: FileText,
                  },
                ]
              : []),
            ...(canView(permissions, "INVENTORY_CATEGORY") ||
            canView(permissions, "INVENTORY_WAREHOUSE") ||
            canView(permissions, "INVENTORY_PURCHASE") ||
            canView(permissions, "INVENTORY_SALES")
              ? [
                  {
                    title: "Inventory Settings",
                    url: "/inventory/settings",
                    icon: Settings,
                  },
                ]
              : []),
          ];

          if (inventoryItems.length === 0) return [];

          return [
            {
              title: "Inventory",
              icon: Package,
              color: "text-amber-700",
              image: "/assets/images/inventory.svg",
              url: "/inventory/dashboard",
              items: inventoryItems,
            },
          ];
        })()
      : []),

    // ── Finance ───────────────────────────────────────────────────────────────
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
                title: "Employee Payroll",
                url: "/finance/payroll",
                icon: Users,
              },
              {
                title: "General Ledger",
                url: "/finance/ledger",
                icon: Landmark,
              },
              {
                title: "Finance Report",
                url: "/finance/reports",
                icon: PieChart,
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
  ] as SidebarItem[];
};

export const getVisibleEmployeeSubModules = (
  permissions: Record<string, any> | null | undefined,
  empBase: string | null,
) => {
  const all = [
    {
      title: "Profile",
      icon: UserRound,
      module: "EMPLOYEE_PROFILE",
      to: empBase ? `${empBase}/profile` : "#",
    },
    {
      title: "Current Job",
      icon: BriefcaseBusiness,
      module: "CURRENT_JOB",
      to: empBase ? `${empBase}/current-job` : "#",
    },
    {
      title: "Salary",
      icon: DollarSign,
      module: "SALARY",
      to: empBase ? `${empBase}/salary` : "#",
    },
    {
      title: "Leaves",
      icon: CalendarDays,
      module: "LEAVES",
      to: empBase ? `${empBase}/leaves` : "#",
    },
    {
      title: "Loans",
      icon: CreditCard,
      module: "LOANS",
      to: empBase ? `${empBase}/loans` : "#",
    },
    {
      title: "Dependents",
      icon: Users,
      module: "DEPENDENTS",
      to: empBase ? `${empBase}/dependents` : "#",
    },
    {
      title: "Appraisal",
      icon: Star,
      module: "APPRAISAL",
      to: empBase ? `${empBase}/appraisal` : "#",
    },
    {
      title: "Immigration",
      icon: Shield,
      module: "IMMIGRATION",
      to: empBase ? `${empBase}/immigration` : "#",
    },
  ];

  return all.filter((sm) => canView(permissions, sm.module));
};
