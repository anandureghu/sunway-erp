import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { permissionService } from "@/service/permissionService";
import type { ModulePermission } from "@/types/role";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

type Props = {
  editing:  boolean;
  onEdit:   () => void;
  onSave:   () => void;
  onCancel: () => void;
  module:   string;
};

export default function EditUpdateButton({ editing, onEdit, onSave, onCancel, module }: Props) {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? "").toUpperCase());

  // start locked until we know — prevents flicker
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (isAdmin) {
      setCanEdit(true);
      setLoading(false);
      return;
    }

    if (!user) return;

    permissionService.getMyPermissions().then((perms: ModulePermission[]) => {
      // debug
      console.debug("PERMISSIONS:", perms);
      console.debug("MODULE:", module);

      const normalizedModule = module?.toUpperCase().replace(/-/g, "_");

      const perm = perms.find(
        (p) => p.module?.toUpperCase() === normalizedModule,
      );

      if (!mounted) return;

      // Support both backend DTO shape (editPermission) and frontend 'permission' object
      const allowed = !!(
        perm?.editPermission === true || perm?.permission?.edit === true
      );

      setCanEdit(allowed);
      setLoading(false);
    }).catch((e) => {
      console.warn('Failed to load permissions for EditUpdateButton', e);
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [isAdmin, module, user]);

  return (
    <div className="flex gap-2">
      {!editing ? (
        <Button
          onClick={onEdit}
          disabled={loading || !canEdit}
          title={!canEdit ? "You don't have permission to edit" : undefined}
          className="rounded-xl bg-white text-black shadow-sm hover:bg-white/90 border px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="mr-2 text-[18px] leading-none">✏️</span>
          <span className="font-semibold">Edit/Update</span>
        </Button>
      ) : (
        <>
          <Button variant="outline" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={onSave} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
            Save
          </Button>
        </>
      )}
    </div>
  );
}