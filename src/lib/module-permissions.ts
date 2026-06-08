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
