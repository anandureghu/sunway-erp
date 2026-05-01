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
} as const;

// Backend now returns a flat permission record shape.
export type PermissionRecord = {
  employeeId: any;
  employee: any;
  id?: number;
  module: string;
  viewOwn?: boolean;
  viewAll?: boolean;
  createPermission?: boolean;
  editPermission?: boolean;
  deletePermission?: boolean;
  approve?: boolean;
};

type PermissionPayload = {
  module: string;
  permission: {
    viewOwn: boolean;
    viewAll: boolean;
    create: boolean;
    edit: boolean;
    deletePermission: boolean;
    approve: boolean;
  };
};


function normalizeModule(module: string) {
  return (module ?? "").toUpperCase().trim();
}

function toBackendDTOs(permissions: Array<any>): PermissionPayload[] {
  return permissions.map((perm) => {
    const moduleRaw = perm.module ?? perm.moduleName ?? "";
    const permissionObj = perm.permission ?? {
      viewOwn: perm.viewOwn ?? false,
      viewAll: perm.viewAll ?? false,
      create: perm.create ?? perm.createPermission ?? false,
      edit: perm.edit ?? perm.editPermission ?? false,
      deletePermission: perm.deletePermission ?? false,
      approve: perm.approve ?? false,
    };

    return {
      module: normalizeModule(moduleRaw),
      permission: {
        viewOwn: Boolean(permissionObj.viewOwn),
        viewAll: Boolean(permissionObj.viewAll),
        create: Boolean(permissionObj.create),
        edit: Boolean(permissionObj.edit),
        deletePermission: Boolean(permissionObj.deletePermission),
        approve: Boolean(permissionObj.approve),
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
      create: Boolean(record.createPermission),
      edit: Boolean(record.editPermission),
      deletePermission: Boolean(record.deletePermission),
      approve: Boolean(record.approve),
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
    createPermission: perm.permission.create,
    editPermission: perm.permission.edit,
    deletePermission: perm.permission.deletePermission,
    approve: perm.permission.approve,
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

    caps[moduleId] = {
      view_own: Boolean(p.viewOwn ?? p.view_own),
      view_all: Boolean(p.viewAll ?? p.view_all),
      create: Boolean(p.create ?? p.createPermission ?? p.create_permission),
      edit: Boolean(p.edit ?? p.editPermission ?? p.edit_permission),
      delete: Boolean(p.deletePermission ?? p.delete_permission),
      approve: Boolean(p.approve),
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
      create: perms.create || false,
      edit: perms.edit || false,
      deletePermission: perms.delete || false,
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

  assignPermissions,

  clearPermissionCache,

  toFrontendCaps,
  toBackendPermissions,
  toBackendDTOs,

  MODULES,
};

export default permissionService;