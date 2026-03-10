// Singleton cache — lives for the entire browser session, survives component remounts
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
      cache = []; // cache empty on error — prevents infinite retries
      return [];
    });

  return promise;
}

export function clearPermissionCache() {
  cache = null;
  promise = null;
}

export function canEditModule(permissions: any[], module: string): boolean {
  if (permissions.length === 0) return true; // no rules = open access
  const p = permissions.find((x) => x.module === module);
  if (!p) return true; // module not in permissions = not restricted
  return p.editPermission === true;
}

