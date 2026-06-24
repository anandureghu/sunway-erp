import { canView } from "@/service/companyService";

export const InventoryModule = {
  CATEGORY: "INVENTORY_CATEGORY",
  WAREHOUSE: "INVENTORY_WAREHOUSE",
  STOCK: "INVENTORY_STOCK",
  ITEM: "INVENTORY_ITEM",
  PURCHASE: "INVENTORY_PURCHASE",
  RECEIPT: "INVENTORY_RECEIPT",
  SALES: "INVENTORY_SALES",
} as const;

export type InventoryModuleName =
  (typeof InventoryModule)[keyof typeof InventoryModule];

type PermissionMap = Record<string, Record<string, boolean>> | null | undefined;

function normalizeModuleKey(module: string): string {
  return module
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .replace(/^_+|_+$/g, "");
}

function getModulePerms(
  permissions: PermissionMap,
  module: string,
): Record<string, boolean> | null {
  if (permissions == null || typeof permissions !== "object") return null;
  const key = normalizeModuleKey(module);
  return (
    permissions[key] ??
    permissions[module.toLowerCase().replace(/\s+/g, "_")] ??
    permissions[module] ??
    null
  );
}

function cap(
  permissions: PermissionMap,
  module: string,
  names: string[],
): boolean {
  if (permissions === null) return true;
  const mod = getModulePerms(permissions, module);
  if (!mod) return false;
  return names.some((n) => !!mod[n]);
}

export function canCreateModule(
  permissions: PermissionMap,
  module: string,
): boolean {
  return cap(permissions, module, ["create", "CREATE"]);
}

export function canEditModule(
  permissions: PermissionMap,
  module: string,
): boolean {
  return cap(permissions, module, ["edit", "EDIT", "editPermission"]);
}

export function canDeleteModule(
  permissions: PermissionMap,
  module: string,
): boolean {
  return cap(permissions, module, ["delete", "DELETE", "deletePermission"]);
}

export function canApproveModule(
  permissions: PermissionMap,
  module: string,
): boolean {
  return cap(permissions, module, ["approve", "APPROVE"]);
}

export function canViewAnyModule(
  permissions: PermissionMap,
  modules: string[],
): boolean {
  return modules.some((m) => canView(permissions, m));
}

/**
 * Own/all-aware capability check — mirrors the backend @RequiresPermission
 * aspect. A write is allowed when the `{action}_all` grant is present, OR the
 * `{action}_own` grant is present and the record is the caller's own. Use this
 * to hide an action button on someone else's record when the user only holds
 * the "own" grant (so they don't see a button that would 403 on save).
 */
export function canActScoped(
  permissions: PermissionMap,
  module: string,
  action: "view" | "create" | "edit" | "delete" | "approve",
  isOwn: boolean,
): boolean {
  if (permissions === null) return true; // admin bypass
  const mod = getModulePerms(permissions, module);
  if (!mod) return false;
  if (action === "approve") return !!mod.approve;
  if (action === "view") return !!mod.view_all || (!!mod.view_own && isOwn);
  return !!mod[`${action}_all`] || (!!mod[`${action}_own`] && isOwn);
}

export interface ModuleCaps {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export function getModuleCaps(
  permissions: PermissionMap,
  module: string,
): ModuleCaps {
  return {
    canView: canView(permissions, module),
    canCreate: canCreateModule(permissions, module),
    canEdit: canEditModule(permissions, module),
    canDelete: canDeleteModule(permissions, module),
    canApprove: canApproveModule(permissions, module),
  };
}
