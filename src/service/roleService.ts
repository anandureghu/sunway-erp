import { apiClient } from "./apiClient";
import { permissionService } from "./permissionService";
import type { CreateRoleRequest, UpdateRoleRequest } from "@/types/role";

/**
 * Role Service - Dedicated service for role management
 * Roles are managed at the company level in Settings
 */

export interface RoleResponse {
  id: number;
  name: string;
  description?: string;
  custom: boolean;
  active?: boolean;
  companyId?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get all roles for a company
 */
async function getRoles(companyId?: number): Promise<RoleResponse[]> {
  const url = companyId ? `/roles?companyId=${companyId}` : "/roles";
  const res = await apiClient.get<RoleResponse[]>(url);
  return res.data || [];
}

/**
 * Get a single role by ID
 */
async function getRoleById(id: number): Promise<RoleResponse> {
  const res = await apiClient.get<RoleResponse>(`/roles/${id}`);
  return res.data;
}

/**
 * Create a new role
 */
async function createRole(payload: CreateRoleRequest): Promise<RoleResponse> {
  const res = await apiClient.post<RoleResponse>("/roles", payload);
  return res.data;
}

/**
 * Update an existing role
 */
async function updateRole(payload: UpdateRoleRequest): Promise<RoleResponse> {
  const res = await apiClient.put<RoleResponse>(`/roles/${payload.id}`, payload);
  permissionService.clearPermissionCache();
  return res.data;
}

/**
 * Delete a role
 */
async function deleteRole(roleId: number): Promise<void> {
  await apiClient.delete(`/roles/${roleId}`);
}

/**
 * Toggle role active status
 */
async function toggleRoleStatus(roleId: number, active: boolean): Promise<RoleResponse> {
  const res = await apiClient.patch<RoleResponse>(`/roles/${roleId}`, { active });
  return res.data;
}

/**
 * Get roles by company ID (alias for getRoles with companyId)
 */
async function getRolesByCompany(companyId: number): Promise<RoleResponse[]> {
  return getRoles(companyId);
}

/**
 * Get only active roles for dropdowns
 */
async function getActiveRoles(companyId: number): Promise<RoleResponse[]> {
  const roles = await getRoles(companyId);
  return roles.filter(r => r.active !== false);
}

/**
 * Convert roles to dropdown options { label, value }
 * value = role.name so it matches user.companyRole directly
 */
function toOptions(roles: RoleResponse[]): { label: string; value: string }[] {
  return roles
    .filter(r => r.active !== false)
    .map(r => ({ label: r.name, value: r.name }));
}

export const roleService = {
  getRoles,
  getRoleById,
  getRolesByCompany,
  getActiveRoles,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleStatus,
  toOptions,
};

export default roleService;

