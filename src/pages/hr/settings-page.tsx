import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { canView } from "@/service/companyService";
import { leaveService } from "@/service/leaveService";
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
  Building,
  Shield,
  X,
  ChevronDown,
  DollarSign,
  TrendingUp,
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
import LoanApprovalPanel from "@/modules/hr/loans/approval/LoanApprovalPanel";
import HrPoliciesForm from "@/modules/hr/policies/HrPoliciesForm";
import { jobCodeService } from "@/service/jobCodeService";
import { hrService } from "@/service/hr.service";
import { permissionService } from "@/service/permissionService";
import { normalizeRole } from "@/lib/utils";
import { roleService } from "@/service/roleService";
import type { Employee } from "@/types/hr";
import AppraisalTab from "@/modules/hr/appraisal/AppraisalTab";
import { AppTab } from "@/components/app-tab";
import { PageHeader } from "@/components/PageHeader";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import SocialSettingsPage from "@/pages/admin/hr/company/social-settings-page";
import DepartmentListPage from "@/pages/admin/hr/department/department-list-page";
import SettingsRolesPage from "@/pages/settings/settings-role-page";
import { TablePagination, usePagination } from "@/components/table-pagination";
import PermissionMatrix from "@/components/permission-matrix";
import { HR_PERMISSION_MODULES } from "@/lib/permission-catalog";
import { PERMISSION_PAGE_SIZES } from "@/lib/permission-ui";

/* ───────────────────────────────────────────────────────────────────────────
   Shared styles + helpers for the Job Code modal.
   Mirror the look/feel of the Add Employee modal in
   src/context/employee-selection.tsx.
   ─────────────────────────────────────────────────────────────────────────── */

const jcInputCls =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

const jcSelectCls =
  "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-[13px] text-slate-800 outline-none transition-all duration-150 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

const jcLabelCls =
  "block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5";

function JcSection({
  icon,
  iconBg,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
        <span className="text-[13px] font-semibold text-slate-700">
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function JcSelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className={jcSelectCls}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

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
  salaryGrade: string;
  minSalary?: number | null;
  maxSalary?: number | null;
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

// HR permission tree comes from the shared catalog (single source of truth,
// same one Finance & Inventory use). Aliased to keep the existing references.
const HR_MODULES = HR_PERMISSION_MODULES;

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

  const {
    pageItems,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageCount,
    total,
  } = usePagination(filtered, 10);

  // Jump back to the first page whenever the search query changes.
  useEffect(() => {
    setPageIndex(0);
  }, [q, setPageIndex]);

  const openAdd = () => {
    setForm({
      code: "",
      title: "",
      level: "Mid",
      salaryGrade: "G3",
      minSalary: null,
      maxSalary: null,
      active: true,
    });
    setModal(true);
  };

  const openEdit = (r: JobCode) => {
    setForm({ ...r });
    setModal(true);
  };

  const save = async () => {
    if (!form.code || !form.title) return;

    const minSalary = form.minSalary ?? null;
    const maxSalary = form.maxSalary ?? null;
    if (
      minSalary != null &&
      maxSalary != null &&
      Number(minSalary) > Number(maxSalary)
    ) {
      toast.error("Min salary cannot exceed max salary");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: form.code,
        title: form.title,
        level: form.level || "Mid",
        salaryGrade: form.salaryGrade || "G3",
        minSalary,
        maxSalary,
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
      <SecondaryPageHeader
        title="Job Codes"
        description="Manage job codes"
        icon={<Briefcase className="h-5 w-5" />}
        actions={
          <>
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
          </>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600">
                Job Code
              </TableHead>
              <TableHead className="font-semibold text-slate-600">
                Job Title
              </TableHead>
              <TableHead className="font-semibold text-slate-600">
                Job Level
              </TableHead>
              <TableHead className="font-semibold text-slate-600">
                Salary Grade
              </TableHead>
              <TableHead className="font-semibold text-slate-600">
                Salary Range
              </TableHead>
              <TableHead className="font-semibold text-slate-600">
                Status
              </TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((j) => (
              <TableRow key={j.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <code className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                    {j.code}
                  </code>
                </TableCell>
                <TableCell className="font-medium text-slate-900">
                  {j.title}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    {j.level}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-yellow-300 text-yellow-700"
                  >
                    {j.salaryGrade}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-700">
                  {j.minSalary != null || j.maxSalary != null ? (
                    <>
                      {j.minSalary != null ? Number(j.minSalary).toLocaleString() : "—"}
                      {" – "}
                      {j.maxSalary != null ? Number(j.maxSalary).toLocaleString() : "—"}
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {j.active ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        Active
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">
                        Inactive
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(j)}
                    >
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
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Briefcase className="h-12 w-12 text-slate-300" />
                    <p className="text-slate-500 font-medium">
                      No job codes found
                    </p>
                    <p className="text-slate-400 text-sm">
                      Add your first job code to get started
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 px-2">
            <TablePagination
              total={total}
              pageIndex={pageIndex}
              pageSize={pageSize}
              pageCount={pageCount}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
          style={{
            maxWidth: 680,
            maxHeight: "92vh",
            width: "calc(100vw - 32px)",
          }}
        >
          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-indigo-100 text-indigo-700">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold leading-tight text-white">
                  {form.id ? "Edit job code" : "Add new job code"}
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-300">
                  Define identity, salary grade, and salary range. Department is
                  assigned on the employee profile.
                </p>
              </div>
            </div>
            <button
              onClick={() => setModal(false)}
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div
            className="space-y-4 overflow-y-auto bg-white px-6 py-5"
            style={{ maxHeight: "calc(92vh - 132px)" }}
          >
            {/* ── Identity ── */}
            <JcSection
              icon={<Briefcase className="h-3.5 w-3.5 text-slate-600" />}
              iconBg="bg-slate-100"
              title="Identity"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={jcLabelCls}>
                    Job code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    value={form.code ?? ""}
                    onChange={(e) =>
                      F({ code: e.target.value.toUpperCase() })
                    }
                    placeholder="ENG-003"
                    className={`${jcInputCls} font-mono uppercase tracking-wider`}
                  />
                </div>

                <div>
                  <label className={jcLabelCls}>
                    Job level <span className="text-rose-400">*</span>
                  </label>
                  <JcSelectField
                    value={form.level ?? "Mid"}
                    onChange={(e) => F({ level: e.target.value })}
                  >
                    {LEVELS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </JcSelectField>
                </div>

                <div className="col-span-2">
                  <label className={jcLabelCls}>
                    Job title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    value={form.title ?? ""}
                    onChange={(e) => F({ title: e.target.value })}
                    placeholder="Software Engineer"
                    className={jcInputCls}
                  />
                </div>
              </div>
            </JcSection>

            {/* ── Compensation ── */}
            <JcSection
              icon={<DollarSign className="h-3.5 w-3.5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              title="Compensation"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={jcLabelCls}>
                    Salary grade <span className="text-rose-400">*</span>
                  </label>
                  <JcSelectField
                    value={form.salaryGrade ?? "G3"}
                    onChange={(e) => F({ salaryGrade: e.target.value })}
                  >
                    {GRADES.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </JcSelectField>
                </div>

                <div>
                  <label className={jcLabelCls}>Min salary</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minSalary ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      F({ minSalary: v === "" ? null : Number(v) });
                    }}
                    placeholder="0.00"
                    className={jcInputCls}
                  />
                </div>

                <div>
                  <label className={jcLabelCls}>Max salary</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxSalary ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      F({ maxSalary: v === "" ? null : Number(v) });
                    }}
                    placeholder="0.00"
                    className={jcInputCls}
                  />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Salary range is optional but recommended. Min must not exceed
                Max.
              </p>
            </JcSection>

            {/* ── Status ── */}
            <JcSection
              icon={<TrendingUp className="h-3.5 w-3.5 text-amber-600" />}
              iconBg="bg-amber-50"
              title="Status"
            >
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-slate-700">
                    {form.active ? "Active" : "Inactive"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {form.active
                      ? "Visible in employee assignment dropdowns"
                      : "Hidden from new assignments"}
                  </p>
                </div>
                <Switch
                  checked={form.active ?? true}
                  onCheckedChange={(checked: boolean) =>
                    F({ active: checked })
                  }
                />
              </div>
            </JcSection>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-[11px] text-slate-500">
              Fields marked <span className="text-rose-400">*</span> are
              required
            </p>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setModal(false)}
                type="button"
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={save}
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-[13px] font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
              >
                <Briefcase className="h-3.5 w-3.5" />
                {form.id ? "Save changes" : "Save job code"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!del} onOpenChange={() => setDel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job Code</DialogTitle>
            <DialogDescription>
              Delete "{del?.code} — {del?.title}"? Employees assigned to this
              code must be reassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>
              Cancel
            </Button>
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
          const rolePerms = await permissionService.getCompanyRolePermissions(
            role.id,
          );
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
            active: rolePerms.every((r: any) => r.active !== false),
          });
        } catch (e) {
          console.warn(`Failed to load permissions for role=${role.name}:`, e);
        }
      }

      for (const emp of employees) {
        if (!emp.id) continue;

        try {
          const empPerms = await permissionService.getEmployeePermissions(
            Number(emp.id),
          );
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
            active: empPerms.every((r: any) => r.active !== false),
          });
        } catch (e) {
          console.warn(
            `Failed to load employee override for emp=${emp.id}:`,
            e,
          );
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

  const handleDelete = async () => {
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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-600">
                  Role Name
                </TableHead>
                <TableHead className="font-semibold text-slate-600">
                  Type
                </TableHead>
                <TableHead className="font-semibold text-slate-600">
                  Description
                </TableHead>
                <TableHead className="font-semibold text-slate-600">
                  Permission Rules
                </TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">
                  Actions
                </TableHead>
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
                      {r.custom && (
                        <span className="ml-1 text-[10px]">CUSTOM</span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        r.custom
                          ? "border-purple-300 text-purple-700"
                          : "border-slate-300 text-slate-600"
                      }
                    >
                      {r.custom ? "Custom" : "System"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {r.description || "—"}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {
                      perms.filter((p) => p.roleId === r.id && !p.staffId)
                        .length
                    }{" "}
                    rule(s)
                  </TableCell>
                  <TableCell className="text-right">
                    {r.custom ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditRole(r)}
                        >
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
                        <span className="text-sm text-slate-400 italic">
                          System role
                        </span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {roles.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-slate-500"
                  >
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
              {
                label: "Total Rules",
                val: perms.length,
                color: "text-blue-600",
              },
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
                  <p className="text-xs text-slate-500 font-medium">
                    {s.label}
                  </p>
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
                  <TableHead className="font-semibold text-slate-600">
                    Staff Name
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600">
                    Role
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600">
                    Scope
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600">
                    Phone
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600">
                    Access
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 text-right">
                    Options
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <KeyRound className="h-12 w-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">
                          No permission rules yet
                        </p>
                        <p className="text-slate-400 text-sm">
                          Click 'Add' to grant an employee or role access
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedPerms.map((p) => {
                    const cnt = capCount(p);
                    const pct = Math.round((cnt / TOTAL_CAPS) * 100);
                    return (
                      <TableRow
                        key={p.id}
                        className={`hover:bg-slate-50/50 ${!p.active && "opacity-50"}`}
                      >
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
                          <Badge
                            className={`${ROLE_STYLES[p.role]?.bg || "bg-gray-100"} ${ROLE_STYLES[p.role]?.color || "text-gray-700"} border ${ROLE_STYLES[p.role]?.border || "border-gray-200"}`}
                          >
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
                              onClick={() => openEditPerm(p)}
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
                  total={permTotal}
                  pageIndex={permPageIndex}
                  pageSize={permPageSize}
                  pageCount={permPageCount}
                  onPageChange={setPermPageIndex}
                  onPageSizeChange={setPermPageSize}
                  pageSizeOptions={PERMISSION_PAGE_SIZES}
                />
              </div>
            )}
          </div>
        </>
      )}

      {modal === "role" && (
        <Dialog open={modal === "role"} onOpenChange={() => setModal(null)}>
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
                After creating the role, go to <strong>Permissions</strong> and
                add a rule to configure access.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button onClick={saveRole}>
                {roleForm.id ? "Save Changes" : "Create Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {modal === "perm" && (
        <Dialog open={modal === "perm"} onOpenChange={() => setModal(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {permForm.id ? "Edit Permissions" : "Add Permissions"}
              </DialogTitle>
              <DialogDescription>
                Choose a role and optionally an individual employee, then
                configure their HR access.
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
                    Default permissions loaded for{" "}
                    <strong>{permForm.role}</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPermForm((v) => ({ ...v, caps: emptyCaps() }))
                    }
                  >
                    Clear all
                  </Button>
                </div>
              )}

              <PermissionMatrix
                modules={HR_MODULES}
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

      <Dialog open={!!del} onOpenChange={() => setDel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Permission</DialogTitle>
            <DialogDescription>
              Remove permissions for "{del?.staffName || `Role: ${del?.role}`}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!del) return;

                try {
                  if (del.staffId) {
                    await permissionService.removeAllEmployeePermissions(
                      del.staffId,
                    );
                  } else if (del.roleId) {
                    await permissionService.removeAllCompanyRolePermissions(
                      del.roleId,
                    );
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
            <Button variant="outline" onClick={() => setDelRole(null)}>
              Cancel
            </Button>
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

      <Dialog
        open={!!removePermsRole}
        onOpenChange={() => setRemovePermsRole(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove All Permissions</DialogTitle>
            <DialogDescription>
              Remove all permissions for role "{removePermsRole?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovePermsRole(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const TABS = [
  { id: "leaves", label: "Leave Types", icon: Calendar },
  { id: "jobs", label: "Job Codes", icon: Briefcase },
  { id: "perms", label: "Permissions", icon: KeyRound },
  { id: "appraisal", label: "Appraisal", icon: Star },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export default function HRSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, permissions, permissionsLoading } = useAuth();
  const [jobs, setJobs] = useState<JobCode[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  // Gate the page on the HR_SETTINGS module permission instead of matching
  // the company-role name. ADMIN/SUPER_ADMIN keep their bypass via canView's
  // null-permissions branch (AuthContext sets permissions=null for admins).
  const isAuthorized = isAdmin || canView(permissions, "HR_SETTINGS");

  // Whether to show the "Leave Approvals" tab — mirrors the backend's
  // canActAsApprover (LEAVES.APPROVE permission OR department-manager). We
  // can't tell from the JWT/permissions alone whether the user is a dept
  // manager, so ask the BE.
  const [canApproveLeaves, setCanApproveLeaves] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    leaveService.fetchCanApprove().then((ok) => {
      if (!cancelled) setCanApproveLeaves(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Whether to show the "Loan Approvals" tab — purely permission-driven
  // (no department-manager fallback for loans today).
  const canApproveLoans =
    isAdmin || !!(permissions?.LOANS?.approve || permissions?.LOANS?.APPROVE);

  if (permissionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading permissions…
          </CardContent>
        </Card>
      </div>
    );
  }

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
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabsList = [
    {
      value: "leaves",
      label: "Leave Types",
      element: () => <LeaveCustomizationForm />,
    },
    {
      value: "hr-policies",
      label: "HR Policies",
      element: () => <HrPoliciesForm />,
    },
    ...(canApproveLeaves
      ? [
          {
            value: "leave-approvals",
            label: "Leave Approvals",
            element: () => <LeaveApprovalPanel />,
          },
        ]
      : []),
    ...(canApproveLoans
      ? [
          {
            value: "loan-approvals",
            label: "Loan Approvals",
            element: () => <LoanApprovalPanel />,
          },
        ]
      : []),
    {
      value: "jobs",
      label: "Job Codes",
      element: () => <JobCodesTab jobs={jobs} setJobs={setJobs} />,
    },
    {
      value: "social",
      label: "Social",
      element: () => <SocialSettingsPage hrSettings />,
    },
    {
      value: "department",
      label: "Department",
      element: () => <DepartmentListPage hrSettings />,
    },
    {
      value: "roles",
      label: "Roles",
      element: () => <SettingsRolesPage hrSettings />,
    },
    // Permissions is system-security config — restrict to ADMIN/SUPER_ADMIN.
    // HR Manager keeps HR_SETTINGS for operational tabs but should not be
    // able to escalate by editing permission grants.
    ...(isAdmin
      ? [
          {
            value: "permissions",
            label: "Permissions",
            element: () => <PermissionsTab roles={roles} setRoles={setRoles} />,
          },
        ]
      : []),
    { value: "appraisal", label: "Appraisal", element: () => <AppraisalTab /> },
  ];

  const tabParam = searchParams.get("tab");
  const tabValues = tabsList.map((tab) => tab.value);
  const activeTab =
    tabParam && tabValues.includes(tabParam) ? tabParam : "leaves";

  const handleTabChange = (value: string) => {
    setSearchParams(value === "leaves" ? {} : { tab: value }, { replace: true });
  };

  return (
    <div className="p-6 bg-slate-50/60 min-h-screen">
      <PageHeader
        title="HR Settings"
        description="Manage leave policies, org structure, roles, permissions, and appraisal"
        variant="default"
        icon={<Building className="w-6 h-6" />}
      />
      <AppTab
        tabs={tabsList}
        value={activeTab}
        onValueChange={handleTabChange}
      />
    </div>
  );
}
