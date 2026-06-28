import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import roleService from "@/service/roleService";
import type { RoleOption } from "@/types/role";
import {
  UserPlus,
  User,
  Globe,
  Shield,
  X,
  ChevronDown,
} from "lucide-react";
import CountrySelect from "@/components/country-select";

export type SelectedEmployee = {
  employeeNo: string;
  id: string;
  no: string;
  name: string;
  firstName: string;
  lastName: string;
  status: string;
  department?: string;
  designation?: string;
  dateOfBirth?: string;
  gender?: string;
  joinDate?: string;
  photoUrl?: string;
  phoneNo?: string;
  email?: string;
  username?: string;
  companyId?: number | null;
  departmentId?: number | null;
  nationality?: string;
  nationalId?: string;
  maritalStatus?: string;
} | null;

type Ctx = {
  selected: SelectedEmployee;
  setSelected: (e: SelectedEmployee) => void;
};

const EmployeeSelectionContext = createContext<Ctx | undefined>(undefined);

export function EmployeeSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<SelectedEmployee>(null);
  return (
    <EmployeeSelectionContext.Provider value={{ selected, setSelected }}>
      {children}
    </EmployeeSelectionContext.Provider>
  );
}

export function useEmployeeSelection() {
  const ctx = useContext(EmployeeSelectionContext);
  if (!ctx)
    throw new Error(
      "useEmployeeSelection must be used within EmployeeSelectionProvider"
    );
  return ctx;
}

// ── Shared field styles ───────────────────────────────────────────────────────
const inputCls =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

const selectCls =
  "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-[13px] text-slate-800 outline-none transition-all duration-150 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5";

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({
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
        <span className="text-[13px] font-semibold text-slate-700">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Select with chevron ───────────────────────────────────────────────────────
function SelectField({
  name,
  value,
  onChange,
  children,
}: {
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select name={name} value={value} onChange={onChange} className={selectCls}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AddEmployeeModal({
  isOpen,
  onAdd,
  onClose,
}: {
  isOpen: boolean;
  onAdd: (payload: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    prefix: "",
    maritalStatus: "",
    dateOfBirth: "",
    birthplace: "",
    hometown: "",
    nationality: "",
    religion: "",
    identification: "",
    role: "",
  });

  const { company } = useAuth();
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        if (company?.id) {
          const roles = await roleService.getRoles(company.id);
          const options = roles
            .filter((r) => r.active !== false)
            .map((r) => ({ label: r.name, value: r.name }));
          setRoleOptions(options);
          if (options.length > 0 && !form.role) {
            setForm((prev) => ({ ...prev, role: options[0].value }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };
    fetchRoles();
  }, [company?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First name and Last name are required");
      return;
    }
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      gender: form.gender || undefined,
      prefix: form.prefix || undefined,
      maritalStatus: form.maritalStatus || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      birthplace: form.birthplace || undefined,
      hometown: form.hometown || undefined,
      nationality: form.nationality || undefined,
      religion: form.religion || undefined,
      identification: form.identification || undefined,
      companyRole: form.role || "Employee",
    };
    onAdd(payload);
    onClose();
  };

  // Live initials preview
  const initials =
    ((form.firstName[0] ?? "") + (form.lastName[0] ?? "")).toUpperCase() || "?";

  const avatarPalette: Record<string, string> = {
    A: "bg-rose-100 text-rose-600",
    B: "bg-orange-100 text-orange-600",
    C: "bg-amber-100 text-amber-700",
    D: "bg-lime-100 text-lime-700",
    E: "bg-emerald-100 text-emerald-700",
    F: "bg-teal-100 text-teal-700",
    G: "bg-cyan-100 text-cyan-700",
    H: "bg-sky-100 text-sky-700",
    I: "bg-blue-100 text-blue-700",
    J: "bg-indigo-100 text-indigo-700",
    K: "bg-violet-100 text-violet-700",
    L: "bg-purple-100 text-purple-700",
    M: "bg-fuchsia-100 text-fuchsia-700",
    N: "bg-pink-100 text-pink-700",
  };
  const avatarColor =
    avatarPalette[initials[0]] ?? "bg-slate-100 text-slate-500";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 680, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${avatarColor} border-2 border-white/20`}
            >
              {initials}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold leading-tight text-white">
                Add new employee
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-300">
                Fill in the details to create an employee record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
          {/* ── Personal Information ── */}
          <Section
            icon={<User className="h-3.5 w-3.5 text-slate-600" />}
            iconBg="bg-slate-100"
            title="Personal information"
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Prefix</label>
                <SelectField name="prefix" value={form.prefix} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                </SelectField>
              </div>

              <div>
                <label className={labelCls}>
                  First name <span className="text-rose-400">*</span>
                </label>
                <input
                  name="firstName"
                  placeholder="John"
                  value={form.firstName}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Last name <span className="text-rose-400">*</span>
                </label>
                <input
                  name="lastName"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Gender</label>
                <SelectField name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </SelectField>
              </div>

              <div>
                <label className={labelCls}>Marital status</label>
                <SelectField name="maritalStatus" value={form.maritalStatus} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </SelectField>
              </div>

              <div>
                <label className={labelCls}>Date of birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
            </div>
          </Section>

          {/* ── Background Details ── */}
          <Section
            icon={<Globe className="h-3.5 w-3.5 text-blue-600" />}
            iconBg="bg-blue-50"
            title="Background details"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Birthplace</label>
                <input
                  name="birthplace"
                  placeholder="City / country of birth"
                  value={form.birthplace}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Hometown</label>
                <input
                  name="hometown"
                  placeholder="Hometown"
                  value={form.hometown}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Nationality</label>
                <CountrySelect
                  value={form.nationality}
                  onChange={(nationality) =>
                    setForm((prev) => ({ ...prev, nationality }))
                  }
                  placeholder="Select country"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Religion</label>
                <input
                  name="religion"
                  placeholder="e.g. Islam"
                  value={form.religion}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Identification no.</label>
                <input
                  name="identification"
                  placeholder="IC / Passport / National ID"
                  value={form.identification}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
            </div>
          </Section>

          {/* ── Access & Role ── */}
          <Section
            icon={<Shield className="h-3.5 w-3.5 text-amber-600" />}
            iconBg="bg-amber-50"
            title="Access & role"
          >
            <div>
              <label className={labelCls}>Role</label>
              <SelectField name="role" value={form.role} onChange={handleChange}>
                {roleOptions.length > 0 ? (
                  roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="FINANCE_MANAGER">Finance Manager</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="AP_AR_CLERK">AP/AR Clerk</option>
                    <option value="CONTROLLER">Controller</option>
                    <option value="AUDITOR_EXTERNAL">Auditor (External)</option>
                  </>
                )}
              </SelectField>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Determines what this employee can access in the system
              </p>
            </div>
          </Section>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            Fields marked <span className="text-rose-400">*</span> are required
          </p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              type="button"
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-[13px] font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Save employee
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}