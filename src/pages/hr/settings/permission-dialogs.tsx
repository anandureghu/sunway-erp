import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import PermissionCards from "@/components/permission-cards";
import type { Employee } from "@/types/hr";
import { type Role, type Permission, HR_MODULES, emptyCaps } from "./shared";

type PermForm = Partial<Permission> & {
  roleId?: number;
  caps: Record<string, Record<string, boolean>>;
};

/** Create / edit a custom role. */
export function RoleFormDialog({
  open,
  roleForm,
  setRoleForm,
  onSave,
  onClose,
}: {
  open: boolean;
  roleForm: Partial<Role>;
  setRoleForm: React.Dispatch<React.SetStateAction<Partial<Role>>>;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {roleForm.id ? "Edit Role" : "Create New Role"}
          </DialogTitle>
          <DialogDescription>
            Custom roles can be assigned when adding permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Role Name *
            </label>
            <Input
              value={roleForm.name ?? ""}
              onChange={(e) =>
                setRoleForm((v) => ({ ...v, name: e.target.value }))
              }
              placeholder="e.g. HR Supervisor"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>
            <Input
              value={roleForm.description ?? ""}
              onChange={(e) =>
                setRoleForm((v) => ({ ...v, description: e.target.value }))
              }
              placeholder="e.g. Oversees HR operations"
            />
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
            After creating the role, go to <strong>Permissions</strong> and add
            a rule to configure access.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            {roleForm.id ? "Save Changes" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Grant / edit an employee or role permission rule. */
export function PermissionFormDialog({
  open,
  permForm,
  setPermForm,
  roles,
  employees,
  onApplyPreset,
  onSave,
  onClose,
}: {
  open: boolean;
  permForm: PermForm;
  setPermForm: React.Dispatch<React.SetStateAction<PermForm>>;
  roles: Role[];
  employees: Employee[];
  onApplyPreset: (role: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {permForm.id ? "Edit Permissions" : "Add Permissions"}
          </DialogTitle>
          <DialogDescription>
            Choose a role and optionally an individual employee, then configure
            their HR access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Role *
              </label>
              <select
                value={permForm.roleId ? String(permForm.roleId) : ""}
                onChange={(e) => {
                  const roleId = Number(e.target.value);
                  const selectedRole = roles.find((r) => r.id === roleId);
                  setPermForm((v) => ({
                    ...v,
                    roleId: roleId || undefined,
                    role: selectedRole?.name ?? "",
                  }));
                  if (selectedRole?.name) {
                    onApplyPreset(selectedRole.name);
                  }
                }}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">None selected</option>
                {roles.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                    {r.custom ? " (Custom)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Staff Name
              </label>
              <select
                value={permForm.staffId ? String(permForm.staffId) : ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setPermForm((v) => ({
                    ...v,
                    staffId: id > 0 ? id : undefined,
                  }));
                }}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">None selected (role-wide)</option>
                {employees.map((e) => (
                  <option key={e.id} value={String(e.id)}>
                    {e.firstName} {e.lastName} — {e.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {permForm.role && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-blue-700">
                Default permissions loaded for <strong>{permForm.role}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPermForm((v) => ({ ...v, caps: emptyCaps() }))}
              >
                Clear all
              </Button>
            </div>
          )}

          <PermissionCards
            modules={HR_MODULES}
            caps={permForm.caps}
            onChange={(next) => setPermForm((v) => ({ ...v, caps: next }))}
          />

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Switch
              checked={permForm.active ?? true}
              onCheckedChange={(v: boolean) =>
                setPermForm((f) => ({ ...f, active: v }))
              }
            />
            <div>
              <p className="text-sm font-medium text-slate-900">
                Permission Active
              </p>
              <p className="text-xs text-slate-500">
                Inactive rules are saved but not enforced
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Permissions</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Confirm removal of a single permission rule. */
export function RemovePermissionDialog({
  del,
  onClose,
  onConfirm,
}: {
  del: Permission | null;
  onClose: () => void;
  onConfirm: (rec: Permission) => void;
}) {
  return (
    <Dialog open={!!del} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Permission</DialogTitle>
          <DialogDescription>
            Remove permissions for "{del?.staffName || `Role: ${del?.role}`}"?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (del) onConfirm(del);
            }}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Confirm deletion of a custom role. */
export function DeleteRoleDialog({
  delRole,
  onClose,
  onConfirm,
}: {
  delRole: Role | null;
  onClose: () => void;
  onConfirm: (role: Role) => void;
}) {
  return (
    <Dialog open={!!delRole} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Role</DialogTitle>
          <DialogDescription>
            Delete the custom role "{delRole?.name}"?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (delRole) onConfirm(delRole);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Confirm removal of every permission for a role. */
export function RemoveAllPermissionsDialog({
  removePermsRole,
  onClose,
  onConfirm,
}: {
  removePermsRole: Role | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!removePermsRole} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove All Permissions</DialogTitle>
          <DialogDescription>
            Remove all permissions for role "{removePermsRole?.name}"? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Remove All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
