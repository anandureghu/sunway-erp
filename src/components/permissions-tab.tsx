import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, KeyRound } from "lucide-react";
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

interface Role {
  id: number;
  name: string;
  custom: boolean;
  description?: string;
  active?: boolean;
}

interface Permission {
  id: number;
  role: string;
  staffId?: number;
  staffName: string;
  email: string;
  phone: string;
  caps: Record<string, Record<string, boolean>>;
  active: boolean;
}

interface Props {
  moduleType: 'HR' | 'FINANCE' | 'INVENTORY';
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

const FALLBACK_ROLES: Role[] = [
  { id: 1, name: "USER", custom: false },
  { id: 2, name: "ADMIN", custom: false },
];

export default function PermissionsTab({ moduleType, modules }: Props) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [modal, setModal] = useState<"perm" | "role" | null>(null);
  const [permForm, setPermForm] = useState<
    Partial<Permission> & { caps: Record<string, Record<string, boolean>> }
  >({ role: "", staffId: undefined, caps: {}, active: true });
  const [employees, setEmployees] = useState<any[]>([]);
  const [] = useState<Permission | null>(null);
  const [q] = useState("");
  const [filterRole] = useState("All");

  const companyId = user?.companyId ? Number(user.companyId) : null;

  const emptyCaps = useCallback(() => {
    return Object.fromEntries(
      modules.map((m) => [m.id.toUpperCase().replace(/[_-]/g, "_"), Object.fromEntries(CAPS.map((c) => [c.key, false]))]),
    );
  }, [modules]);

  useEffect(() => {
    const ensureRoles = async () => {
      if (roles.length > 0) return;
      try {
        const res = companyId ? await roleService.getRoles(companyId) : await roleService.getRoles();
        if (res && res.length > 0) {
          setRoles(res.map((r: any) => ({
            id: r.id!,
            name: r.name,
            custom: !!r.custom,
            description: r.description,
            active: r.active,
          })));
        } else {
          setRoles(FALLBACK_ROLES);
        }
      } catch (err) {
        console.error("Failed to load roles:", err);
        setRoles(FALLBACK_ROLES);
      }
    };
    ensureRoles();
  }, [companyId, roles.length]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await hrService.listEmployees();
        setEmployees(res || []);
      } catch (err) {
        // ignore if hr service not available
      }
    };
    loadEmployees();
  }, []);

  const fetchPerms = useCallback(async () => {
    try {
      const results: Permission[] = [];
      for (const role of roles) {
        try {
          const rolePerms = await permissionService.getByRole(role.name);
          if (!rolePerms || rolePerms.length === 0) continue;

          const roleWidePerms = rolePerms.filter((p) => !p.employeeId && !p.employee);
          if (roleWidePerms.length > 0) {
            results.push({
              id: role.id,
              role: role.name,
              staffId: undefined,
              staffName: "",
              email: "",
              phone: "",
              caps: permissionService.toFrontendCaps(roleWidePerms),
              active: true,
            });
          }
        } catch (e) {
          console.warn(`Failed role ${role.name}:`, e);
        }
      }
      setPerms(results);
    } catch (err) {
      console.error("Error loading permissions:", err);
    }
  }, [roles]);

  useEffect(() => {
    if (roles.length > 0) fetchPerms();
  }, [roles.length, fetchPerms]);

  const normalizeModuleKey = useCallback((mod: string): string => mod.toUpperCase().replace(/[_-]/g, "_"), []);

  const allModOn = useCallback((modId: string) => CAPS.every((cap) => permForm.caps?.[normalizeModuleKey(modId)]?.[cap.key] || false), [permForm.caps, normalizeModuleKey]);

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
  }, [allModOn, normalizeModuleKey]);

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
  }, [normalizeModuleKey]);

  const savePerm = useCallback(async () => {
    if (!permForm.role) return toast.error("Role is required");

    try {
      const normalizedCaps: Record<string, Record<string, boolean>> = {};
      Object.entries(permForm.caps || {}).forEach(([mod, perms]) => {
        const upperMod = normalizeModuleKey(mod);
        normalizedCaps[`${moduleType}_${upperMod}`] = perms;
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

      let employeeId: number | undefined = undefined;
      if (permForm.staffId && permForm.staffId > 0) employeeId = Number(permForm.staffId);

      const roleToSend = normalizeRole(permForm.role as string);
      await permissionService.assignPermissions(roleToSend, dtos, employeeId);
      toast.success("Permissions saved!");
      fetchPerms();
      setModal(null);
    } catch (err) {
      console.error("Failed to save permissions", err);
      toast.error("Failed to save permissions");
    }
  }, [permForm, moduleType, fetchPerms, normalizeModuleKey]);

  const displayed = useMemo(() => {
    let list = perms;
    if (filterRole !== "All") list = list.filter((p) => normalizeRole(p.role) === normalizeRole(filterRole));
    if (q) list = list.filter((p) => (p.staffName || "").toLowerCase().includes(q.toLowerCase()) || p.role.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [perms, q, filterRole]);

  const openAdd = () => {
    setPermForm({ role: "", staffId: undefined, caps: emptyCaps(), active: true });
    setModal("perm");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{moduleType} Permissions</h2>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Permission
        </Button>
      </div>

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
                <TableCell>{p.staffName || 'Role-wide'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {Object.values(p.caps || {}).reduce((sum, m) => sum + Object.values(m).filter(Boolean).length, 0)} permissions
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">Edit</Button>
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
              <DialogTitle>Add Permission</DialogTitle>
              <DialogDescription>Choose a role and optionally an individual employee, then configure their access.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Role *</label>
                  <select
                    value={permForm.role ?? ""}
                    onChange={(e) => setPermForm((v) => ({ ...v, role: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">None selected</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Scope</label>
                  <select
                    value={permForm.staffId || ""}
                    onChange={(e) => setPermForm((v) => ({ ...v, staffId: Number(e.target.value) || undefined }))}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">None selected (role-wide)</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} — {emp.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[180px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200">
                  <div className="p-2.5 text-xs font-semibold text-slate-600 uppercase">Module</div>
                  {CAPS.map((c) => (
                    <div key={c.key} className="p-2.5 text-xs font-semibold text-slate-600 uppercase text-center">{c.label}</div>
                  ))}
                </div>
                {modules.map((mod) => {
                  const normalizedMod = normalizeModuleKey(mod.id);
                  return (
                    <div key={mod.id} className="grid grid-cols-[180px_repeat(6,1fr)] border-b border-slate-100 last:border-0">
                      <div className="p-3">
                        <p className="text-sm font-medium text-slate-900">{mod.label}</p>
                        <button type="button" onClick={() => toggleAllMod(mod.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          {allModOn(mod.id) ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      {CAPS.map((cap) => (
                        <div key={cap.key} className="flex items-center justify-center p-3">
                          <Switch checked={permForm.caps?.[normalizedMod]?.[cap.key] || false} onCheckedChange={(checked) => toggleCap(mod.id, cap.key, checked)} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Switch checked={permForm.active ?? true} onCheckedChange={(v: boolean) => setPermForm((f) => ({ ...f, active: v }))} />
                <div>
                  <p className="text-sm font-medium text-slate-900">Permission Active</p>
                  <p className="text-xs text-slate-500">Inactive rules are saved but not enforced</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={savePerm}>Save Permissions</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

