import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, KeyRound, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { permissionService } from "@/service/permissionService";
import { normalizeRole } from "@/lib/utils";
import { roleService } from "@/service/roleService";
import { hrService } from "@/service/hr.service";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

interface Role {
  id: number;
  name: string;
  custom: boolean;
  description?: string;
  active?: boolean;
}

interface Permission {
  id: number;
  roleId?: number;
  role: string;
  staffId?: number;
  staffName: string;
  email: string;
  phone: string;
  caps: Record<string, Record<string, boolean>>;
  active: boolean;
}

interface Props {
  moduleType: "HR" | "FINANCE" | "INVENTORY";
  modules: Array<{ id: string; label: string }>;
}

const CAPS = [
  { key: "view_own", label: "View (Own)" },
  { key: "view_all", label: "View (All)" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
];

const normalizeModuleKey = (mod: string): string =>
  mod.toUpperCase().replace(/[_-]/g, "_");

export default function PermissionsTab({ moduleType, modules }: Props) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [modal, setModal] = useState<"perm" | "role" | null>(null);
  const [permForm, setPermForm] = useState<
    Partial<Permission> & { caps: Record<string, Record<string, boolean>> }
  >({ role: "", roleId: undefined, staffId: undefined, caps: {}, active: true });
  const [employees, setEmployees] = useState<any[]>([]);
  const [q] = useState("");
  const [filterRole] = useState("All");

  const companyId = user?.companyId ? Number(user.companyId) : null;

  // Full AppModule keys this tab manages (e.g. SALARY, INVENTORY_CATEGORY).
  // `modules[].id` carries the COMPLETE module id — we never prefix it with the
  // moduleType, because HR modules (SALARY, EMPLOYEE_PROFILE, …) are stored
  // unprefixed in AppModule. `moduleType` is only a display label.
  const moduleKeys = useMemo(
    () => new Set(modules.map((m) => normalizeModuleKey(m.id))),
    [modules],
  );

  const emptyCaps = useCallback(() => {
    return Object.fromEntries(
      modules.map((m) => [
        normalizeModuleKey(m.id),
        Object.fromEntries(CAPS.map((c) => [c.key, false])),
      ]),
    );
  }, [modules]);

  const belongsToModuleType = useCallback(
    (moduleKey: string) => moduleKeys.has(normalizeModuleKey(moduleKey)),
    [moduleKeys],
  );

  const filterCapsForModuleType = useCallback(
    (caps: Record<string, Record<string, boolean>>) => {
      return Object.fromEntries(
        Object.entries(caps).filter(([key]) => belongsToModuleType(key)),
      );
    },
    [belongsToModuleType],
  );

  const capsToForm = useCallback(
    (caps: Record<string, Record<string, boolean>>) => {
      const formCaps = emptyCaps();
      for (const [key, perms] of Object.entries(caps)) {
        const upper = normalizeModuleKey(key);
        // Only merge caps for modules this tab manages; the full key matches
        // a formCaps entry directly (no prefix stripping needed).
        if (formCaps[upper]) {
          formCaps[upper] = { ...formCaps[upper], ...perms };
        }
      }
      return formCaps;
    },
    [emptyCaps],
  );

  const countActiveCaps = useCallback(
    (caps: Record<string, Record<string, boolean>>) =>
      Object.values(filterCapsForModuleType(caps)).reduce(
        (sum, m) => sum + Object.values(m).filter(Boolean).length,
        0,
      ),
    [filterCapsForModuleType],
  );

  useEffect(() => {
    const ensureRoles = async () => {
      try {
        const res = companyId
          ? await roleService.getRoles(companyId)
          : await roleService.getRoles();
        if (res && res.length > 0) {
          setRoles(
            res
              .filter((r: any) => r.id !== undefined)
              .map((r: any) => ({
                id: r.id!,
                name: r.name,
                custom: !!r.custom,
                description: r.description,
                active: r.active,
              })),
          );
        } else {
          setRoles([]);
        }
      } catch (err) {
        console.error("Failed to load roles:", err);
        setRoles([]);
        toast.error("Failed to load company roles");
      }
    };
    ensureRoles();
  }, [companyId]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await hrService.listEmployees();
        setEmployees(res || []);
      } catch {
        // ignore if hr service not available
      }
    };
    loadEmployees();
  }, []);

  const fetchPerms = useCallback(async () => {
    if (roles.length === 0) {
      setPerms([]);
      return;
    }

    try {
      const results: Permission[] = [];

      for (const role of roles) {
        try {
          const rolePerms = await permissionService.getCompanyRolePermissions(
            role.id,
          );
          if (!rolePerms || rolePerms.length === 0) continue;

          const caps = permissionService.toFrontendCaps(rolePerms);
          if (countActiveCaps(caps) === 0) continue;

          results.push({
            id: role.id,
            roleId: role.id,
            role: role.name,
            staffId: undefined,
            staffName: "",
            email: "",
            phone: "",
            caps,
            active: true,
          });
        } catch (e) {
          console.warn(`Failed role ${role.name}:`, e);
        }
      }

      for (const emp of employees) {
        if (!emp.id) continue;
        try {
          const empPerms = await permissionService.getEmployeePermissions(
            Number(emp.id),
          );
          if (!empPerms || empPerms.length === 0) continue;

          const caps = permissionService.toFrontendCaps(empPerms);
          if (countActiveCaps(caps) === 0) continue;

          results.push({
            id: 100000 + Number(emp.id),
            role: emp.companyRole || String(emp.role || "Unassigned"),
            staffId: Number(emp.id),
            staffName: `${emp.firstName} ${emp.lastName}`,
            email: emp.email || "",
            phone: emp.phoneNo || "",
            caps,
            active: true,
          });
        } catch (e) {
          console.warn(`Failed employee ${emp.id}:`, e);
        }
      }

      setPerms(results);
    } catch (err) {
      console.error("Error loading permissions:", err);
    }
  }, [roles, employees, countActiveCaps]);

  useEffect(() => {
    if (roles.length > 0) void fetchPerms();
  }, [roles.length, employees.length, fetchPerms]);

  const allModOn = useCallback(
    (modId: string) =>
      CAPS.every(
        (cap) =>
          permForm.caps?.[normalizeModuleKey(modId)]?.[cap.key] || false,
      ),
    [permForm.caps],
  );

  const toggleAllMod = useCallback((modId: string) => {
    const normalizedMod = normalizeModuleKey(modId);
    const on = !allModOn(modId);
    setPermForm((v) => ({
      ...v,
      caps: {
        ...v.caps,
        [normalizedMod]: Object.fromEntries(CAPS.map((c) => [c.key, on])),
      },
    }));
  }, [allModOn]);

  const toggleCap = useCallback((modId: string, cap: string, checked: boolean) => {
    const normalizedMod = normalizeModuleKey(modId);
    setPermForm((prev) => ({
      ...prev,
      caps: {
        ...prev.caps,
        [normalizedMod]: {
          ...prev.caps[normalizedMod],
          [cap]: checked,
        },
      },
    }));
  }, []);

  const savePerm = useCallback(async () => {
    if (!permForm.roleId && !permForm.staffId) {
      return toast.error("Role is required");
    }

    try {
      const normalizedCaps: Record<string, Record<string, boolean>> = {};
      Object.entries(permForm.caps || {}).forEach(([mod, perms]) => {
        normalizedCaps[normalizeModuleKey(mod)] = perms;
      });

      const dtos = Object.entries(normalizedCaps).map(([module, perms]) => ({
        module,
        permission: {
          viewOwn: !!perms.view_own,
          viewAll: !!perms.view_all,
          create: !!perms.create,
          edit: !!perms.edit,
          deletePermission: !!perms.delete,
          approve: !!perms.approve,
        },
      }));

      if (permForm.staffId && permForm.staffId > 0) {
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

      toast.success("Permissions saved!");
      await fetchPerms();
      setModal(null);
    } catch (err) {
      console.error("Failed to save permissions", err);
      toast.error("Failed to save permissions");
    }
  }, [permForm, fetchPerms]);

  const displayed = useMemo(() => {
    let list = perms;
    if (filterRole !== "All")
      list = list.filter(
        (p) => normalizeRole(p.role) === normalizeRole(filterRole),
      );
    if (q)
      list = list.filter(
        (p) =>
          (p.staffName || "").toLowerCase().includes(q.toLowerCase()) ||
          p.role.toLowerCase().includes(q.toLowerCase()),
      );
    return list;
  }, [perms, q, filterRole]);

  const openAdd = () => {
    setPermForm({
      role: "",
      roleId: undefined,
      staffId: undefined,
      caps: emptyCaps(),
      active: true,
    });
    setModal("perm");
  };

  const openEdit = (rec: Permission) => {
    setPermForm({
      ...rec,
      roleId: rec.roleId,
      caps: capsToForm(rec.caps),
      active: rec.active ?? true,
    });
    setModal("perm");
  };

  return (
    <div className="space-y-6">
      <SecondaryPageHeader
        title={`${moduleType === "HR" ? "HR" : moduleType === "FINANCE" ? "Finance" : "Inventory"} Permissions`}
        description={`Manage permissions for ${moduleType === "HR" ? "HR" : moduleType === "FINANCE" ? "Finance" : "Inventory"}`}
        icon={<Shield className="h-5 w-5" />}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Permission
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayed.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 h-32">
                <KeyRound className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                <p className="text-slate-500">No permissions configured</p>
              </TableCell>
            </TableRow>
          ) : (
            displayed.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.role}</TableCell>
                <TableCell>{p.staffName || "Role-wide"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {countActiveCaps(p.caps)} permissions
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(p)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {modal === "perm" && (
        <Dialog open onOpenChange={() => setModal(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {permForm.id ? "Edit Permission" : "Add Permission"}
              </DialogTitle>
              <DialogDescription>
                Choose a company role and optionally an individual employee, then
                configure their access.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Role *
                  </label>
                  <select
                    value={permForm.roleId ?? ""}
                    onChange={(e) => {
                      const roleId = Number(e.target.value) || undefined;
                      const role = roles.find((r) => r.id === roleId);
                      setPermForm((v) => ({
                        ...v,
                        roleId,
                        role: role?.name ?? "",
                      }));
                    }}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">None selected</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Scope
                  </label>
                  <select
                    value={permForm.staffId || ""}
                    onChange={(e) =>
                      setPermForm((v) => ({
                        ...v,
                        staffId: Number(e.target.value) || undefined,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">None selected (role-wide)</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} — {emp.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[180px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200">
                  <div className="p-2.5 text-xs font-semibold text-slate-600 uppercase">
                    Module
                  </div>
                  {CAPS.map((c) => (
                    <div
                      key={c.key}
                      className="p-2.5 text-xs font-semibold text-slate-600 uppercase text-center"
                    >
                      {c.label}
                    </div>
                  ))}
                </div>
                {modules.map((mod) => {
                  const normalizedMod = normalizeModuleKey(mod.id);
                  return (
                    <div
                      key={mod.id}
                      className="grid grid-cols-[180px_repeat(6,1fr)] border-b border-slate-100 last:border-0"
                    >
                      <div className="p-3">
                        <p className="text-sm font-medium text-slate-900">
                          {mod.label}
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleAllMod(mod.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {allModOn(mod.id) ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      {CAPS.map((cap) => (
                        <div
                          key={cap.key}
                          className="flex items-center justify-center p-3"
                        >
                          <Switch
                            checked={
                              permForm.caps?.[normalizedMod]?.[cap.key] || false
                            }
                            onCheckedChange={(checked) =>
                              toggleCap(mod.id, cap.key, checked)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

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
              <Button variant="outline" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button onClick={savePerm}>Save Permissions</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
