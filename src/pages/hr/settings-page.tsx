import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Lock, ArrowLeft, Plus, Trash2, Edit, Search, Settings, Briefcase, Building2, KeyRound, Calendar, CheckCircle2, XCircle, Users, Loader2 } from "lucide-react";
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
import { DepartmentDialog } from "@/pages/admin/hr/department/department-dialog";
import type { Department } from "@/types/department";
import { jobCodeService } from "@/service/jobCodeService";
import { fetchDepartments, deleteDepartment } from "@/service/departmentService";
import { hrService } from "@/service/hr.service";
import { permissionService } from "@/service/permissionService";
import type { Employee } from "@/types/hr";
import { RoleName } from "@/types/role";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Role {
  id: number;
  name: string;
  custom: boolean;
  description?: string;
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
  role: string;
  staffId: string;
  staffName: string;
  email: string;
  phone: string;
  caps: Record<string, Record<string, boolean>>;
  active: boolean;
}


// ─── Constants ────────────────────────────────────────────────────────────────
// Default roles using RoleName enum values
const DEFAULT_ROLES: Role[] = [
  { id: 1, name: RoleName.USER,               custom: false },
  { id: 2, name: RoleName.ADMIN,              custom: false },
  { id: 3, name: RoleName.HR,                 custom: false },
  { id: 4, name: RoleName.SUPER_ADMIN,        custom: false },
  { id: 5, name: RoleName.FINANCE_MANAGER,    custom: false },
  { id: 6, name: RoleName.ACCOUNTANT,         custom: false },
  { id: 7, name: RoleName.AP_AR_CLERK,        custom: false },
  { id: 8, name: RoleName.CONTROLLER,         custom: false },
  { id: 9, name: RoleName.AUDITOR_EXTERNAL,   custom: false },
];

const HR_MODULES = [
  { id: "employee_profile", label: "Employee Profile" },
  { id: "current_job",      label: "Current Job"     },
  { id: "salary",           label: "Salary"          },
  { id: "leaves",           label: "Leaves"          },
  { id: "loans",            label: "Loans"           },
  { id: "dependents",       label: "Dependents"       },
  { id: "appraisal",        label: "Appraisal"       },
  { id: "immigration",      label: "Immigration"     },
  { id: "hr_reports",       label: "HR Reports"      },
  { id: "hr_settings",      label: "HR Settings"     },
];

const CAPS = [
  { key: "view_own",  label: "View (Own)"  },
  { key: "view_all",  label: "View (All)"  },
  { key: "create",    label: "Create"      },
  { key: "edit",      label: "Edit"        },
  { key: "delete",    label: "Delete"      },
  { key: "approve",   label: "Approve"     },
];

const LEVELS = ["Intern","Junior","Mid","Senior","Lead","Manager","Director","C-Level"];
const GRADES = ["G1","G2","G3","G4","G5","G6","G7","G8","G9"];

const ROLE_PRESETS: Record<string, Record<string, Record<string, boolean>>> = {
  "Admin": Object.fromEntries(HR_MODULES.map(m => [m.id, Object.fromEntries(CAPS.map(c => [c.key, true]))])),
  "HR": Object.fromEntries(HR_MODULES.map(m => [m.id, { view_own: true, view_all: true, create: true, edit: true, delete: m.id !== "hr_settings", approve: m.id === "leaves" || m.id === "appraisal" }])),
  "Super Admin": Object.fromEntries(HR_MODULES.map(m => [m.id, Object.fromEntries(CAPS.map(c => [c.key, true]))])),
  "Finance Manager": Object.fromEntries(HR_MODULES.map(m => [m.id, { view_own: true, view_all: m.id === "payroll" || m.id === "reports", create: m.id === "payroll", edit: m.id === "payroll", delete: false, approve: m.id === "payroll" || m.id === "claims" }])),
  "Accountant": Object.fromEntries(HR_MODULES.map(m => [m.id, { view_own: true, view_all: m.id === "payroll", create: m.id === "payroll", edit: m.id === "payroll", delete: false, approve: false }])),
  "AP/AR Clerk": Object.fromEntries(HR_MODULES.map(m => [m.id, { view_own: true, view_all: false, create: m.id === "claims", edit: m.id === "claims", delete: false, approve: false }])),
  "Controller": Object.fromEntries(HR_MODULES.map(m => [m.id, { view_own: true, view_all: true, create: false, edit: false, delete: false, approve: m.id === "payroll" || m.id === "reports" }])),
  "Auditor (External)": Object.fromEntries(HR_MODULES.map(m => [m.id, { view_own: true, view_all: true, create: false, edit: false, delete: false, approve: false }])),
  "User": Object.fromEntries(HR_MODULES.map(m => [m.id, { view_own: true, view_all: false, create: false, edit: false, delete: false, approve: false }])),
};

const TOTAL_CAPS = HR_MODULES.length * CAPS.length;
const emptyCaps = (): Record<string, Record<string, boolean>> =>
  Object.fromEntries(HR_MODULES.map(m => [m.id, Object.fromEntries(CAPS.map(c => [c.key, false]))]));

// ─── Role Colors (Tailwind) ─────────────────────────────────────────────────
const ROLE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  "Admin":              { bg: "bg-purple-100", color: "text-purple-700", border: "border-purple-200" },
  "HR":                 { bg: "bg-indigo-100", color: "text-indigo-700", border: "border-indigo-200" },
  "Super Admin":        { bg: "bg-orange-100", color: "text-orange-700", border: "border-orange-200" },
  "Finance Manager":    { bg: "bg-yellow-100", color: "text-yellow-700", border: "border-yellow-200" },
  "Accountant":         { bg: "bg-green-100", color: "text-green-700", border: "border-green-100" },
  "AP/AR Clerk":        { bg: "bg-sky-100", color: "text-sky-700", border: "border-sky-200" },
  "Controller":         { bg: "bg-pink-100", color: "text-pink-700", border: "border-pink-200" },
  "Auditor (External)": { bg: "bg-red-100", color: "text-red-700", border: "border-red-200" },
  "User":               { bg: "bg-gray-100", color: "text-gray-700", border: "border-gray-200" },
};

const AVATAR_COLORS = ["bg-blue-500","bg-purple-500","bg-cyan-500","bg-green-500","bg-yellow-500","bg-red-500","bg-pink-500"];

// ─── Job Codes Tab ────────────────────────────────────────────────────────────
function JobCodesTab({ jobs, setJobs }: {
  jobs: JobCode[];
  setJobs: React.Dispatch<React.SetStateAction<JobCode[]>>;
}) {
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState<Partial<JobCode>>({});
  const [del,   setDel]   = useState<JobCode | null>(null);
  const [q,     setQ]     = useState("");
  const [, setLoading] = useState(true);
  const F = (p: Partial<JobCode>) => setForm(v => ({ ...v, ...p }));

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

  const filtered = jobs.filter(j =>
    j.code.toLowerCase().includes(q.toLowerCase()) ||
    j.title.toLowerCase().includes(q.toLowerCase())
  );

  const openAdd  = () => { setForm({ code: "", title: "", level: "Mid", grade: "G3", active: true }); setModal(true); };
  const openEdit = (r: JobCode) => { setForm({ ...r }); setModal(true); };
  
  const save = async () => {
    if (!form.code || !form.title) return;
    setLoading(true);
    try {
      const payload = {
        code: form.code,
        title: form.title,
        level: form.level || "Mid",
        grade: form.grade || "G3",
        active: form.active ?? true
      };
      
      if (form.id) {
        const updated = await jobCodeService.update(form.id, payload);
        setJobs(prev => prev.map(j => j.id === form.id ? updated : j));
        toast.success("Job code updated");
      } else {
        const created = await jobCodeService.create(payload);
        setJobs(prev => [...prev, created]);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Job Codes</h2>
          <p className="text-sm text-slate-500 mt-1">Admin defines job codes with title, level and grade.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search..."
              className="pl-9 w-48"
            />
          </div>
          <Button onClick={openAdd} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Job Code
          </Button>
        </div>
      </div>

      {/* Table */}
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
                    <Button variant="ghost" size="sm" onClick={() => setDel(j)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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

      {/* Add/Edit Modal */}
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
                  onChange={e => F({ code: e.target.value.toUpperCase() })}
                  placeholder="ENG-003"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Grade *</label>
                <select
                  value={form.grade ?? "G3"}
                  onChange={e => F({ grade: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Job Title *</label>
              <Input
                value={form.title ?? ""}
                onChange={e => F({ title: e.target.value })}
                placeholder="Software Engineer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Job Level *</label>
                <select
                  value={form.level ?? "Mid"}
                  onChange={e => F({ level: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
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

      {/* Delete Confirmation */}
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
            <Button variant="destructive" onClick={() => {
              setJobs(prev => prev.filter(j => j.id !== del?.id));
              setDel(null);
              toast.success("Job code deleted");
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Departments Tab ──────────────────────────────────────────────────────────
function DepartmentsTab() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [q, setQ] = useState("");
  const { user } = useAuth();
  
  // Get companyId from user - handle both string and number formats
  const companyId = user?.companyId ? Number(user.companyId) : null;

  useEffect(() => {
    if (companyId) {
      fetchDepartmentsData();
    }
  }, [companyId]);

  const fetchDepartmentsData = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const data = await fetchDepartments(companyId);
      if (data) {
        setDepts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      toast.error("Failed to load departments");
      setDepts([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = depts.filter(d =>
    d.departmentCode.toLowerCase().includes(q.toLowerCase()) ||
    d.departmentName.toLowerCase().includes(q.toLowerCase())
  );

  const handleSuccess = (updated: Department, mode: "add" | "edit") => {
    if (mode === "add") {
      setDepts((prev) => [...prev, updated]);
    } else {
      setDepts((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
    }
    setDialogOpen(false);
    setSelectedDept(null);
  };

  const handleEdit = (dept: Department) => {
    setSelectedDept(dept);
    setDialogOpen(true);
  };

  const handleDelete = async (dept: Department) => {
    if (!companyId) {
      toast.error("Company not selected");
      return;
    }
    try {
      await deleteDepartment(companyId, dept.id);
      toast.success(`Deleted ${dept.departmentName}`);
      setDepts((prev) => prev.filter((d) => d.id !== dept.id));
    } catch {
      toast.error("Failed to delete department");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-500">Loading departments...</span>
      </div>
    );
  }

  // Show message if no company selected
  if (!companyId) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">
          Loading company information...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Department Codes</h2>
          <p className="text-sm text-slate-500 mt-1">Admin defines department codes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search..."
              className="pl-9 w-48"
            />
          </div>
          <Button 
            onClick={() => { setSelectedDept(null); setDialogOpen(true); }} 
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600">Department Code</TableHead>
              <TableHead className="font-semibold text-slate-600">Department Name</TableHead>
              <TableHead className="font-semibold text-slate-600">Manager ID</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <code className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                    {d.departmentCode}
                  </code>
                </TableCell>
                <TableCell className="font-medium text-slate-900">{d.departmentName}</TableCell>
                <TableCell>
                  <span className="text-slate-600">{d.managerId || "—"}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(d)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(d)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-12 w-12 text-slate-300" />
                    <p className="text-slate-500 font-medium">No departments found</p>
                    <p className="text-slate-400 text-sm">Add your first department to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Department Dialog - pass companyId */}
      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={selectedDept}
        onSuccess={handleSuccess}
        companyId={companyId}
      />
    </div>
  );
}

// ─── Permissions Tab ──────────────────────────────────────────────────────────
function PermissionsTab({ roles, setRoles }: {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
}) {
  // Ensure roles are loaded when this tab mounts or when empty
  useEffect(() => {
    const ensureRoles = async () => {
      if (roles && roles.length > 0) return;
      try {
        const res = await permissionService.getRoles();
        setRoles(res.filter((r: any) => r.id !== undefined).map((r: any) => ({ id: r.id!, name: r.name, custom: !!r.custom, description: r.description })));
      } catch (err) {
        console.error("Failed to load roles in PermissionsTab:", err);
        setRoles(DEFAULT_ROLES);
      }
    };
    ensureRoles();
  }, []);
  const [perms,        setPerms]        = useState<Permission[]>([]);
  const [, setPermsLoading] = useState(true);
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [view,         setView]         = useState<"permissions" | "roles">("permissions");
  const [modal,        setModal]        = useState<"perm" | "role" | null>(null);
  const [permForm,     setPermForm]     = useState<Partial<Permission> & { caps: Record<string, Record<string, boolean>> }>({ role: "", staffId: "", caps: emptyCaps(), active: true });
  const [roleForm,     setRoleForm]     = useState<Partial<Role>>({ name: "", description: "" });
  const [del,          setDel]          = useState<Permission | null>(null);
  const [delRole,      setDelRole]      = useState<Role | null>(null);
  const [removePermsRole, setRemovePermsRole] = useState<Role | null>(null);
  const [q,            setQ]            = useState("");
  const [filterRole,   setFilterRole]   = useState("All");

  // Fetch employees function - defined before useEffect
  const fetchEmployees = async () => {
    try {
      const res = await hrService.listEmployees();
      setEmployees(res);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Failed to load employees");
    }
  };

// Function to fetch permissions - separated for reuse
  const fetchPerms = async () => {
    setPermsLoading(true);

    try {
      const results = await Promise.all(
        roles.map(async (role) => {
          try {
            const rolePerms = await permissionService.getByRole(role.name);

            if (!rolePerms || rolePerms.length === 0) return null;

            return {
              id: role.id,
              role: role.name,
              staffId: "",
              staffName: "",
              email: "",
              phone: "",
              caps: permissionService.toFrontendCaps(rolePerms),
              active: true,
            };
          } catch {
            return null;
          }
        })
      );

      setPerms(results.filter(Boolean) as Permission[]);
    } catch (error) {
      console.error("Error loading permission rules:", error);
    } finally {
      setPermsLoading(false);
    }
  };

  // Load employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Load existing permission rules from backend when PermissionsTab mounts
  // Also refetch when roles are loaded (when roles length changes from 0 to >0)
  useEffect(() => {
    if (roles.length > 0) {
      fetchPerms();
    }
  }, [roles.length]);

  const displayed = useMemo(() => {
    let list = perms;
    if (filterRole !== "All") list = list.filter(p => p.role === filterRole);
    if (q) list = list.filter(p =>
      (p.staffName ?? "").toLowerCase().includes(q.toLowerCase()) ||
      p.role.toLowerCase().includes(q.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(q.toLowerCase())
    );
    return list;
  }, [perms, q, filterRole]);

  const toggleCap    = (mod: string, cap: string) =>
    setPermForm(v => ({ ...v, caps: { ...v.caps, [mod]: { ...v.caps[mod], [cap]: !v.caps[mod][cap] } } }));
  const allModOn     = (mod: string) => CAPS.every(c => permForm.caps?.[mod]?.[c.key]);
  const toggleAllMod = (mod: string) => {
    const on = !allModOn(mod);
    setPermForm(v => ({ ...v, caps: { ...v.caps, [mod]: Object.fromEntries(CAPS.map(c => [c.key, on])) } }));
  };
  const capCount = (rec: Permission) =>
    Object.values(rec.caps ?? {}).reduce((acc, m) => acc + Object.values(m).filter(Boolean).length, 0);

  const openAddPerm  = () => { setPermForm({ id: undefined, role: "", staffId: "", caps: emptyCaps(), active: true }); setModal("perm"); };
  const openEditPerm = (rec: Permission) => { setPermForm({ ...rec, caps: JSON.parse(JSON.stringify(rec.caps)) }); setModal("perm"); };
  const applyPreset  = (role: string) => {
    if (ROLE_PRESETS[role]) setPermForm(v => ({ ...v, caps: JSON.parse(JSON.stringify(ROLE_PRESETS[role])) }));
  };
  const savePerm = async () => {
    if (!permForm.role) return;
    const emp = employees.find(e => String(e.id) === String(permForm.staffId));
    const rec: Permission = {
      ...permForm, id: permForm.id ?? Date.now(), role: permForm.role!,
      staffId: permForm.staffId ?? "", staffName: emp ? `${emp.firstName} ${emp.lastName}`.trim() : "",
      email: emp?.email ?? "", phone: emp?.phoneNo ?? "", active: permForm.active ?? true,
    };

    try {
      // If this is a role-wide permission (no staff override), persist via NEW backend API
      // Using /api/role-permissions/{role} endpoint with role name
      // Convert caps to backend ModulePermission[] payload
      const backendPayload = permissionService.toBackendPermissions(rec.caps as any);
      // Use role-name based endpoint for role permissions (backend RolePermissionController)
      const roleObj = roles.find(r => r.name === rec.role);
      if (roleObj) {
        await permissionService.assignRolePermissions(roleObj.name, backendPayload as any);
        toast.success("Permissions saved");
      } else {
        toast.error("Role not found on server");
      }

      // Refetch permissions from backend to ensure UI is in sync
      await fetchPerms();
      setModal(null);
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    }
  };
  const toggleActive = (id: number) => setPerms(prev => prev.map(x => x.id === id ? { ...x, active: !x.active } : x));

  const openAddRole  = ()        => { setRoleForm({ name: "", description: "", id: undefined }); setModal("role"); };
  const openEditRole = (r: Role) => { setRoleForm({ ...r }); setModal("role"); };
  
  // Handle delete - removes all permissions for a role by calling backend
  const handleDelete = async (role: string) => {
    try {
      await permissionService.removeAll(role); // 👈 CALL BACKEND
      toast.success("Permission removed");
      
      // Reload permissions from backend
      await fetchPerms();
    } catch (error) {
      console.error("Error removing permissions:", error);
      toast.error("Failed to remove permission");
    }
  };

  const saveRole = async () => {
    if (!roleForm.name?.trim()) return;
    try {
      if (roleForm.id) {
        const payload = { id: roleForm.id, name: roleForm.name, description: roleForm.description };
        const updated = await permissionService.updateRole(payload as any);
        setRoles(prev => prev.map(r => r.id === updated.id ? { id: updated.id, name: updated.name, custom: !!updated.custom, description: updated.description } : r));
        toast.success("Role updated");
      } else {
        const payload = { name: roleForm.name, description: roleForm.description };
        const created = await permissionService.createRole(payload as any);
        if (created.id !== undefined) {
          setRoles(prev => [...prev, { id: created.id!, name: created.name, custom: !!created.custom, description: created.description }]);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Permissions</h2>
          <p className="text-sm text-slate-500 mt-1">Grant employees or roles access to HR modules.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setView(v => v === "permissions" ? "roles" : "permissions")}>
            {view === "permissions" ? <Settings className="h-4 w-4 mr-2" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
            {view === "permissions" ? "Manage Roles" : "Back to Permissions"}
          </Button>
          {view === "permissions" ? (
            <Button onClick={openAddPerm} className="bg-gradient-to-r from-indigo-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Permission
            </Button>
          ) : (
            <Button onClick={openAddRole} className="bg-gradient-to-r from-indigo-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              New Role
            </Button>
          )}
        </div>
      </div>

      {/* ── Roles view ─────────────────────────────────────────────────── */}
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
                    <Badge className={`${ROLE_STYLES[r.name]?.bg || "bg-gray-100"} ${ROLE_STYLES[r.name]?.color || "text-gray-700"} border ${ROLE_STYLES[r.name]?.border || "border-gray-200"}`}>
                      {r.name}
                      {r.custom && <span className="ml-1 text-[10px]">CUSTOM</span>}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.custom ? "border-purple-300 text-purple-700" : "border-slate-300 text-slate-600"}>
                      {r.custom ? "Custom" : "System"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{r.description || "—"}</TableCell>
                  <TableCell className="text-slate-500">{perms.filter(p => p.role === r.name).length} rule(s)</TableCell>
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
                        <Button variant="ghost" size="sm" onClick={() => setDelRole(r)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Permissions view ────────────────────────────────────────────── */}
      {view === "permissions" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Rules",  val: perms.length,                        color: "text-blue-600" },
              { label: "Active",       val: perms.filter(p => p.active).length,  color: "text-green-600" },
              { label: "By Employee",   val: perms.filter(p => p.staffId).length, color: "text-purple-600" },
              { label: "By Role",       val: perms.filter(p => !p.staffId).length,color: "text-yellow-600" },
            ].map(s => (
              <Card key={s.label} className="bg-white border-slate-200">
                <CardContent className="p-4">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {["All", ...roles.map(r => r.name)].map(r => (
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
                onChange={e => setQ(e.target.value)}
                placeholder="Search staff or role..."
                className="pl-9 w-56"
              />
            </div>
          </div>

          {/* Table */}
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
                ) : displayed.map((p) => {
                  const cnt = capCount(p);
                  const pct = Math.round((cnt / TOTAL_CAPS) * 100);
                  return (
                    <TableRow key={p.id} className={`hover:bg-slate-50/50 ${!p.active && 'opacity-50'}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.staffName ? (
                            <Avatar>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${AVATAR_COLORS[p.staffName.charCodeAt(0) % AVATAR_COLORS.length]}`}>
                                {p.staffName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
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
                        <Badge className={`${ROLE_STYLES[p.role]?.bg || "bg-gray-100"} ${ROLE_STYLES[p.role]?.color || "text-gray-700"} border ${ROLE_STYLES[p.role]?.border || "border-gray-200"}`}>
                          {p.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={p.staffId ? "border-purple-300 text-purple-700" : "border-green-300 text-green-700"}>
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
                          <span className="text-xs text-slate-500">{cnt}/{TOTAL_CAPS}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={p.active}
                            onChange={() => toggleActive(p.id)}
                          />
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
                          <Button variant="ghost" size="sm" onClick={() => setDel(p)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Role Modal */}
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
                  onChange={e => setRoleForm(v => ({ ...v, name: e.target.value }))}
                  placeholder="e.g. HR Supervisor"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <Input
                  value={roleForm.description ?? ""}
                  onChange={e => setRoleForm(v => ({ ...v, description: e.target.value }))}
                  placeholder="e.g. Oversees HR operations"
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                💡 After creating the role, go to <strong>Permissions</strong> and add a rule to configure access.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={saveRole}>{roleForm.id ? "Save Changes" : "Create Role"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Permission Modal */}
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
                    value={permForm.role ?? ""}
                    onChange={e => { setPermForm(v => ({ ...v, role: e.target.value })); applyPreset(e.target.value); }}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None selected</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}{r.custom ? " (Custom)" : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Staff Name</label>
                  <select
                    value={permForm.staffId ?? ""}
                    onChange={e => setPermForm(v => ({ ...v, staffId: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None selected (role-wide)</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              {permForm.role && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-blue-700">✅ Default permissions loaded for <strong>{permForm.role}</strong></span>
                  <Button variant="ghost" size="sm" onClick={() => setPermForm(v => ({ ...v, caps: emptyCaps() }))}>
                    Clear all
                  </Button>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[180px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200">
                  <div className="p-2.5 text-xs font-semibold text-slate-600 uppercase">Module</div>
                  {CAPS.map(c => (
                    <div key={c.key} className="p-2.5 text-xs font-semibold text-slate-600 uppercase text-center">
                      {c.label}
                    </div>
                  ))}
                </div>
                {HR_MODULES.map((mod) => {
                  const caps = permForm.caps?.[mod.id] ?? {};
                  const all  = allModOn(mod.id);
                  return (
                    <div key={mod.id} className="grid grid-cols-[180px_repeat(6,1fr)] border-b border-slate-100 last:border-0">
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
                      {CAPS.map(cap => (
                        <div key={cap.key} className="flex items-center justify-center p-3">
                          <input
                            type="checkbox"
                            checked={!!caps[cap.key]}
                            onChange={() => toggleCap(mod.id, cap.key)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
                  onCheckedChange={(v: boolean) => setPermForm(f => ({ ...f, active: v }))}
                />
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

      {/* Delete Permission */}
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
                  // 👇 DELETE FROM BACKEND
                  await permissionService.removeAll(del.role);

                  toast.success("Permission removed");

                  // 👇 Reload from server
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

      {/* Delete Role */}
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
            <Button variant="destructive" onClick={async () => {
              if (!delRole) return;
              try {
                await permissionService.deleteRole(delRole.id);
                setRoles(prev => prev.filter(r => r.id !== delRole?.id));
                setDelRole(null);
                toast.success("Role deleted");
              } catch (error) {
                console.error("Error deleting role:", error);
                toast.error("Failed to delete role");
              }
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove All Permissions for Role */}
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
            <Button variant="destructive" onClick={async () => {
              if (!removePermsRole) return;
              try {
                await handleDelete(removePermsRole.name);
                setRemovePermsRole(null);
              } catch (error) {
                console.error("Error removing permissions:", error);
                toast.error("Failed to remove permissions");
              }
            }}>Remove All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "leaves", label: "Leave Types",  icon: Calendar },
  { id: "jobs",   label: "Job Codes",    icon: Briefcase },
  { id: "depts",  label: "Departments",  icon: Building2 },
  { id: "perms",  label: "Permissions",  icon: KeyRound },
] as const;

type TabId = typeof TABS[number]["id"];

export default function HRSettingsPage() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [tab,   setTab]   = useState<TabId>("leaves");
  const [jobs,  setJobs]  = useState<JobCode[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await permissionService.getRoles();
      // map backend Role shape to local Role interface if necessary
      // Filter out roles with undefined id to avoid runtime errors
      setRoles(res.filter(r => r.id !== undefined).map(r => ({ id: r.id!, name: r.name, custom: !!r.custom, description: r.description })));
    } catch (error) {
      console.error("Error loading roles:", error);
      // fallback to defaults
      setRoles(DEFAULT_ROLES);
    }
  };

  // Allow both ADMIN and SUPER_ADMIN to access HR Settings
  const isAuthorized = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  
  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="flex items-center gap-2">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">HR Settings</h1>
                <p className="text-xs text-slate-500">Manage leave types · job codes · departments · permissions</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 -mb-px">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      tab === t.id
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tab === "leaves" && <LeaveCustomizationForm />}
        {tab === "jobs"   && <JobCodesTab jobs={jobs} setJobs={setJobs} />}
        {tab === "depts"  && <DepartmentsTab />}
        {tab === "perms"  && <PermissionsTab roles={roles} setRoles={setRoles} />}
      </div>
    </div>
  );
}
