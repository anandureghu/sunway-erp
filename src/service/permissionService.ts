import { apiClient } from "./apiClient";
import type { ModulePermission, Role, CreateRoleRequest, UpdateRoleRequest } from "@/types/role";

async function getRoles(): Promise<Role[]> {
  const res = await apiClient.get<Role[]>("/roles");
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

async function getByRole(roleName: string, employeeId?: number): Promise<ModulePermission[]> {
  // ✅ No .toUpperCase() — preserve exact companyRole name e.g. "User", "HR Manager"
  const url = employeeId
    ? `/role-permissions/${encodeURIComponent(roleName)}?employeeId=${employeeId}`
    : `/role-permissions/${encodeURIComponent(roleName)}`;
  const res = await apiClient.get<ModulePermission[]>(url);
  return res.data;
}

async function getMyPermissions(): Promise<ModulePermission[]> {
  const res = await apiClient.get<ModulePermission[]>("/role-permissions/my-permissions");
  return res.data;
}

function toBackendDTOs(permissions: ModulePermission[]): object[] {
  return permissions.map((perm) => ({
    module: perm.module.toUpperCase(), // module names are still uppercase enums
    permission: {
      viewOwn:          perm.viewOwn,
      viewAll:          perm.viewAll,
      create:           perm.createPermission,
      edit:             perm.editPermission,
      deletePermission: perm.deletePermission,
      approve:          perm.approve,
    },
  }));
}

async function assignPermissions(
  roleName: string,
  permissions: ModulePermission[],
  employeeId?: number
): Promise<void> {
  const payload = toBackendDTOs(permissions);
  // ✅ No .toUpperCase() — preserve exact companyRole name e.g. "User", "HR Manager"
  const url = employeeId
    ? `/role-permissions/${encodeURIComponent(roleName)}?employeeId=${employeeId}`
    : `/role-permissions/${encodeURIComponent(roleName)}`;
  await apiClient.post(url, payload);
}

async function removeAll(roleName: string): Promise<void> {
  // ✅ No .toUpperCase()
  await apiClient.delete(`/role-permissions/${encodeURIComponent(roleName)}`);
}

function toFrontendCaps(permissions: ModulePermission[]): Record<string, Record<string, boolean>> {
  const caps: Record<string, Record<string, boolean>> = {};
  for (const perm of permissions) {
    const moduleId = perm.module.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    caps[moduleId] = {
      view_own: perm.viewOwn,
      view_all: perm.viewAll,
      create:   perm.createPermission,
      edit:     perm.editPermission,
      delete:   perm.deletePermission,
      approve:  perm.approve,
    };
  }
  return caps;
}

function toBackendPermissions(caps: Record<string, Record<string, boolean>>): ModulePermission[] {
  return Object.entries(caps).map(([module, perms]) => ({
    module:           module.toUpperCase(),
    viewOwn:          perms.view_own  || false,
    viewAll:          perms.view_all  || false,
    createPermission: perms.create    || false,
    editPermission:   perms.edit      || false,
    deletePermission: perms.delete    || false,
    approve:          perms.approve   || false,
  }));
}

export const permissionService = {
  getRoles, createRole, updateRole, deleteRole,
  getByRole, getMyPermissions, assignPermissions, removeAll,
  toFrontendCaps, toBackendPermissions, toBackendDTOs,
};

export default permissionService;