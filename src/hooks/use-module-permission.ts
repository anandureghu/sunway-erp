import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  canApproveModule,
  canCreateModule,
  canDeleteModule,
  canEditModule,
  getModuleCaps,
  type ModuleCaps,
} from "@/lib/module-permissions";
import { canView } from "@/service/companyService";

export function useModulePermission(module: string) {
  const { permissions, permissionsLoading, user } = useAuth();

  const isAdmin = useMemo(
    () =>
      (user?.role ?? "").toString().toUpperCase() === "ADMIN" ||
      (user?.role ?? "").toString().toUpperCase() === "SUPER_ADMIN",
    [user?.role],
  );

  const caps: ModuleCaps = useMemo(
    () => getModuleCaps(permissions, module),
    [permissions, module],
  );

  const hasMap = permissions != null;

  return {
    ...caps,
    loading: permissionsLoading,
    isAdmin,
    // Role bypass for ADMIN/SUPER_ADMIN only. Require a loaded map for USER —
    // `permissions === null` is the admin sentinel, not a grant for everyone.
    canView: isAdmin || (hasMap && canView(permissions, module)),
    canCreate: isAdmin || (hasMap && canCreateModule(permissions, module)),
    canEdit: isAdmin || (hasMap && canEditModule(permissions, module)),
    canDelete: isAdmin || (hasMap && canDeleteModule(permissions, module)),
    canApprove: isAdmin || (hasMap && canApproveModule(permissions, module)),
  };
}
