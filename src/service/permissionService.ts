import { apiClient } from "./apiClient";
import {
  getPermissionCache,
  setPermissionCache,
  clearPermissionCache,
} from "./permissionCache";
import type {
  ModulePermission,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@/types/role";

// Module constants
export const MODULES = {
  APPRAISAL: "APPRAISAL",
  CURRENT_JOB: "CURRENT_JOB",
  DEPENDENTS: "DEPENDENTS",
  EMPLOYEE_PROFILE: "EMPLOYEE_PROFILE",
  HR_REPORTS: "HR_REPORTS",
  HR_SETTINGS: "HR_SETTINGS",
  IMMIGRATION: "IMMIGRATION",
  LEAVES: "LEAVES",
  LOANS: "LOANS",
  SALARY: "SALARY",
  PAYROLL: "PAYROLL",
  INVENTORY_CATEGORY: "INVENTORY_CATEGORY",
  INVENTORY_WAREHOUSE: "INVENTORY_WAREHOUSE",
  INVENTORY_STOCK: "INVENTORY_STOCK",
  INVENTORY_ITEM: "INVENTORY_ITEM",
  INVENTORY_PURCHASE: "INVENTORY_PURCHASE",
  INVENTORY_RECEIPT: "INVENTORY_RECEIPT",
  INVENTORY_SALES: "INVENTORY_SALES",
  FINANCE_COA: "FINANCE_COA",
  FINANCE_JOURNAL: "FINANCE_JOURNAL",
  FINANCE_LEDGER: "FINANCE_LEDGER",
  FINANCE_INVOICE: "FINANCE_INVOICE",
  FINANCE_PAYMENT: "FINANCE_PAYMENT",
  FINANCE_BUDGET: "FINANCE_BUDGET",
  FINANCE_RECONCILIATION: "FINANCE_RECONCILIATION",
  FINANCE_REPORTS: "FINANCE_REPORTS",
} as const;

// Backend returns a flat permission record with own/all create/edit/delete.
export type PermissionRecord = {
  employeeId: any;
  employee: any;
  id?: number;
  module: string;
  viewOwn?: boolean;
  viewAll?: boolean;
  createOwn?: boolean;
  createAll?: boolean;
  editOwn?: boolean;
  editAll?: boolean;
  deleteOwn?: boolean;
  deleteAll?: boolean;
  approve?: boolean;
  /** Whether the rule is enforced. When false it is saved but ignored. */
  active?: boolean;
};

type PermissionPayload = {
  module: string;
  permission: {
    viewOwn: boolean;
    viewAll: boolean;
    createOwn: boolean;
    createAll: boolean;
    editOwn: boolean;
    editAll: boolean;
    deleteOwn: boolean;
    deleteAll: boolean;
    approve: boolean;
  };
};


function normalizeModule(module: string) {
  return (module ?? "").toUpperCase().trim();
}

// Accepts a permission object in either camelCase (createOwn) or snake_case
// (create_own) form and produces the backend's own/all DTO.
function toBackendDTOs(permissions: Array<any>): PermissionPayload[] {
  return permissions.map((perm) => {
    const moduleRaw = perm.module ?? perm.moduleName ?? "";
    const p = perm.permission ?? perm;

    return {
      module: normalizeModule(moduleRaw),
      permission: {
        viewOwn: Boolean(p.viewOwn ?? p.view_own),
        viewAll: Boolean(p.viewAll ?? p.view_all),
        createOwn: Boolean(p.createOwn ?? p.create_own),
        createAll: Boolean(p.createAll ?? p.create_all),
        editOwn: Boolean(p.editOwn ?? p.edit_own),
        editAll: Boolean(p.editAll ?? p.edit_all),
        deleteOwn: Boolean(p.deleteOwn ?? p.delete_own),
        deleteAll: Boolean(p.deleteAll ?? p.delete_all),
        approve: Boolean(p.approve),
      },
    };
  });
}

function permissionRecordsToModulePermissions(records: PermissionRecord[]): ModulePermission[] {
  return records.map((record) => ({
    module: normalizeModule(record.module),
    permission: {
      viewOwn: Boolean(record.viewOwn),
      viewAll: Boolean(record.viewAll),
      createOwn: Boolean(record.createOwn),
      createAll: Boolean(record.createAll),
      editOwn: Boolean(record.editOwn),
      editAll: Boolean(record.editAll),
      deleteOwn: Boolean(record.deleteOwn),
      deleteAll: Boolean(record.deleteAll),
      approve: Boolean(record.approve),
      active: record.active,
    },
  }));
}

function modulePermissionsToPermissionRecords(
  permissions: ModulePermission[]
): PermissionRecord[] {
  return permissions.map((perm) => ({
    employeeId: undefined,
    employee: undefined,
    module: perm.module,
    viewOwn: perm.permission.viewOwn,
    viewAll: perm.permission.viewAll,
    createOwn: perm.permission.createOwn,
    createAll: perm.permission.createAll,
    editOwn: perm.permission.editOwn,
    editAll: perm.permission.editAll,
    deleteOwn: perm.permission.deleteOwn,
    deleteAll: perm.permission.deleteAll,
    approve: perm.permission.approve,
    active: perm.permission.active,
  }));
}

// Roles

async function getRoles(companyId: number): Promise<Role[]> {
  const res = await apiClient.get<Role[]>("/roles", {
    params: { companyId },
  });
  return res.data;
}

async function getActiveRoles(companyId: number): Promise<Role[]> {
  const res = await apiClient.get<Role[]>("/roles/active", {
    params: { companyId },
  });
  return res.data;
}

async function createRole(payload: CreateRoleRequest): Promise<Role> {
  const res = await apiClient.post<Role>("/roles", payload);
  return res.data;
}

async function updateRole(payload: UpdateRoleRequest): Promise<Role> {
  const res = await apiClient.put<Role>(`/roles/${payload.id}`, payload);
  return res.data;
}

async function deleteRole(roleId: number): Promise<void> {
  await apiClient.delete(`/roles/${roleId}`);
}

// My permissions

async function getMyPermissions(forceRefresh = false): Promise<PermissionRecord[]> {
  const cached = getPermissionCache();
  if (!forceRefresh && cached) {
    return modulePermissionsToPermissionRecords(cached);
  }

  try {
    const res = await apiClient.get<PermissionRecord[]>("/role-permissions/my-permissions");
    const data = res.data ?? [];
    setPermissionCache(permissionRecordsToModulePermissions(data));
    return data;
  } catch (err) {
    console.error("Failed to fetch my permissions", err);
    setPermissionCache([]);
    return [];
  }
}

// Enum role permissions

async function getEnumRolePermissions(role: string): Promise<PermissionRecord[]> {
  const res = await apiClient.get<PermissionRecord[]>(
    `/role-permissions/enum-roles/${encodeURIComponent(role)}`
  );
  return res.data ?? [];
}

async function assignEnumRolePermissions(role: string, dtos: any[]): Promise<void> {
  await apiClient.post(
    `/role-permissions/enum-roles/${encodeURIComponent(role)}`,
    toBackendDTOs(dtos)
  );
  clearPermissionCache();
}

async function removeAllEnumRolePermissions(role: string): Promise<void> {
  await apiClient.delete(`/role-permissions/enum-roles/${encodeURIComponent(role)}`);
  clearPermissionCache();
}

// Company role permissions

async function getCompanyRolePermissions(companyRoleId: number): Promise<PermissionRecord[]> {
  const res = await apiClient.get<PermissionRecord[]>(
    `/role-permissions/company-roles/${companyRoleId}`
  );
  return res.data ?? [];
}

async function assignCompanyRolePermissions(
  companyRoleId: number,
  dtos: any[]
): Promise<void> {
  await apiClient.post(
    `/role-permissions/company-roles/${companyRoleId}`,
    toBackendDTOs(dtos)
  );
  clearPermissionCache();
}

async function removeAllCompanyRolePermissions(companyRoleId: number): Promise<void> {
  await apiClient.delete(`/role-permissions/company-roles/${companyRoleId}`);
  clearPermissionCache();
}

// Employee override permissions

async function getEmployeePermissions(employeeId: number): Promise<PermissionRecord[]> {
  const res = await apiClient.get<PermissionRecord[]>(
    `/role-permissions/employees/${employeeId}`
  );
  return res.data ?? [];
}

async function assignEmployeePermissions(employeeId: number, dtos: any[]): Promise<void> {
  await apiClient.post(
    `/role-permissions/employees/${employeeId}`,
    toBackendDTOs(dtos)
  );
  clearPermissionCache();
}

async function removeAllEmployeePermissions(employeeId: number): Promise<void> {
  await apiClient.delete(`/role-permissions/employees/${employeeId}`);
  clearPermissionCache();
}

// Enable/disable a rule. When inactive it is saved but not enforced (the
// backend resolver skips it and falls through to the next precedence layer).
async function setCompanyRolePermissionsActive(
  companyRoleId: number,
  active: boolean
): Promise<void> {
  await apiClient.patch(
    `/role-permissions/company-roles/${companyRoleId}/active`,
    { active }
  );
  clearPermissionCache();
}

async function setEmployeePermissionsActive(
  employeeId: number,
  active: boolean
): Promise<void> {
  await apiClient.patch(`/role-permissions/employees/${employeeId}/active`, {
    active,
  });
  clearPermissionCache();
}

// Helpers

function toFrontendCaps(
  permissions: Array<PermissionRecord | ModulePermission>
): Record<string, Record<string, boolean>> {
  const caps: Record<string, Record<string, boolean>> = {};

  for (const perm of permissions) {
    const rawModule = (perm as any).module ?? (perm as any).moduleName ?? "";
    const moduleId = String(rawModule)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const p = (perm as any).permission ?? perm;

    const createOwn = Boolean(p.createOwn ?? p.create_own);
    const createAll = Boolean(p.createAll ?? p.create_all);
    const editOwn = Boolean(p.editOwn ?? p.edit_own);
    const editAll = Boolean(p.editAll ?? p.edit_all);
    const deleteOwn = Boolean(p.deleteOwn ?? p.delete_own);
    const deleteAll = Boolean(p.deleteAll ?? p.delete_all);

    caps[moduleId] = {
      view_own: Boolean(p.viewOwn ?? p.view_own),
      view_all: Boolean(p.viewAll ?? p.view_all),
      create_own: createOwn,
      create_all: createAll,
      edit_own: editOwn,
      edit_all: editAll,
      delete_own: deleteOwn,
      delete_all: deleteAll,
      approve: Boolean(p.approve),
      // Coarse aliases (backward compat for components reading .create/.edit/.delete).
      create: createOwn || createAll,
      edit: editOwn || editAll,
      delete: deleteOwn || deleteAll,
    };
  }

  return caps;
}

function toBackendPermissions(
  caps: Record<string, Record<string, boolean>>
): ModulePermission[] {
  return Object.entries(caps).map(([module, perms]) => ({
    module: normalizeModule(module),
    permission: {
      viewOwn: perms.view_own || false,
      viewAll: perms.view_all || false,
      createOwn: perms.create_own || false,
      createAll: perms.create_all || false,
      editOwn: perms.edit_own || false,
      editAll: perms.edit_all || false,
      deleteOwn: perms.delete_own || false,
      deleteAll: perms.delete_all || false,
      approve: perms.approve || false,
    },
  }));
}

// New function to get permissions by company role name (for AuthContext)
// ⚠️ RESTRICTED: Only ADMIN/SUPER_ADMIN can access this endpoint
async function getByRole(companyRole: string): Promise<PermissionRecord[]> {
  // Prevent normal users from calling admin-protected API
  const normalizedRole = companyRole.toUpperCase();
  if (normalizedRole !== "ADMIN" && normalizedRole !== "SUPER_ADMIN") {
    console.warn(
      "getByRole: Skipping - endpoint is restricted to ADMIN/SUPER_ADMIN only. Role:",
      companyRole
    );
    return [];
  }

  const res = await apiClient.get<PermissionRecord[]>(
    `/role-permissions/enum-roles/${encodeURIComponent(companyRole)}`
  );
  return res.data ?? [];
}

// Unified assignPermissions that handles both role-wide and employee-specific permissions
async function assignPermissions(
  roleName: string,
  dtos: any[],
  employeeId?: number
): Promise<void> {
  if (employeeId && employeeId > 0) {
    // Employee-specific override permissions
    await assignEmployeePermissions(employeeId, dtos);
  } else {
    // Role-wide permissions - use enum role endpoint
    await assignEnumRolePermissions(roleName, dtos);
  }
  clearPermissionCache();
}

export const permissionService = {
  getRoles,
  getActiveRoles,
  createRole,
  updateRole,
  deleteRole,

  getMyPermissions,
  getByRole,

  getEnumRolePermissions,
  assignEnumRolePermissions,
  removeAllEnumRolePermissions,

  getCompanyRolePermissions,
  assignCompanyRolePermissions,
  removeAllCompanyRolePermissions,

  getEmployeePermissions,
  assignEmployeePermissions,
  removeAllEmployeePermissions,

  setCompanyRolePermissionsActive,
  setEmployeePermissionsActive,

  assignPermissions,

  clearPermissionCache,

  toFrontendCaps,
  toBackendPermissions,
  toBackendDTOs,

  MODULES,
};

export default permissionService;