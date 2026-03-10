import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getMyPermissions, canEditModule } from "@/service/permissionCache";

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
  const [canEdit, setCanEdit] = useState(true); // default true — don't block UI while loading

  useEffect(() => {
    if (isAdmin) { setCanEdit(true); return; }
    if (!user)   return;

    getMyPermissions().then((perms) => {
      setCanEdit(canEditModule(perms, module));
    });
  }, [isAdmin, module, user]);

  return (
    <div className="flex gap-2">
      {!editing ? (
        <Button
          onClick={onEdit}
          disabled={!canEdit}
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