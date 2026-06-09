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

  return {
    ...caps,
    loading: permissionsLoading,
    isAdmin,
    canView: isAdmin || permissions === null || canView(permissions, module),
    canCreate:
      isAdmin || permissions === null || canCreateModule(permissions, module),
    canEdit:
      isAdmin || permissions === null || canEditModule(permissions, module),
    canDelete:
      isAdmin || permissions === null || canDeleteModule(permissions, module),
    canApprove:
      isAdmin || permissions === null || canApproveModule(permissions, module),
  };
}
