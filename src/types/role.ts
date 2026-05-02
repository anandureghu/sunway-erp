// ─────────────────────────────────────────────────────────────────────────────
// SECURITY ROLES  (Spring Security enum — for permissions/access only)
// Never use these for display, appraisals, org chart, or filtering
// ─────────────────────────────────────────────────────────────────────────────

export const SecurityRole = {
  USER: "USER",
  ADMIN: "ADMIN",
  HR: "HR",
  SUPER_ADMIN: "SUPER_ADMIN",
  FINANCE_MANAGER: "FINANCE_MANAGER",
  ACCOUNTANT: "ACCOUNTANT",
  AP_AR_CLERK: "AP_AR_CLERK",
  CONTROLLER: "CONTROLLER",
  AUDITOR_EXTERNAL: "AUDITOR_EXTERNAL",
} as const;

export type SecurityRole = typeof SecurityRole[keyof typeof SecurityRole];

// Security role to display label mapping
const SECURITY_ROLE_LABELS: Record<string, string> = {
  USER: "User",
  ADMIN: "Admin",
  HR: "HR",
  SUPER_ADMIN: "Super Admin",
  FINANCE_MANAGER: "Finance Manager",
  ACCOUNTANT: "Accountant",
  AP_AR_CLERK: "AP/AR Clerk",
  CONTROLLER: "Controller",
  AUDITOR_EXTERNAL: "External Auditor",
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY ROLES  (Dynamic — fetched from /api/roles?companyId=X)
// Use these for appraisals, org chart, display, filtering, employee assignment
// ─────────────────────────────────────────────────────────────────────────────

/** A single company role returned from the backend */
export interface CompanyRole {
  id: number;
  name: string; // "HR Manager", "Finance Lead" etc.
  description?: string;
  active?: boolean; // Make optional to match API response
  companyId: number;
  createdDate?: string;
  updatedDate?: string;
}

/** Lightweight option for dropdowns / selects */
export interface RoleOption {
  label: string; // display text  → role.name
  value: string; // stored value  → role.name (NOT id, so it matches user.companyRole)
}

/** Convert CompanyRole list from API into dropdown options */
export const toRoleOptions = (roles: CompanyRole[]): RoleOption[] =>
  roles
    .filter((r) => r.active)
    .map((r) => ({ label: r.name, value: r.name }));

/**
 * Fallback options — used ONLY when the API hasn't loaded yet.
 * These mirror the default roles seeded in V4 migration.
 * Replace with real API data as soon as possible — don't rely on this.
 */
export const fallbackRoleOptions: RoleOption[] = [
  { label: "Admin", value: "Admin" },
  { label: "Super Admin", value: "Super Admin" },
  { label: "HR", value: "HR" },
  { label: "Employee", value: "Employee" },
  { label: "Finance Manager", value: "Finance Manager" },
  { label: "Accountant", value: "Accountant" },
  { label: "AP/AR Clerk", value: "AP/AR Clerk" },
  { label: "Controller", value: "Controller" },
  { label: "External Auditor", value: "External Auditor" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULES - All module names in SCREAMING_SNAKE_CASE
// ─────────────────────────────────────────────────────────────────────────────

export const ModuleName = {
  EMPLOYEE_PROFILE: "EMPLOYEE_PROFILE",
  CURRENT_JOB: "CURRENT_JOB",
  SALARY: "SALARY",
  LEAVES: "LEAVES",
  LOANS: "LOANS",
  DEPENDENTS: "DEPENDENTS",
  APPRAISAL: "APPRAISAL",
  IMMIGRATION: "IMMIGRATION",
  HR_REPORTS: "HR_REPORTS",
  HR_SETTINGS: "HR_SETTINGS",
} as const;

export type ModuleName = typeof ModuleName[keyof typeof ModuleName];

/** Module display names for UI */
export const moduleDisplayNames: Record<string, string> = {
  EMPLOYEE_PROFILE: "Employee Profile",
  CURRENT_JOB: "Current Job",
  SALARY: "Salary",
  LEAVES: "Leaves",
  LOANS: "Loans",
  DEPENDENTS: "Dependents",
  APPRAISAL: "Appraisal",
  IMMIGRATION: "Immigration",
  HR_REPORTS: "HR Reports",
  HR_SETTINGS: "HR Settings",
};

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION TYPES - All keys in camelCase
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flat permission structure matching backend PermissionRecord.
 * This is the canonical structure used throughout the app.
 */
export interface PermissionRecord {
  id?: number;
  module: string; // e.g., "EMPLOYEE_PROFILE"
  viewOwn?: boolean;
  viewAll?: boolean;
  createPermission?: boolean;
  editPermission?: boolean;
  deletePermission?: boolean;
  approve?: boolean;
}

/**
 * Type-safe module capabilities structure.
 * Frontend works with this structure for UI operations.
 */
export type CapKey = "viewOwn" | "viewAll" | "create" | "edit" | "delete" | "approve";

export interface ModuleCaps {
  viewOwn: boolean;
  viewAll: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
}

/** All capabilities by module */
export interface AllCaps {
  [module: string]: ModuleCaps;
}

/**
 * Permission capabilities - flat structure for frontend.
 * Used for role-based and employee-specific permissions.
 */
export interface Permission {
  viewOwn: boolean;
  viewAll: boolean;
  create: boolean;
  edit: boolean;
  deletePermission: boolean;
  approve: boolean;
}

/**
 * Module permission with employee relationship.
 * Matches backend ModulePermission structure.
 */
export interface ModulePermission {
  permission: any;
  id?: number;
  module: string;
  viewOwn?: boolean;
  viewAll?: boolean;
  createPermission?: boolean;
  editPermission?: boolean;
  deletePermission?: boolean;
  approve?: boolean;
  employeeId?: number;
  user?: number;
  // Employee object returned from backend when fetching employee-specific permissions
  employee?: {
    id: number;
    employeeNo: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/** Permission rule for staff/employee */
export interface PermissionRule {
  id?: number;
  roleId?: number;
  roleName?: string;
  staffId?: number;
  staffName?: string;
  staffEmail?: string;
  staffPhone?: string;
  permissions: ModulePermission[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Role with permissions */
export interface Role {
  id?: number;
  name: string;
  description?: string;
  custom: boolean;
  permissions?: ModulePermission[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  companyId?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API REQUEST/RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: ModulePermission[];
  companyId?: number;
  active?: boolean;
}

export interface UpdateRoleRequest extends Partial<CreateRoleRequest> {
  id: number;
  active?: boolean;
}

export interface CreatePermissionRuleRequest {
  roleId?: number;
  staffId?: number;
  permissions: ModulePermission[];
  active?: boolean;
}

export interface UpdatePermissionRuleRequest extends Partial<CreatePermissionRuleRequest> {
  id: number;
  active?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS - Permission Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an empty permission with all flags set to false
 */
export const createEmptyPermission = (): Permission => ({
  viewOwn: false,
  viewAll: false,
  create: false,
  edit: false,
  deletePermission: false,
  approve: false,
});

/**
 * Create an empty module permission
 */
export const createEmptyModulePermission = (module: string): ModulePermission => ({
  module,
  viewOwn: false,
  viewAll: false,
  createPermission: false,
  editPermission: false,
  deletePermission: false,
  approve: false,
  permission: undefined
});

/**
 * Create empty permissions for all modules
 */
export const createEmptyPermissions = (): ModulePermission[] =>
  Object.values(ModuleName).map((module) => createEmptyModulePermission(module));

/**
 * Create empty caps structure for all modules
 */
export const createEmptyCaps = (): AllCaps =>
  Object.values(ModuleName).reduce(
    (acc, module) => ({
      ...acc,
      [module]: {
        viewOwn: false,
        viewAll: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
      },
    }),
    {} as AllCaps,
  );

/**
 * Get display label for a role string
 */
export const getRoleLabel = (companyRole: string | null | undefined): string => {
  if (!companyRole) return "—";
  return companyRole; // companyRole IS the label — no mapping needed
};

/**
 * Use this anywhere you need to show a user's role in the UI.
 * Prefers companyRole (human readable), falls back to securityRole (enum).
 */
export const displayRole = (
  companyRole: string | null | undefined,
  securityRole: SecurityRole | string | null | undefined,
): string => {
  if (companyRole) return companyRole;
  if (securityRole) {
    // Try to find a human-readable label for the security role
    const normalizedRole = String(securityRole).toUpperCase();
    return SECURITY_ROLE_LABELS[normalizedRole] || normalizedRole.replace(/_/g, " ");
  }
  return "—";
};

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION ACTIONS FOR UI
// ─────────────────────────────────────────────────────────────────────────────

export const permissionActions = [
  { key: "viewOwn", label: "View Own", description: "Can view own records" },
  { key: "viewAll", label: "View All", description: "Can view all records" },
  { key: "create", label: "Create", description: "Can create new records" },
  { key: "edit", label: "Edit", description: "Can edit records" },
  { key: "delete", label: "Delete", description: "Can delete records" },
  { key: "approve", label: "Approve", description: "Can approve requests" },
] as const;

export type PermissionAction = typeof permissionActions[number]["key"];