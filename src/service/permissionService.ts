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
  const url = employeeId
    ? `/role-permissions/${roleName.toUpperCase()}?employeeId=${employeeId}`
    : `/role-permissions/${roleName.toUpperCase()}`;
  
  const res = await apiClient.get<ModulePermission[]>(url);
  return res.data;
}

async function getMyPermissions(): Promise<ModulePermission[]> {
  const res = await apiClient.get<ModulePermission[]>(
    "/role-permissions/my-permissions"
  );
  return res.data;
}

// ✅ Transforms flat ModulePermission[] → nested DTO format backend expects
function toBackendDTOs(permissions: ModulePermission[]): object[] {
  return permissions.map((perm) => ({
    module: perm.module.toUpperCase(),
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

  const url = employeeId
    ? `/role-permissions/${roleName.toUpperCase()}?employeeId=${employeeId}`
    : `/role-permissions/${roleName.toUpperCase()}`;

  await apiClient.post(url, payload);
}


async function removeAll(roleName: string): Promise<void> {
  await apiClient.delete(`/role-permissions/${roleName.toUpperCase()}`);
}


// ✅ Maps backend flat response → frontend caps lookup object
function toFrontendCaps(
  permissions: ModulePermission[]
): Record<string, Record<string, boolean>> {
  const caps: Record<string, Record<string, boolean>> = {};

  for (const perm of permissions) {
    // Normalize module id to a consistent frontend key:
    // - make lowercase
    // - replace non-alphanumeric characters with underscore
    // This covers BACKEND values like "CURRENT_JOB", "CURRENT-JOB" or "current-job"
    const moduleId = perm.module
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

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

// Maps frontend caps → flat ModulePermission[] (for internal use)
function toBackendPermissions(
  caps: Record<string, Record<string, boolean>>
): ModulePermission[] {
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
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getByRole,
  getMyPermissions,
  assignPermissions,
  removeAll,
  toFrontendCaps,
  toBackendPermissions,
  toBackendDTOs,      
};

export default permissionService;