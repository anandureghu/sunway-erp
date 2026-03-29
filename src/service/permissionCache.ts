import type { ModulePermission } from "@/types/role";

// Simple in-memory cache for current user's permissions.
let cache: ModulePermission[] | null = null;

export function getPermissionCache(): ModulePermission[] | null {
  return cache;
}

export function setPermissionCache(perms: ModulePermission[]) {
  cache = perms;
}

export function clearPermissionCache() {
  cache = null;
}

export default {
  getPermissionCache,
  setPermissionCache,
  clearPermissionCache,
};