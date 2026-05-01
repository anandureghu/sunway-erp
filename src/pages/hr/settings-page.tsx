import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Lock,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Search,
  Settings,
  Briefcase,
  KeyRound,
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
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
import LeaveCustomizationForm from "@/modules/hr/leaves/admin/LeaveCustomizationForm";
import LeaveApprovalPanel from "@/modules/hr/leaves/approval/LeaveApprovalPanel";
import PayrollSettings from "@/modules/hr/payroll/PayrollSettings";
import { jobCodeService } from "@/service/jobCodeService";
import { hrService } from "@/service/hr.service";
import { permissionService } from "@/service/permissionService";
import { normalizeRole } from "@/lib/utils";
import { roleService } from "@/service/roleService";
import type { Employee } from "@/types/hr";
import AppraisalTab from "@/modules/hr/appraisal/AppraisalTab";
import { AppTab } from "@/components/app-tab";

interface Role {
  id: number;
  name: string;
  custom: boolean;
  description?: string;
  active?: boolean;
}

interface JobCode {
  id: number;
  code: string;
  title: string;
  level: string;
  grade: string;
  active: boolean;
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

const HR_MODULES = [
  { id: "employee_profile", label: "Employee Profile" },
  { id: "current_job", label: "Current Job" },
  { id: "salary", label: "Salary" },
  { id: "leaves", label: "Leaves" },
  { id: "loans", label: "Loans" },
  { id: "dependents", label: "Dependents" },
  { id: "appraisal", label: "Appraisal" },
  { id: "immigration", label: "Immigration" },
  { id: "hr_reports", label: "HR Reports" },
  { id: "hr_settings", label: "HR Settings" },
];

const CAPS = [
  { key: "view_own", label: "View (Own)" },
  { key: "view_all", label: "View (All)" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
];

const LEVELS = [
  "Intern",
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Manager",
  "Director",
  "C-Level",
];
const GRADES = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"];

const ROLE_PRESETS: Record<string, Record<string, Record<string, boolean>>> = {
  Admin: Object.fromEntries(
    HR_MODULES.map((m) => [
      m.id.toUpperCase().replace(/[_-]/g, "_"),
      Object.fromEntries(CAPS.map((c) => [c.key, true])),
    ]),
  ),
  HR: Object.fromEntries(
    HR_MODULES.map((m) => {
      const modKey = m.id.toUpperCase().replace(/[_-]/g, "_");
      return [
        modKey,
        {
          view_own: true,
          view_all: true,
          create: true,
          edit: true,
          delete: modKey !== "HR_SETTINGS",
          approve: modKey === "LEAVES" || modKey === "APPRAISAL",
        },
      ];
    }),
  ),
  "Super Admin": Object.fromEntries(
    HR_MODULES.map((m) => [
      m.id.toUpperCase().replace(/[_-]/g, "_"),
      Object.fromEntries(CAPS.map((c) => [c.key, true])),
    ]),
  ),
  "Finance Manager": Object.fromEntries(
    HR_MODULES.map((m) => {
      const modKey = m.id.toUpperCase().replace(/[_-]/g, "_");
      return [
        modKey,
        {
          view_own: true,
          view_all: modKey === "SALARY" || modKey === "HR_REPORTS",
          create: modKey === "SALARY",
          edit: modKey === "SALARY",
          delete: false,
          approve: modKey === "SALARY" || modKey === "LOANS",
        },
      ];
    }),
  ),
  Accountant: Object.fromEntries(
    HR_MODULES.map((m) => {
      const modKey = m.id.toUpperCase().replace(/[_-]/g, "_");
      return [
        modKey,
        {
          view_own: true,
          view_all: modKey === "SALARY",
          create: modKey === "SALARY",
          edit: modKey === "SALARY",
          delete: false,
          approve: false,
        },
      ];
    }),
  ),
  "AP/AR Clerk": Object.fromEntries(
    HR_MODULES.map((m) => {
      const modKey = m.id.toUpperCase().replace(/[_-]/g, "_");
      return [
        modKey,
        {
          view_own: true,
          view_all: false,
          create: modKey === "LOANS",
          edit: modKey === "LOANS",
          delete: false,
          approve: false,
        },
      ];
    }),
  ),
  Controller: Object.fromEntries(
    HR_MODULES.map((m) => {
      const modKey = m.id.toUpperCase().replace(/[_-]/g, "_");
      return [
        modKey,
        {
          view_own: true,
          view_all: true,
          create: false,
          edit: false,
          delete: false,
          approve: modKey === "SALARY" || modKey === "HR_REPORTS",
        },
      ];
    }),
  ),
  "Auditor (External)": Object.fromEntries(
    HR_MODULES.map((m) => [
      m.id.toUpperCase().replace(/[_-]/g, "_"),
      {
        view_own: true,
        view_all: true,
        create: false,
        edit: false,
        delete: false,
        approve: false,
      },
    ]),
  ),
  User: Object.fromEntries(
    HR_MODULES.map((m) => [
      m.id.toUpperCase().replace(/[_-]/g, "_"),
      {
        view_own: true,
        view_all: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
      },
    ]),
  ),
};

const TOTAL_CAPS = HR_MODULES.length * CAPS.length;

const emptyCaps = (): Record<string, Record<string, boolean>> =>
  Object.fromEntries(
    HR_MODULES.map((m) => [
      m.id.toUpperCase().replace(/[_-]/g, "_"),
      Object.fromEntries(CAPS.map((c) => [c.key, false])),
    ]),
  );

const normalizeModuleKey = (mod: string): string =>
  mod.toUpperCase().replace(/[_-]/g, "_");

const ROLE_STYLES: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  Admin: {
    bg: "bg-purple-100",
    color: "text-purple-700",
    border: "border-purple-200",
  },
  HR: {
    bg: "bg-indigo-100",
    color: "text-indigo-700",
    border: "border-indigo-200",
  },
  "Super Admin": {
    bg: "bg-orange-100",
    color: "text-orange-700",
    border: "border-orange-200",
  },
  "Finance Manager": {
    bg: "bg-yellow-100",
    color: "text-yellow-700",
    border: "border-yellow-200",
  },
  Accountant: {
    bg: "bg-green-100",
    color: "text-green-700",
    border: "border-green-100",
  },
  "AP/AR Clerk": {
    bg: "bg-sky-100",
    color: "text-sky-700",
    border: "border-sky-200",
  },
  Controller: {
    bg: "bg-pink-100",
    color: "text-pink-700",
    border: "border-pink-200",
  },
  "Auditor (External)": {
    bg: "bg-red-100",
    color: "text-red-700",
    border: "border-red-200",
  },
  User: {
    bg: "bg-gray-100",
    color: "text-gray-700",
    border: "border-gray-200",
  },
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-pink-500",
];

function JobCodesTab({
  jobs,
  setJobs,
}: {
  jobs: JobCode[];
  setJobs: React.Dispatch<React.SetStateAction<JobCode[]>>;
}) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Partial<JobCode>>({});
  const [del, setDel] = useState<JobCode | null>(null);
  const [q, setQ] = useState("");
  const [, setLoading] = useState(true);
  const F = (p: Partial<JobCode>) => setForm((v) => ({ ...v, ...p }));

  useEffect(() => {
    fetchJobCodes();
  }, []);

  const fetchJobCodes = async () => {
    try {
      setLoading(true);
      const res = await jobCodeService.getAll();
      setJobs(res);
    } catch (error) {
      console.error("Error loading job codes:", error);
      toast.error("Failed to load job codes");
    } finally {
      setLoading(false);
    }
  };

  const filtered = jobs.filter(
    (j) =>
      j.code.toLowerCase().includes(q.toLowerCase()) ||
      j.title.toLowerCase().includes(q.toLowerCase()),
  );

  const openAdd = () => {
    setForm({ code: "", title: "", level: "Mid", grade: "G3", active: true });
    setModal(true);
  };

  const openEdit = (r: JobCode) => {
    setForm({ ...r });
    setModal(true);
  };

  const save = async () => {
    if (!form.code || !form.title) return;
    setLoading(true);
    try {
      const payload = {
        code: form.code,
        title: form.title,
        level: form.level || "Mid",
        grade: form.grade || "G3",
        active: form.active ?? true,
      };

      if (form.id) {
        const updated = await jobCodeService.update(form.id, payload);
        setJobs((prev) => prev.map((j) => (j.id === form.id ? updated : j)));
        toast.success("Job code updated");
      } else {
        const created = await jobCodeService.create(payload);
        setJobs((prev) => [...prev, created]);
        toast.success("Job code created");
      }
      setModal(false);
    } catch (error) {
      console.error("Error saving job code:", error);
      toast.error("Failed to save job code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Job Codes</h2>
          <p className="text-sm text-slate-500 mt-1">
            Admin defines job codes with title, level and grade.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="pl-9 w-48"
            />
          </div>
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Job Code
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600">Job Code</TableHead>
              <TableHead className="font-semibold text-slate-600">Job Title</TableHead>
              <TableHead className="font-semibold text-slate-600">Job Level</TableHead>
              <TableHead className="font-semibold text-slate-600">Grade</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((j) => (
              <TableRow key={j.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <code className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                    {j.code}
                  </code>
                </TableCell>
                <TableCell className="font-medium text-slate-900">{j.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    {j.level}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                    {j.grade}
                  </Badge>
                </TableCell>
                <TableCell>
                  {j.active ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">Inactive</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(j)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDel(j)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Briefcase className="h-12 w-12 text-slate-300" />
                    <p className="text-slate-500 font-medium">No job codes found</p>
                    <p className="text-slate-400 text-sm">Add your first job code to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Job Code" : "Add Job Code"}</DialogTitle>
            <DialogDescription>
              Only Job Code, Title, Level and Grade are set here. Department is assigned on the employee profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Job Code *</label>
                <Input
                  value={form.code ?? ""}
                  onChange={(e) => F({ code: e.target.value.toUpperCase() })}
                  placeholder="ENG-003"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Grade *</label>
                <select
                  value={form.grade ?? "G3"}
                  onChange={(e) => F({ grade: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {GRADES.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Job Title *</label>
              <Input
                value={form.title ?? ""}
                onChange={(e) => F({ title: e.target.value })}
                placeholder="Software Engineer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Job Level *</label>
                <select
                  value={form.level ?? "Mid"}
                  onChange={(e) => F({ level: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={form.active ?? true}
                    onCheckedChange={(checked: boolean) => F({ active: checked })}
                  />
                  <span className="text-sm text-slate-600">{form.active ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save}>Save Job Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!del} onOpenChange={() => setDel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job Code</DialogTitle>
            <DialogDescription>
              Delete "{del?.code} — {del?.title}"? Employees assigned to this code must be reassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setJobs((prev) => prev.filter((j) => j.id !== del?.id));
                setDel(null);
                toast.success("Job code deleted");
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PermissionsTab({
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
      const results: Permission[] = [];

      for (const role of roles) {
        try {
          const rolePerms = await permissionService.getCompanyRolePermissions(role.id);
          if (!rolePerms || rolePerms.length === 0) continue;

          results.push({
            id: role.id,
            roleId: role.id,
            role: role.name,
            staffId: undefined,
            staffName: "",
            email: "",
            phone: "",
            caps: permissionService.toFrontendCaps(rolePerms),
            active: true,
          });
        } catch (e) {
          console.warn(`Failed to load permissions for role=${role.name}:`, e);
        }
      }

      for (const emp of employees) {
        if (!emp.id) continue;

        try {
          const empPerms = await permissionService.getEmployeePermissions(Number(emp.id));
          if (!empPerms || empPerms.length === 0) continue;

          results.push({
            id: 100000 + Number(emp.id),
            roleId: undefined,
            role: emp.companyRole || String(emp.role || "Unassigned"),
            staffId: Number(emp.id),
            staffName: `${emp.firstName} ${emp.lastName}`,
            email: emp.email || "",
            phone: (emp as any).phoneNo || "",
            caps: permissionService.toFrontendCaps(empPerms),
            active: true,
          });
        } catch (e) {
          console.warn(`Failed to load employee override for emp=${emp.id}:`, e);
        }
      }

      setPerms(results);
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
      list = list.filter((p) => normalizeRole(p.role) === normalizeRole(filterRole));
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

  const toggleCap = (modId: string, cap: string, checked: boolean) => {
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
  };

  const allModOn = (modId: string) => {
    const normalizedMod = normalizeModuleKey(modId);
    return CAPS.every((c) => permForm.caps?.[normalizedMod]?.[c.key]);
  };

  const toggleAllMod = (modId: string) => {
    const normalizedMod = normalizeModuleKey(modId);
    const on = !allModOn(modId);
    setPermForm((v) => ({
      ...v,
      caps: {
        ...v.caps,
        [normalizedMod]: Object.fromEntries(CAPS.map((c) => [c.key, on])),
      },
    }));
  };

  const capCount = (rec: Permission) =>
    Object.values(rec.caps ?? {}).reduce(
      (acc, m) => acc + Object.values(m).filter(Boolean).length,
      0,
    );

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
    if (ROLE_PRESETS[role]) {
      setPermForm((v) => ({
        ...v,
        caps: JSON.parse(JSON.stringify(ROLE_PRESETS[role])),
      }));
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
          create: !!perms.create,
          edit: !!perms.edit,
          deletePermission: !!perms.delete,
          approve: !!perms.approve,
        },
      }));

      if (permForm.staffId && Number(permForm.staffId) > 0) {
        await permissionService.assignEmployeePermissions(Number(permForm.staffId), dtos);
      } else {
        await permissionService.assignCompanyRolePermissions(Number(permForm.roleId), dtos);
      }

      toast.success("Permissions saved");
      await fetchPerms();
      setModal(null);
    } catch (err) {
      console.error("Permission save failed:", err);
      toast.error("Failed to save permission");
    }
  };

  const toggleActive = (id: number) =>
    setPerms((prev) =>
      prev.map((x) => (x.id === id ? { ...x, active: !x.active } : x)),
    );

  const openEditRole = (r: Role) => {
    setRoleForm({ ...r });
    setModal("role");
  };

  const handleDelete = async () => {
    if (!removePermsRole) return;

    try {
      await permissionService.removeAllCompanyRolePermissions(removePermsRole.id);
      toast.success("Permissions removed");
      await fetchPerms();
      setRemovePermsRole(null);
    } catch (error) {
      console.error("Error removing permissions:", error);
      toast.error("Failed to remove permissions");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Permissions</h2>
          <p className="text-sm text-slate-500 mt-1">
            Grant employees or roles access to HR modules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setView((v) => (v === "permissions" ? "roles" : "permissions"))}
          >
            {view === "permissions" ? (
              <Settings className="h-4 w-4 mr-2" />
            ) : (
              <ArrowLeft className="h-4 w-4 mr-2" />
            )}
            {view === "permissions" ? "Manage Roles" : "Back to Permissions"}
          </Button>
          {view === "permissions" && (
            <Button onClick={openAddPerm} className="bg-gradient-to-r from-indigo-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Permission
            </Button>
          )}
        </div>
      </div>

      {view === "roles" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-600">Role Name</TableHead>
                <TableHead className="font-semibold text-slate-600">Type</TableHead>
                <TableHead className="font-semibold text-slate-600">Description</TableHead>
                <TableHead className="font-semibold text-slate-600">Permission Rules</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <Badge
                      className={`${ROLE_STYLES[r.name]?.bg || "bg-gray-100"} ${ROLE_STYLES[r.name]?.color || "text-gray-700"} border ${ROLE_STYLES[r.name]?.border || "border-gray-200"}`}
                    >
                      {r.name}
                      {r.custom && <span className="ml-1 text-[10px]">CUSTOM</span>}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={r.custom ? "border-purple-300 text-purple-700" : "border-slate-300 text-slate-600"}
                    >
                      {r.custom ? "Custom" : "System"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{r.description || "—"}</TableCell>
                  <TableCell className="text-slate-500">
                    {perms.filter((p) => p.roleId === r.id && !p.staffId).length} rule(s)
                  </TableCell>
                  <TableCell className="text-right">
                    {r.custom ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditRole(r)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemovePermsRole(r)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Remove all permissions for this role"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDelRole(r)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemovePermsRole(r)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Remove all permissions for this role"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-slate-400 italic">System role</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    No company roles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {view === "permissions" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Rules", val: perms.length, color: "text-blue-600" },
              { label: "Active", val: perms.filter((p) => p.active).length, color: "text-green-600" },
              { label: "By Employee", val: perms.filter((p) => p.staffId).length, color: "text-purple-600" },
              { label: "By Role", val: perms.filter((p) => !p.staffId).length, color: "text-yellow-600" },
            ].map((s) => (
              <Card key={s.label} className="bg-white border-slate-200">
                <CardContent className="p-4">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {["All", ...roles.map((r) => r.name)].map((r) => (
                <Button
                  key={r}
                  variant={filterRole === r ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole(r)}
                  className={filterRole === r ? "bg-indigo-600 hover:bg-indigo-700" : ""}
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
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <KeyRound className="h-12 w-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">No permission rules yet</p>
                        <p className="text-slate-400 text-sm">Click 'Add' to grant an employee or role access</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayed.map((p) => {
                    const cnt = capCount(p);
                    const pct = Math.round((cnt / TOTAL_CAPS) * 100);
                    return (
                      <TableRow key={p.id} className={`hover:bg-slate-50/50 ${!p.active && "opacity-50"}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.staffName ? (
                              <Avatar>
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${AVATAR_COLORS[p.staffName.charCodeAt(0) % AVATAR_COLORS.length]}`}
                                >
                                  {p.staffName
                                    .split(" ")
                                    .map((w) => w[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </div>
                              </Avatar>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                <Users className="h-4 w-4 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900">
                                {p.staffName || <span className="italic text-slate-400">All {p.role}s</span>}
                              </p>
                              {p.staffName && <p className="text-xs text-slate-400">Individual override</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${ROLE_STYLES[p.role]?.bg || "bg-gray-100"} ${ROLE_STYLES[p.role]?.color || "text-gray-700"} border ${ROLE_STYLES[p.role]?.border || "border-gray-200"}`}
                          >
                            {p.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={p.staffId ? "border-purple-300 text-purple-700" : "border-green-300 text-green-700"}
                          >
                            {p.staffId ? "Individual" : "Role-wide"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 font-mono text-sm">{p.email || "—"}</TableCell>
                        <TableCell className="text-slate-500 font-mono text-sm">{p.phone || "—"}</TableCell>
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
                            <Switch checked={p.active} onChange={() => toggleActive(p.id)} />
                            <span className={`text-sm font-medium ${p.active ? "text-green-600" : "text-slate-400"}`}>
                              {p.active ? "On" : "Off"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditPerm(p)}>
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
          </div>
        </>
      )}

      {modal === "role" && (
        <Dialog open={modal === "role"} onOpenChange={() => setModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{roleForm.id ? "Edit Role" : "Create New Role"}</DialogTitle>
              <DialogDescription>
                Custom roles can be assigned when adding permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Role Name *</label>
                <Input
                  value={roleForm.name ?? ""}
                  onChange={(e) => setRoleForm((v) => ({ ...v, name: e.target.value }))}
                  placeholder="e.g. HR Supervisor"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <Input
                  value={roleForm.description ?? ""}
                  onChange={(e) => setRoleForm((v) => ({ ...v, description: e.target.value }))}
                  placeholder="e.g. Oversees HR operations"
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                After creating the role, go to <strong>Permissions</strong> and add a rule to configure access.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={saveRole}>{roleForm.id ? "Save Changes" : "Create Role"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {modal === "perm" && (
        <Dialog open={modal === "perm"} onOpenChange={() => setModal(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{permForm.id ? "Edit Permissions" : "Add Permissions"}</DialogTitle>
              <DialogDescription>
                Choose a role and optionally an individual employee, then configure their HR access.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Role *</label>
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
                        applyPreset(selectedRole.name);
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
                  <label className="text-sm font-medium text-slate-700">Staff Name</label>
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

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[180px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200">
                  <div className="p-2.5 text-xs font-semibold text-slate-600 uppercase">Module</div>
                  {CAPS.map((c) => (
                    <div
                      key={c.key}
                      className="p-2.5 text-xs font-semibold text-slate-600 uppercase text-center"
                    >
                      {c.label}
                    </div>
                  ))}
                </div>

                {HR_MODULES.map((mod) => {
                  const normalizedModKey = normalizeModuleKey(mod.id);
                  const all = allModOn(mod.id);

                  return (
                    <div
                      key={mod.id}
                      className="grid grid-cols-[180px_repeat(6,1fr)] border-b border-slate-100 last:border-0"
                    >
                      <div className="p-3">
                        <p className="text-sm font-medium text-slate-900">{mod.label}</p>
                        <button
                          type="button"
                          onClick={() => toggleAllMod(mod.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {all ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      {CAPS.map((cap) => (
                        <div key={cap.key} className="flex items-center justify-center p-3">
                          <Switch
                            checked={permForm.caps?.[normalizedModKey]?.[cap.key] || false}
                            onCheckedChange={(checked) => toggleCap(mod.id, cap.key, checked)}
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
                  onCheckedChange={(v: boolean) => setPermForm((f) => ({ ...f, active: v }))}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">Permission Active</p>
                  <p className="text-xs text-slate-500">
                    Inactive rules are saved but not enforced
                  </p>
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

      <Dialog open={!!del} onOpenChange={() => setDel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Permission</DialogTitle>
            <DialogDescription>
              Remove permissions for "{del?.staffName || `Role: ${del?.role}`}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!del) return;

                try {
                  if (del.staffId) {
                    await permissionService.removeAllEmployeePermissions(del.staffId);
                  } else if (del.roleId) {
                    await permissionService.removeAllCompanyRolePermissions(del.roleId);
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
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!delRole} onOpenChange={() => setDelRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Delete the custom role "{delRole?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelRole(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!delRole) return;
                try {
                  await permissionService.deleteRole(delRole.id);
                  setRoles((prev) => prev.filter((r) => r.id !== delRole.id));
                  setDelRole(null);
                  toast.success("Role deleted");
                } catch (error) {
                  console.error("Error deleting role:", error);
                  toast.error("Failed to delete role");
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removePermsRole} onOpenChange={() => setRemovePermsRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove All Permissions</DialogTitle>
            <DialogDescription>
              Remove all permissions for role "{removePermsRole?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovePermsRole(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const TABS = [
  { id: "leaves", label: "Leave Types", icon: Calendar },
  { id: "jobs", label: "Job Codes", icon: Briefcase },
  { id: "perms", label: "Permissions", icon: KeyRound },
  { id: "appraisal", label: "Appraisal", icon: Star },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function HRSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [] = useState<TabId>("leaves");
  const [jobs, setJobs] = useState<JobCode[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [] = useState([]);

  const isAuthorized =
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    /hr\s*manager/i.test(user?.companyRole ?? "");

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-center">
              You do not have permission to access HR Settings.
              <br />
              This feature is only available to users with the <strong>ADMIN</strong> or <strong>SUPER_ADMIN</strong> role.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabsList = [
    { value: "leaves", label: "Leave Types", element: () => <LeaveCustomizationForm /> },
    { value: "leave-approvals", label: "Leave Approvals", element: () => <LeaveApprovalPanel /> },
    { value: "jobs", label: "Job Codes", element: () => <JobCodesTab jobs={jobs} setJobs={setJobs} /> },
    { value: "permissions", label: "Permissions", element: () => <PermissionsTab roles={roles} setRoles={setRoles} /> },
    { value: "appraisal", label: "Appraisal", element: () => <AppraisalTab /> },
    { value: "payroll", label: "Payroll", element: () => <PayrollSettings /> },
  ];

  return (
    <div className="p-5">
      <AppTab
        title="HR Settings"
        variant="primary"
        subtitle="Manage leave policies, job codes, permissions, and appraisal"
        tabs={tabsList}
        defaultValue="leaves"
      />
    </div>
  );
}