import { ChevronDown } from "lucide-react";
import { HR_PERMISSION_MODULES } from "@/lib/permission-catalog";

/* ───────────────────────────────────────────────────────────────────────────
   Shared styles, field components, types, and permission helpers for the HR
   settings screen. Extracted from settings-page.tsx so the Job Codes and
   Permissions tabs can live in their own files.
   ─────────────────────────────────────────────────────────────────────────── */

export const jcInputCls =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

export const jcSelectCls =
  "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-[13px] text-slate-800 outline-none transition-all duration-150 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

export const jcLabelCls =
  "block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5";

export function JcSection({
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

export function JcSelectField({
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

export interface Role {
  id: number;
  name: string;
  custom: boolean;
  description?: string;
  active?: boolean;
}

export interface JobCode {
  id: number;
  code: string;
  title: string;
  level: string;
  salaryGrade: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  active: boolean;
}

export interface Permission {
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
export const HR_MODULES = HR_PERMISSION_MODULES;

export const CAPS = [
  { key: "view_own", label: "View Own" },
  { key: "view_all", label: "View All" },
  { key: "create_own", label: "Create Own" },
  { key: "create_all", label: "Create All" },
  { key: "edit_own", label: "Edit Own" },
  { key: "edit_all", label: "Edit All" },
  { key: "delete_own", label: "Delete Own" },
  { key: "delete_all", label: "Delete All" },
  { key: "approve", label: "Approve" },
];

// Expand a coarse preset ({create,edit,delete}) into own/all granular caps.
// Granular keys, if already present, are preserved.
export const expandCaps = (
  c: Record<string, boolean>,
): Record<string, boolean> => ({
  view_own: !!c.view_own,
  view_all: !!c.view_all,
  create_own: !!(c.create_own ?? c.create),
  create_all: !!(c.create_all ?? c.create),
  edit_own: !!(c.edit_own ?? c.edit),
  edit_all: !!(c.edit_all ?? c.edit),
  delete_own: !!(c.delete_own ?? c.delete),
  delete_all: !!(c.delete_all ?? c.delete),
  approve: !!c.approve,
});

export const LEVELS = [
  "Intern",
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Manager",
  "Director",
  "C-Level",
];
export const GRADES = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"];

export const ROLE_PRESETS: Record<
  string,
  Record<string, Record<string, boolean>>
> = {
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

export const TOTAL_CAPS = HR_MODULES.length * CAPS.length;

export const emptyCaps = (): Record<string, Record<string, boolean>> =>
  Object.fromEntries(
    HR_MODULES.map((m) => [
      m.id.toUpperCase().replace(/[_-]/g, "_"),
      Object.fromEntries(CAPS.map((c) => [c.key, false])),
    ]),
  );

export const normalizeModuleKey = (mod: string): string =>
  mod.toUpperCase().replace(/[_-]/g, "_");

export const ROLE_STYLES: Record<
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

export const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-pink-500",
];
