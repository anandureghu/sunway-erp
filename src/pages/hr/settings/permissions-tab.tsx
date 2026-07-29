import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Plus, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hrService } from "@/service/hr.service";
import { permissionService } from "@/service/permissionService";
import { normalizeRole } from "@/lib/utils";
import { roleService } from "@/service/roleService";
import type { Employee } from "@/types/hr";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { usePagination } from "@/components/table-pagination";
import {
  type Role,
  type Permission,
  expandCaps,
  ROLE_PRESETS,
  emptyCaps,
  normalizeModuleKey,
} from "./shared";
import { RolesTable, PermissionRulesView } from "./permission-tables";
import {
  RoleFormDialog,
  PermissionFormDialog,
  RemovePermissionDialog,
  DeleteRoleDialog,
  RemoveAllPermissionsDialog,
} from "./permission-dialogs";

export function PermissionsTab({
  roles,
  setRoles,
}: {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
}) {
  const { user } = useAuth();
  const companyId = user?.companyId ? Number(user.companyId) : null;

  const [perms, setPerms] = useState<Permission[]>([]);
  const [, setPermsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [view, setView] = useState<"permissions" | "roles">("permissions");
  const [modal, setModal] = useState<"perm" | "role" | null>(null);
  const [permForm, setPermForm] = useState<
    Partial<Permission> & {
      roleId?: number;
      caps: Record<string, Record<string, boolean>>;
    }
  >({
    roleId: undefined,
    role: "",
    staffId: undefined,
    caps: emptyCaps(),
    active: true,
  });
  const [roleForm, setRoleForm] = useState<Partial<Role>>({
    name: "",
    description: "",
  });
  const [del, setDel] = useState<Permission | null>(null);
  const [delRole, setDelRole] = useState<Role | null>(null);
  const [removePermsRole, setRemovePermsRole] = useState<Role | null>(null);
  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  useEffect(() => {
    const ensureRoles = async () => {
      try {
        const res = companyId
          ? await roleService.getRoles(companyId)
          : await roleService.getRoles();

        setRoles(
          (res || [])
            .filter((r: any) => r.id !== undefined)
            .map((r: any) => ({
              id: r.id,
              name: r.name,
              custom: !!r.custom,
              description: r.description,
              active: r.active,
            })),
        );
      } catch (err) {
        console.error("Failed to load roles in PermissionsTab:", err);
        setRoles([]);
        toast.error("Failed to load company roles");
      }
    };

    ensureRoles();
  }, [companyId, setRoles]);

  const fetchEmployees = async () => {
    try {
      const res = await hrService.listEmployees();
      setEmployees(res);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Failed to load employees");
    }
  };

  const fetchPerms = async () => {
    setPermsLoading(true);

    try {
      // Fetch every role's and every employee's permissions concurrently
      // instead of a sequential await-loop (previously N+M round-trips run one
      // at a time). Each request still fails independently → null, filtered out.
      const [roleResults, empResults] = await Promise.all([
        Promise.all(
          roles.map(async (role): Promise<Permission | null> => {
            try {
              const rolePerms =
                await permissionService.getCompanyRolePermissions(role.id);
              if (!rolePerms || rolePerms.length === 0) return null;
              return {
                id: role.id,
                roleId: role.id,
                role: role.name,
                staffId: undefined,
                staffName: "",
                email: "",
                phone: "",
                caps: permissionService.toFrontendCaps(rolePerms),
                active: rolePerms.every((r: any) => r.active !== false),
              };
            } catch (e) {
              console.warn(
                `Failed to load permissions for role=${role.name}:`,
                e,
              );
              return null;
            }
          }),
        ),
        Promise.all(
          employees.map(async (emp): Promise<Permission | null> => {
            if (!emp.id) return null;
            try {
              const empPerms = await permissionService.getEmployeePermissions(
                Number(emp.id),
              );
              if (!empPerms || empPerms.length === 0) return null;
              return {
                id: 100000 + Number(emp.id),
                roleId: undefined,
                role: emp.companyRole || String(emp.role || "Unassigned"),
                staffId: Number(emp.id),
                staffName: `${emp.firstName} ${emp.lastName}`,
                email: emp.email || "",
                phone: emp.phoneNo || "",
                caps: permissionService.toFrontendCaps(empPerms),
                active: empPerms.every((r: any) => r.active !== false),
              };
            } catch (e) {
              console.warn(
                `Failed to load employee override for emp=${emp.id}:`,
                e,
              );
              return null;
            }
          }),
        ),
      ]);

      setPerms(
        [...roleResults, ...empResults].filter(
          (p): p is Permission => p !== null,
        ),
      );
    } catch (err) {
      console.error("Error loading permissions:", err);
    } finally {
      setPermsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (roles.length > 0 && employees.length >= 0) {
      fetchPerms();
    }
  }, [roles, employees.length]);

  const displayed = useMemo(() => {
    let list = perms;
    if (filterRole !== "All") {
      list = list.filter(
        (p) => normalizeRole(p.role) === normalizeRole(filterRole),
      );
    }
    if (q) {
      list = list.filter(
        (p) =>
          (p.staffName ?? "").toLowerCase().includes(q.toLowerCase()) ||
          p.role.toLowerCase().includes(q.toLowerCase()) ||
          (p.email ?? "").toLowerCase().includes(q.toLowerCase()),
      );
    }
    return list;
  }, [perms, q, filterRole]);

  // Client-side pagination for the permission rules list (5 / 10 / 15 / 20).
  const {
    pageItems: pagedPerms,
    pageIndex: permPageIndex,
    setPageIndex: setPermPageIndex,
    pageSize: permPageSize,
    setPageSize: setPermPageSize,
    pageCount: permPageCount,
    total: permTotal,
  } = usePagination(displayed, 5);

  // Jump back to the first page whenever the filter or search changes.
  useEffect(() => {
    setPermPageIndex(0);
  }, [q, filterRole, setPermPageIndex]);

  const openAddPerm = () => {
    setPermForm({
      id: undefined,
      roleId: undefined,
      role: "",
      staffId: undefined,
      caps: emptyCaps(),
      active: true,
    });
    setModal("perm");
  };

  const openEditPerm = (rec: Permission) => {
    setPermForm({
      ...rec,
      roleId: rec.roleId,
      caps: JSON.parse(JSON.stringify(rec.caps)),
    });
    setModal("perm");
  };

  const applyPreset = (role: string) => {
    const preset = ROLE_PRESETS[role];
    if (preset) {
      // Expand coarse presets into own/all granular caps.
      const expanded = Object.fromEntries(
        Object.entries(preset).map(([mod, caps]) => [mod, expandCaps(caps)]),
      );
      setPermForm((v) => ({ ...v, caps: expanded }));
    }
  };

  const savePerm = async () => {
    if (!permForm.roleId && !permForm.staffId) {
      toast.error("Role is required");
      return;
    }

    try {
      const normalizedCaps: Record<string, Record<string, boolean>> = {};
      Object.entries(permForm.caps).forEach(([mod, values]) => {
        normalizedCaps[normalizeModuleKey(mod)] = values;
      });

      const dtos = Object.entries(normalizedCaps).map(([module, perms]) => ({
        module,
        permission: {
          viewOwn: !!perms.view_own,
          viewAll: !!perms.view_all,
          createOwn: !!perms.create_own,
          createAll: !!perms.create_all,
          editOwn: !!perms.edit_own,
          editAll: !!perms.edit_all,
          deleteOwn: !!perms.delete_own,
          deleteAll: !!perms.delete_all,
          approve: !!perms.approve,
        },
      }));

      if (permForm.staffId && Number(permForm.staffId) > 0) {
        await permissionService.assignEmployeePermissions(
          Number(permForm.staffId),
          dtos,
        );
      } else {
        await permissionService.assignCompanyRolePermissions(
          Number(permForm.roleId),
          dtos,
        );
      }

      toast.success("Permissions saved");
      await fetchPerms();
      setModal(null);
    } catch (err) {
      console.error("Permission save failed:", err);
      toast.error("Failed to save permission");
    }
  };

  // Enable/disable a rule server-side (saved but not enforced when off).
  const toggleActive = async (rec: Permission) => {
    const next = !rec.active;
    setPerms((prev) =>
      prev.map((x) => (x.id === rec.id ? { ...x, active: next } : x)),
    );
    try {
      if (rec.staffId && rec.staffId > 0) {
        await permissionService.setEmployeePermissionsActive(rec.staffId, next);
      } else if (rec.roleId) {
        await permissionService.setCompanyRolePermissionsActive(
          rec.roleId,
          next,
        );
      }
      toast.success(next ? "Permission enabled" : "Permission disabled");
    } catch (err) {
      console.error("Failed to update permission status", err);
      setPerms((prev) =>
        prev.map((x) => (x.id === rec.id ? { ...x, active: !next } : x)),
      );
      toast.error("Failed to update status");
    }
  };

  const openEditRole = (r: Role) => {
    setRoleForm({ ...r });
    setModal("role");
  };

  const removeAllForRole = async () => {
    if (!removePermsRole) return;

    try {
      await permissionService.removeAllCompanyRolePermissions(
        removePermsRole.id,
      );
      toast.success("Permissions removed");
      await fetchPerms();
      setRemovePermsRole(null);
    } catch (error) {
      console.error("Error removing permissions:", error);
      toast.error("Failed to remove permissions");
    }
  };

  const removePermission = async (rec: Permission) => {
    try {
      if (rec.staffId) {
        await permissionService.removeAllEmployeePermissions(rec.staffId);
      } else if (rec.roleId) {
        await permissionService.removeAllCompanyRolePermissions(rec.roleId);
      } else {
        toast.error("Role not found");
        return;
      }

      toast.success("Permission removed");
      await fetchPerms();
      setDel(null);
    } catch (error) {
      console.error("Error removing permission:", error);
      toast.error("Failed to remove permission");
    }
  };

  const deleteRole = async (role: Role) => {
    try {
      await permissionService.deleteRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      setDelRole(null);
      toast.success("Role deleted");
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role");
    }
  };

  const saveRole = async () => {
    if (!roleForm.name?.trim()) return;

    try {
      if (roleForm.id) {
        const payload = {
          id: roleForm.id,
          name: roleForm.name,
          description: roleForm.description,
          companyId: companyId ?? undefined,
        };
        const updated = await permissionService.updateRole(payload as any);
        setRoles((prev) =>
          prev.map((r) =>
            r.id === updated.id
              ? {
                  id: updated.id,
                  name: updated.name,
                  custom: !!updated.custom,
                  description: updated.description,
                  active: updated.active,
                }
              : r,
          ),
        );
        toast.success("Role updated");
      } else {
        const payload = {
          name: roleForm.name,
          description: roleForm.description,
          companyId: companyId ?? undefined,
          active: true,
        };
        const created = await permissionService.createRole(payload as any);
        if (created.id !== undefined) {
          const createdId = created.id;
          setRoles((prev) => [
            ...prev,
            {
              id: createdId,
              name: created.name,
              custom: !!created.custom,
              description: created.description,
              active: created.active,
            },
          ]);
        }
        toast.success("Role created");
      }
      setModal(null);
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("Failed to save role");
    }
  };

  return (
    <div className="space-y-6">
      <SecondaryPageHeader
        title="HR Permissions"
        description="Manage permissions for employees and roles"
        icon={<Shield className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setView((v) => (v === "permissions" ? "roles" : "permissions"))
              }
            >
              {view === "permissions" ? (
                <Settings className="h-4 w-4 mr-2" />
              ) : (
                <ArrowLeft className="h-4 w-4 mr-2" />
              )}
              {view === "permissions" ? "Manage Roles" : "Back to Permissions"}
            </Button>
            {view === "permissions" && (
              <Button
                onClick={openAddPerm}
                className="bg-gradient-to-r from-indigo-600 to-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Permission
              </Button>
            )}
          </div>
        }
      />

      {view === "roles" && (
        <RolesTable
          roles={roles}
          perms={perms}
          onEditRole={openEditRole}
          onRemovePerms={setRemovePermsRole}
          onDeleteRole={setDelRole}
        />
      )}

      {view === "permissions" && (
        <PermissionRulesView
          perms={perms}
          roles={roles}
          q={q}
          setQ={setQ}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          displayed={displayed}
          pagedPerms={pagedPerms}
          pageIndex={permPageIndex}
          pageSize={permPageSize}
          pageCount={permPageCount}
          total={permTotal}
          onPageChange={setPermPageIndex}
          onPageSizeChange={setPermPageSize}
          onEditPerm={openEditPerm}
          onDeletePerm={setDel}
          onToggleActive={toggleActive}
        />
      )}

      {modal === "role" && (
        <RoleFormDialog
          open={modal === "role"}
          roleForm={roleForm}
          setRoleForm={setRoleForm}
          onSave={saveRole}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "perm" && (
        <PermissionFormDialog
          open={modal === "perm"}
          permForm={permForm}
          setPermForm={setPermForm}
          roles={roles}
          employees={employees}
          onApplyPreset={applyPreset}
          onSave={savePerm}
          onClose={() => setModal(null)}
        />
      )}

      <RemovePermissionDialog
        del={del}
        onClose={() => setDel(null)}
        onConfirm={removePermission}
      />

      <DeleteRoleDialog
        delRole={delRole}
        onClose={() => setDelRole(null)}
        onConfirm={deleteRole}
      />

      <RemoveAllPermissionsDialog
        removePermsRole={removePermsRole}
        onClose={() => setRemovePermsRole(null)}
        onConfirm={removeAllForRole}
      />
    </div>
  );
}
