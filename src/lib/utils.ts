import type { Role } from "@/types/hr";
import type { ModulePermission } from "@/types/role";
import type { SidebarItem } from "@/types/company";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiClient } from "@/service/apiClient";
import { formatCurrencyAmount } from "@/lib/currency";

// ✅ FIXED: Matches your ModulePermissionDTO structure
export function canViewModule(permissions: ModulePermission[] | null, module: string): boolean {
  // `permissions === null` is the admin bypass (show everything).
  if (permissions === null) return true;

  // Empty list means explicit deny-by-default.
  if (!permissions || permissions.length === 0) return false;

  const p = permissions.find(
    (x) => x.module?.toUpperCase() === module.toUpperCase()
  );

  if (!p || !p.permission) return false;

  return (p.permission?.viewOwn ?? false) || (p.permission?.viewAll ?? false);

}

export function canEditModule(permissions: ModulePermission[] | null, module: string): boolean {
  if (permissions === null) return true;
  if (!permissions || permissions.length === 0) return false;

  const p = permissions.find((x) => x.module?.toUpperCase() === module.toUpperCase());

  if (!p || !p.permission) return false;

  // ✅ FIXED: backend uses "edit" not "editPermission"
  return p.permission?.edit ?? false;

}

export function canCreateInModule(permissions: ModulePermission[] | null, module: string): boolean {
  if (permissions === null) return true;
  if (!permissions || permissions.length === 0) return false;

  const p = permissions.find((x) => x.module?.toUpperCase() === module.toUpperCase());

  if (!p || !p.permission) return false;

  // ✅ FIXED: backend uses "create" not "createPermission"  
  return p.permission?.create ?? false;

}

// ✅ NEW: Generic permission check (sidebar filtering)
export function hasModulePermission(
  permissions: ModulePermission[] | null, 
  module: string, 
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve'
): boolean {
  if (permissions === null) return true;
  if (!permissions || permissions.length === 0) return false;

  const p = permissions.find((x) => x.module?.toUpperCase() === module.toUpperCase());
  if (!p || !p.permission) return false;

  return {
    view: (p.permission?.viewOwn ?? false) || (p.permission?.viewAll ?? false),
    create: p.permission?.create ?? false,
    edit: p.permission?.edit ?? false,
    delete: p.permission?.deletePermission ?? false,
    approve: p.permission?.approve ?? false

  }[action];
}

// ✅ API fetch (use in components)
export async function fetchMyPermissions(): Promise<ModulePermission[]> {
  try {
    const res = await apiClient.get("/role-permissions/my-permissions");
    return res.data ?? [];
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    return [];
  }
}

// ✅ OLD version - kept for compatibility
export function getModuleFromUrl(url: string): string {
  if (!url) return '';
  
  const match = url.match(/\/(?:hr|admin|finance|inventory)\/(\w+)/i);
  return match ? match[1].toUpperCase() : '';
}

// ✅ Sidebar filtering utility
export function filterSidebarItemsByPermissions(
  items: SidebarItem[], 
  permissions: ModulePermission[]
): SidebarItem[] {
  return items
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Always show non-module items (dashboard, etc.)
        if (!item.url.includes('/hr/') && !item.url.includes('/admin/')) return true;
        
        // Extract module from URL
        const moduleMatch = item.url.match(/\/(?:hr|admin)\/(\w+)/i);
        const module = moduleMatch ? moduleMatch[1].toUpperCase() : null;
        
        if (!module) return true;
        
        // Check if ANY permission exists
        return hasModulePermission(permissions, module, 'view');
      }).filter(Boolean)
    }))
    .filter(section => section.items.length > 0); // Hide empty sections
}

// ✅ Existing utilities unchanged
export const normalizeRole = (role?: string): string =>
  role?.trim().toUpperCase() || "";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
}

export function formatMoney(
  amount: string | number,
  currencyCode?: string,
) {
  return formatCurrencyAmount({ amount, currencyCode });
}

export const toISO = (date: string) => new Date(date).toISOString();

export const getParentPath = (pathname: string) =>
  pathname.includes("finance")
    ? "finance"
    : pathname.includes("inventory")
    ? "inventory"
    : "admin";

export const hasAnyRole = (
  userRole: Role | undefined,
  allowedRoles: Role[],
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};
