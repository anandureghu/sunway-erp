// ─────────────────────────────────────────────────────────────────────────────
// SECURITY ROLES  (Spring Security enum — for permissions/access only)
// Never use these for display, appraisals, org chart, or filtering
// ─────────────────────────────────────────────────────────────────────────────

export const SecurityRole = {
  USER:             "USER",
  ADMIN:            "ADMIN",
  HR:               "HR",
  SUPER_ADMIN:      "SUPER_ADMIN",
  FINANCE_MANAGER:  "FINANCE_MANAGER",
  ACCOUNTANT:       "ACCOUNTANT",
  AP_AR_CLERK:      "AP_AR_CLERK",
  CONTROLLER:       "CONTROLLER",
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
  id:           number;
  name:         string;        // "HR Manager", "Finance Lead" etc.
  description?: string;
  active?:      boolean;       // Make optional to match API response
  companyId:    number;
  createdDate?: string;
  updatedDate?: string;
}

/** Lightweight option for dropdowns / selects */
export interface RoleOption {
  label: string;   // display text  → role.name
  value: string;   // stored value  → role.name (NOT id, so it matches user.companyRole)
}

/** Convert CompanyRole list from API into dropdown options */
export const toRoleOptions = (roles: CompanyRole[]): RoleOption[] =>
  roles
    .filter(r => r.active)
    .map(r => ({ label: r.name, value: r.name }));

/**
 * Fallback options — used ONLY when the API hasn't loaded yet.
 * These mirror the default roles seeded in V4 migration.
 * Replace with real API data as soon as possible — don't rely on this.
 */
export const fallbackRoleOptions: RoleOption[] = [
  { label: "Admin",            value: "Admin" },
  { label: "Super Admin",      value: "Super Admin" },
  { label: "HR",              value: "HR" },
  { label: "Employee",        value: "Employee" },
  { label: "Finance Manager", value: "Finance Manager" },
  { label: "Accountant",      value: "Accountant" },
  { label: "AP/AR Clerk",     value: "AP/AR Clerk" },
  { label: "Controller",       value: "Controller" },
  { label: "External Auditor", value: "External Auditor" },
];

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get display label for a companyRole string.
 * Falls back to the raw value if not found in options.
 *
 * Usage: getRoleLabel("HR")  → "HR"
 *        getRoleLabel("Finance Manager") → "Finance Manager"
 */
export const getRoleLabel = (companyRole: string | null | undefined): string => {
  if (!companyRole) return "—";
  return companyRole; // companyRole IS the label — no mapping needed
};

/**
 * Use this anywhere you need to show a user's role in the UI.
 * Prefers companyRole (human readable), falls back to securityRole (enum).
 *
 * Usage: displayRole(user.companyRole, user.role)  → "HR Manager"
 */
export const displayRole = (
  companyRole: string | null | undefined,
  securityRole: SecurityRole | string | null | undefined
): string => {
  if (companyRole) return companyRole;
  if (securityRole) {
    // Try to find a human-readable label for the security role
    const normalizedRole = String(securityRole).toUpperCase();
    return SECURITY_ROLE_LABELS[normalizedRole] || normalizedRole.replace(/_/g, " ");
  }
  return "—";
};

// Module names matching backend enum
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

// Module display names for UI
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

// Permission capabilities (flat structure for frontend)
export interface Permission {
  viewOwn: boolean;
  viewAll: boolean;
  create: boolean;
  edit: boolean;
  deletePermission: boolean;
  approve: boolean;
}

// Module permission map - using flat properties for frontend
export interface ModulePermission {
  permission?: {
    viewOwn?: boolean;
    viewAll?: boolean;
    create?: boolean;
    edit?: boolean;
    deletePermission?: boolean;
    approve?: boolean;
  };
  module?: string;
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

// Role with permissions
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

// Permission rule for staff/employee
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

// API request/response types
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

// Helper to create empty permission
export const createEmptyPermission = (): Permission => ({
  viewOwn: false,
  viewAll: false,
  create: false,
  edit: false,
  deletePermission: false,
  approve: false,
});

// Helper to create empty module permission
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

// Get all modules with empty permissions
export const createEmptyPermissions = (): ModulePermission[] => 
  Object.values(ModuleName).map(module => createEmptyModulePermission(module));

// Permission actions for UI
export const permissionActions = [
  { key: "viewOwn", label: "View Own", description: "Can view own records" },
  { key: "viewAll", label: "View All", description: "Can view all records" },
  { key: "createPermission", label: "Create", description: "Can create new records" },
  { key: "editPermission", label: "Edit", description: "Can edit records" },
  { key: "deletePermission", label: "Delete", description: "Can delete records" },
  { key: "approve", label: "Approve", description: "Can approve requests" },
] as const;

export type PermissionAction = typeof permissionActions[number]["key"];

