import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { canViewAnyModule } from "@/lib/module-permissions";
import { canView } from "@/service/companyService";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldOff } from "lucide-react";

type ModuleAccessGateProps = {
  /** Single module key, e.g. INVENTORY_STOCK */
  module?: string;
  /** Allow access if the user can view any of these modules */
  modules?: string[];
  children: ReactNode;
  title?: string;
};

export function ModuleAccessGate({
  module,
  modules,
  children,
  title = "Access denied",
}: ModuleAccessGateProps) {
  const { permissions, permissionsLoading, user } = useAuth();

  const isAdmin =
    (user?.role ?? "").toString().toUpperCase() === "ADMIN" ||
    (user?.role ?? "").toString().toUpperCase() === "SUPER_ADMIN";

  if (permissionsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading permissions…
          </CardContent>
        </Card>
      </div>
    );
  }

  const allowed =
    isAdmin ||
    permissions === null ||
    (modules && modules.length > 0
      ? canViewAnyModule(permissions, modules)
      : module
        ? canView(permissions, module)
        : true);

  if (!allowed) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <ShieldOff className="h-10 w-10 opacity-40" />
            <p className="text-base font-medium text-foreground">{title}</p>
            <p className="text-sm">
              You do not have permission to view this section. Contact your
              administrator to request access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
