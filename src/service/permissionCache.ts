import { apiClient } from "./apiClient";

let cache: any[] | null = null;
let promise: Promise<any[]> | null = null;

export async function getMyPermissions(): Promise<any[]> {
  if (cache !== null) return cache;
  if (promise) return promise;

  promise = apiClient
    .get("/role-permissions/my-permissions")
    .then((res) => {
      cache = res.data ?? [];
      promise = null;
      return cache!;
    })
    .catch(() => {
      promise = null;
      cache = [];
      return [];
    });

  return promise;
}

export function clearPermissionCache() {
  cache = null;
  promise = null;
}

export function canEditModule(permissions: any[], module: string): boolean {
  // Empty = admin bypass (backend returned nothing because ADMIN/SUPER_ADMIN skips rules)
  if (permissions.length === 0) return true;

  const p = permissions.find((x) => x.module === module);

  // Module not found in permissions list = not restricted
  if (!p) return true;

  return p.editPermission === true;
}

export function canViewModule(permissions: any[], module: string): boolean {
  if (permissions.length === 0) return true;
  const p = permissions.find((x) => x.module === module);
  if (!p) return true;
  return p.viewOwn === true || p.viewAll === true;
}

export function canCreateInModule(permissions: any[], module: string): boolean {
  if (permissions.length === 0) return true;
  const p = permissions.find((x) => x.module === module);
  if (!p) return true;
  return p.createPermission === true;
}