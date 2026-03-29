import { apiClient } from "./apiClient";
import { getPermissionCache, setPermissionCache, clearPermissionCache } from "./permissionCache";
import type {
  ModulePermission,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@/types/role";

import { normalizeRole } from "@/lib/utils";

// 🔥 Optional: central module constants (recommended)
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
};

// Cache is stored in ./permissionCache (single source)

// ─────────────────────────────────────────────────────────────
// 🔹 Role APIs
// ─────────────────────────────────────────────────────────────

async function getRoles(): Promise<Role[]> {
  try {
    const res = await apiClient.get<Role[]>("/roles");
    return res.data;
  } catch (err) {
    console.error("Failed to fetch roles", err);
    throw err;
  }
}

async function createRole(payload: CreateRoleRequest): Promise<Role> {
  try {
    const res = await apiClient.post<Role>("/roles", payload);
    return res.data;
  } catch (err) {
    console.error("Failed to create role", err);
    throw err;
  }
}

async function updateRole(payload: UpdateRoleRequest): Promise<Role> {
  try {
    const res = await apiClient.put<Role>(`/roles/${payload.id}`, payload);
    return res.data;
  } catch (err) {
    console.error("Failed to update role", err);
    throw err;
  }
}

async function deleteRole(roleId: number): Promise<void> {
  try {
    await apiClient.delete(`/roles/${roleId}`);
  } catch (err) {
    console.error("Failed to delete role", err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// 🔹 Permission APIs
// ─────────────────────────────────────────────────────────────

/* validateRoleName removed - using normalizeRole from utils.ts */

async function getByRole(
  roleName: string,
  employeeId?: number
): Promise<ModulePermission[]> {
  const role = normalizeRole(roleName);

  try {
    const url = employeeId
      ? `/role-permissions/${encodeURIComponent(role)}?employeeId=${employeeId}`
      : `/role-permissions/${encodeURIComponent(role)}`;

    // debug: log role fetch
    // eslint-disable-next-line no-console
    console.debug("permissionService.getByRole: fetching", url);
    const res = await apiClient.get<ModulePermission[]>(url);
    // eslint-disable-next-line no-console
    console.debug("permissionService.getByRole: result", res.data);
    const data = res.data ?? [];
    // update shared cache so getMyPermissions() returns role-based permissions
    setPermissionCache(data);
    return data;
  } catch (err) {
    console.error("Failed to fetch permissions by role", err);
    throw err;
  }
}

// 🔥 NEW: Remove specific permission (role + module + optional employee)
async function removePermission(
  roleName: string,
  module: string,
  employeeId?: number
): Promise<void> {
  const role = normalizeRole(roleName);
  const mod = module.toUpperCase().trim();

  try {
    const url = employeeId
      ? `/role-permissions/${encodeURIComponent(role)}/${mod}?employeeId=${employeeId}`
      : `/role-permissions/${encodeURIComponent(role)}/${mod}`;

    await apiClient.delete(url);
    clearPermissionCache();
  } catch (err) {
    console.error("Failed to remove permission", err);
    throw err;
  }
}

// SINGLE SOURCE OF TRUTH (uses shared cache)
async function getMyPermissions(forceRefresh = false): Promise<ModulePermission[]> {
  const cached = getPermissionCache();
  if (!forceRefresh && cached) {
    return cached;
  }

  try {
    const res = await apiClient.get<ModulePermission[]>(
      "/role-permissions/my-permissions"
    );

    const data = res.data ?? [];
    // eslint-disable-next-line no-console
    console.debug("permissionService.getMyPermissions: fetched my-permissions", data);
    setPermissionCache(data);
    return data;
  } catch (err) {
    console.error("Failed to fetch my permissions", err);
    setPermissionCache([]);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// 🔹 Assign / Remove Permissions
// ─────────────────────────────────────────────────────────────

function normalizeModule(module: string) {
  return (module ?? "").toUpperCase().trim();
}

function toBackendDTOs(permissions: Array<any>): object[] {
  return permissions.map((perm) => {
    // support two shapes:
    // 1) { module, permission: { viewOwn, viewAll, ... } }
    // 2) ModulePermission with top-level viewOwn/viewAll/createPermission etc.
    const moduleRaw = perm.module ?? perm.moduleName ?? "";
    const permissionObj = perm.permission ?? {
      viewOwn: perm.viewOwn ?? perm.permission?.viewOwn ?? false,
      viewAll: perm.viewAll ?? perm.permission?.viewAll ?? false,
      create: perm.create ?? perm.createPermission ?? false,
      edit: perm.edit ?? perm.editPermission ?? false,
      deletePermission: perm.deletePermission ?? false,
      approve: perm.approve ?? false,
    };

    return {
      module: normalizeModule(moduleRaw),
      permission: {
        viewOwn: permissionObj.viewOwn ?? false,
        viewAll: permissionObj.viewAll ?? false,
        create: permissionObj.create ?? false,
        edit: permissionObj.edit ?? false,
        deletePermission: permissionObj.deletePermission ?? false,
        approve: permissionObj.approve ?? false,
      },
    };
  });
}

async function assignPermissions(
  roleName: string,
  dtos: any[],
  employeeId?: number
): Promise<void> {
  const role = normalizeRole(roleName);

  try {
    const url = employeeId
      ? `/role-permissions/${encodeURIComponent(role)}?employeeId=${employeeId}`
      : `/role-permissions/${encodeURIComponent(role)}`;

    await apiClient.post(url, toBackendDTOs(dtos));

    clearPermissionCache(); // 🔥 IMPORTANT
  } catch (err) {
    console.error("Failed to assign permissions", err);
    throw err;
  }
}

async function removeAll(roleName: string): Promise<void> {
  const role = normalizeRole(roleName);

  try {
    await apiClient.delete(`/role-permissions/${encodeURIComponent(role)}`);

    clearPermissionCache(); // 🔥 IMPORTANT
  } catch (err) {
    console.error("Failed to remove permissions", err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// 🔹 Transform helpers
// ─────────────────────────────────────────────────────────────

function toFrontendCaps(
  permissions: ModulePermission[]
): Record<string, Record<string, boolean>> {
  const caps: Record<string, Record<string, boolean>> = {};
  for (const perm of permissions) {
    // support two shapes: { module: 'X', permission: { viewOwn, ... } }
    // and { module: 'X', viewOwn, viewAll, createPermission, ... }
    const rawModule = (perm as any).module ?? (perm as any).moduleName ?? "";

    // Normalize to UPPER_SNAKE to match HR_SETTINGS keys
    const moduleId = String(rawModule)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const p = (perm as any).permission ?? perm;

    caps[moduleId] = {
      view_own: (p.viewOwn ?? p.view_own) ?? false,
      view_all: (p.viewAll ?? p.view_all) ?? false,
      create: (p.create ?? p.createPermission ?? p.create_permission) ?? false,
      edit: (p.edit ?? p.editPermission ?? p.edit_permission) ?? false,
      delete: (p.deletePermission ?? p.delete_permission) ?? false,
      approve: (p.approve ?? false) ?? false,
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
    }
  }));
}

// ─────────────────────────────────────────────────────────────
// 🔹 EXPORT
// ─────────────────────────────────────────────────────────────

export const permissionService = {
  // roles
  getRoles,
  createRole,
  updateRole,
  deleteRole,

  // permissions
  getByRole,
  getMyPermissions,
  assignPermissions,
  removeAll,
  removePermission,
  clearPermissionCache,

  // helpers
  toFrontendCaps,
  toBackendPermissions,
  toBackendDTOs,

  // constants
  MODULES,
};

export default permissionService;
