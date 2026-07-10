import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, KeyRound, Shield, Search, Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { TablePagination, usePagination } from "@/components/table-pagination";
import {
  roleBadgeClasses,
  avatarColor,
  nameInitials,
  PERMISSION_PAGE_SIZES,
} from "@/lib/permission-ui";
import {
  CAP_COLUMNS,
  normalizeModuleKey,
  emptyCapsFor,
  type PermissionModuleRow,
} from "@/components/permission-matrix";
import PermissionCards from "@/components/permission-cards";
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
  /**
   * Permission rows presented as a sidebar-style tree. Each entry is a real
   * page / sub-module mapped to its AppModule id, so granting a row directly
   * unlocks that page for the role or employee.
   */
  modules: PermissionModuleRow[];
}

export default function PermissionsTab({ moduleType, modules }: Props) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [modal, setModal] = useState<"perm" | "role" | null>(null);
  const [permForm, setPermForm] = useState<
    Partial<Permission> & { caps: Record<string, Record<string, boolean>> }
  >({ role: "", roleId: undefined, staffId: undefined, caps: {}, active: true });
  const [employees, setEmployees] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [del, setDel] = useState<Permission | null>(null);

  // Total grantable capabilities across this area's pages (pages × 6 caps).
  const TOTAL_CAPS = modules.length * CAP_COLUMNS.length;

  const companyId = user?.companyId ? Number(user.companyId) : null;

  // Full AppModule keys this tab manages (e.g. SALARY, INVENTORY_CATEGORY).
  // `modules[].id` carries the COMPLETE module id — we never prefix it with the
  // moduleType, because HR modules (SALARY, EMPLOYEE_PROFILE, …) are stored
  // unprefixed in AppModule. `moduleType` is only a display label.
  const moduleKeys = useMemo(
    () => new Set(modules.map((m) => normalizeModuleKey(m.id))),
    [modules],
  );

  const emptyCaps = useCallback(() => emptyCapsFor(modules), [modules]);

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
        (sum, m) => sum + CAP_COLUMNS.filter((c) => (m as any)[c.key]).length,
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
      } catch (err: any) {
        console.error("Failed to load roles:", err);
        setRoles([]);
        // A 403 means this user can't manage permissions (the tab should be
        // hidden for them) — don't spam an error toast in that case.
        if (err?.response?.status !== 403) {
          toast.error("Failed to load company roles");
        }
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
            active: rolePerms.every((r: any) => r.active !== false),
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
            active: empPerms.every((r: any) => r.active !== false),
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
          createOwn: !!perms.create_own,
          createAll: !!perms.create_all,
          editOwn: !!perms.edit_own,
          editAll: !!perms.edit_all,
          deleteOwn: !!perms.delete_own,
          deleteAll: !!perms.delete_all,
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

  // Enable/disable a rule server-side (saved but not enforced when off).
  const toggleActive = async (rec: Permission) => {
    const next = !rec.active;
    // Optimistic update; revert on failure.
    setPerms((prev) =>
      prev.map((p) => (p.id === rec.id ? { ...p, active: next } : p)),
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
        prev.map((p) => (p.id === rec.id ? { ...p, active: !next } : p)),
      );
      toast.error("Failed to update status");
    }
  };

  const confirmDelete = async () => {
    if (!del) return;
    try {
      if (del.staffId && del.staffId > 0) {
        await permissionService.removeAllEmployeePermissions(del.staffId);
      } else if (del.roleId) {
        await permissionService.removeAllCompanyRolePermissions(del.roleId);
      }
      toast.success("Permission removed");
      setDel(null);
      await fetchPerms();
    } catch (err) {
      console.error("Failed to remove permission", err);
      toast.error("Failed to remove permission");
    }
  };

  // Client-side pagination (5 / 10 / 15 / 20 per page).
  const {
    pageItems,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageCount,
    total,
  } = usePagination(displayed, 5);

  // Jump back to the first page whenever the filter or search changes.
  useEffect(() => {
    setPageIndex(0);
  }, [q, filterRole, setPageIndex]);

  return (
    <div className="space-y-6">
      <SecondaryPageHeader
        title={`${moduleType === "HR" ? "HR" : moduleType === "FINANCE" ? "Finance" : "Inventory"} Permissions`}
        description="Manage permissions for employees and roles"
        icon={<Shield className="h-5 w-5" />}
        actions={
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-indigo-600 to-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Permission
          </Button>
        }
      />

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Rules", val: perms.length, color: "text-blue-600" },
          {
            label: "Active",
            val: perms.filter((p) => p.active).length,
            color: "text-green-600",
          },
          {
            label: "By Employee",
            val: perms.filter((p) => p.staffId).length,
            color: "text-purple-600",
          },
          {
            label: "By Role",
            val: perms.filter((p) => !p.staffId).length,
            color: "text-yellow-600",
          },
        ].map((s) => (
          <Card key={s.label} className="bg-white border-slate-200">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role filter chips + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {["All", ...roles.map((r) => r.name)].map((r) => (
            <Button
              key={r}
              variant={filterRole === r ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRole(r)}
              className={
                filterRole === r ? "bg-indigo-600 hover:bg-indigo-700" : ""
              }
            >
              {r}
            </Button>
          ))}
        </div>
        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search staff or role..."
            className="pl-9 w-56"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600 w-12">
                SL No.
              </TableHead>
              <TableHead className="font-semibold text-slate-600">Staff Name</TableHead>
              <TableHead className="font-semibold text-slate-600">Role</TableHead>
              <TableHead className="font-semibold text-slate-600">Scope</TableHead>
              <TableHead className="font-semibold text-slate-600">Email</TableHead>
              <TableHead className="font-semibold text-slate-600">Phone</TableHead>
              <TableHead className="font-semibold text-slate-600">Access</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <KeyRound className="h-12 w-12 text-slate-300" />
                    <p className="text-slate-500 font-medium">
                      No permission rules yet
                    </p>
                    <p className="text-slate-400 text-sm">
                      Click 'Add Permission' to grant an employee or role access
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((p, index) => {
                const cnt = countActiveCaps(p.caps);
                const pct = TOTAL_CAPS
                  ? Math.round((cnt / TOTAL_CAPS) * 100)
                  : 0;
                return (
                  <TableRow
                    key={p.id}
                    className={`hover:bg-slate-50/50 ${!p.active ? "opacity-50" : ""}`}
                  >
                    <TableCell className="text-muted-foreground text-sm font-medium tabular-nums">
                      {pageIndex * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p.staffName ? (
                          <Avatar>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(p.staffName)}`}
                            >
                              {nameInitials(p.staffName)}
                            </div>
                          </Avatar>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Users className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {p.staffName || (
                              <span className="italic text-slate-400">
                                All {p.role}s
                              </span>
                            )}
                          </p>
                          {p.staffName && (
                            <p className="text-xs text-slate-400">
                              Individual override
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleBadgeClasses(p.role)}>
                        {p.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          p.staffId
                            ? "border-purple-300 text-purple-700"
                            : "border-green-300 text-green-700"
                        }
                      >
                        {p.staffId ? "Individual" : "Role-wide"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-sm">
                      {p.email || "—"}
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-sm">
                      {p.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct > 70 ? "bg-green-500" : pct > 30 ? "bg-blue-500" : "bg-slate-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {cnt}/{TOTAL_CAPS}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.active}
                          onCheckedChange={() => toggleActive(p)}
                        />
                        <span
                          className={`text-sm font-medium ${p.active ? "text-green-600" : "text-slate-400"}`}
                        >
                          {p.active ? "On" : "Off"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(p)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDel(p)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {displayed.length > 0 && (
          <div className="border-t border-slate-100 px-2">
            <TablePagination
              total={total}
              pageIndex={pageIndex}
              pageSize={pageSize}
              pageCount={pageCount}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              pageSizeOptions={PERMISSION_PAGE_SIZES}
            />
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {del && (
        <Dialog open onOpenChange={() => setDel(null)}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Remove permission</DialogTitle>
              <DialogDescription>
                Remove all {moduleType.toLowerCase()} permissions for{" "}
                <span className="font-semibold">
                  {del.staffName || `all ${del.role}s`}
                </span>
                ? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDel(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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

              <PermissionCards
                modules={modules}
                caps={permForm.caps}
                onChange={(next) =>
                  setPermForm((v) => ({ ...v, caps: next }))
                }
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
