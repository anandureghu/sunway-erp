// Role names enum - matching backend role values
export const RoleName = {
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

export type RoleName = typeof RoleName[keyof typeof RoleName];

// Role with display label
export interface RoleOption {
  label: string;
  value: RoleName;
}

// Get all role options for dropdowns/selects
export const roleOptions: RoleOption[] = [
  { label: "User", value: RoleName.USER },
  { label: "Admin", value: RoleName.ADMIN },
  { label: "HR", value: RoleName.HR },
  { label: "Super Admin", value: RoleName.SUPER_ADMIN },
  { label: "Finance Manager", value: RoleName.FINANCE_MANAGER },
  { label: "Accountant", value: RoleName.ACCOUNTANT },
  { label: "AP/AR Clerk", value: RoleName.AP_AR_CLERK },
  { label: "Controller", value: RoleName.CONTROLLER },
  { label: "Auditor (External)", value: RoleName.AUDITOR_EXTERNAL },
];

// Helper to get display label from role value
export const getRoleLabel = (role: RoleName | string): string => {
  const option = roleOptions.find(opt => opt.value === role);
  return option?.label ?? role;
};

// Helper to get role value from display label
export const getRoleValue = (label: string): RoleName | undefined => {
  const option = roleOptions.find(opt => opt.label.toLowerCase() === label.toLowerCase());
  return option?.value;
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
  module: string;
  viewOwn: boolean;
  viewAll: boolean;
  createPermission: boolean;
  editPermission: boolean;
  deletePermission: boolean;
  approve: boolean;
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
  permissions: ModulePermission[];
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
export const createEmptyModulePermission = (module: ModuleName): ModulePermission => ({
  module,
  viewOwn: false,
  viewAll: false,
  createPermission: false,
  editPermission: false,
  deletePermission: false,
  approve: false,
});

// Get all modules with empty permissions
export const createEmptyPermissions = (): ModulePermission[] => 
  Object.values(ModuleName).map(module => createEmptyModulePermission(module));
