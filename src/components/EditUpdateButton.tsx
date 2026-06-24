import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { permissionService } from "@/service/permissionService";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

type Props = {
  editing:  boolean;
  onEdit:   () => void;
  onSave:   () => void;
  onCancel: () => void;
  module:   string;
  label?:   string; // Optional custom label for the button (e.g., "Request Leave")
};

export default function EditUpdateButton({ editing, onEdit, onSave, onCancel, module, label }: Props) {
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

    permissionService.getMyPermissions().then((perms: any[]) => {
      // debug
      console.debug("PERMISSIONS:", perms);
      console.debug("MODULE:", module);

      const normalizedModule = module?.toUpperCase().replace(/-/g, "_");

      const perm = perms.find(
        (p) => p.module?.toUpperCase() === normalizedModule,
      );

      if (!mounted) return;

      // The button enables when the user can write in this module (create OR
      // edit), since it gates both "Edit/Update" and create-style actions like
      // "Request Leave". The backend still enforces the specific action and the
      // own/all scope on save. We read every shape the API may return:
      //   • flat granular (current):  perm.editOwn / editAll / createOwn / createAll
      //   • nested under `permission`: perm.permission.editOwn / .edit / ...
      //   • legacy single flags:       perm.editPermission / createPermission
      const truthy = (...vals: unknown[]) => vals.some((v) => v === true);
      const p: any = perm ?? {};
      const pp: any = p.permission ?? {};
      const allowed = truthy(
        p.editOwn, p.editAll, p.createOwn, p.createAll,
        pp.editOwn, pp.editAll, pp.createOwn, pp.createAll,
        pp.edit, pp.create,
        p.editPermission, p.createPermission,
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
          <span className="font-semibold">{label ? label : "Edit/Update"}</span>
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