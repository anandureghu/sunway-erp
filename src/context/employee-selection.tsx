import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import roleService from "@/service/roleService";
import type { RoleOption } from "@/types/role";
import { UserPlus, User, Globe, Shield, X, ChevronDown } from "lucide-react";

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
      "useEmployeeSelection must be used within EmployeeSelectionProvider",
    );
  return ctx;
}

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
    // phone removed from add form

    // additional profile fields
    birthplace: "",
    hometown: "",
    nationality: "",
    religion: "",
    identification: "",

    // username/password/email removed from add form

    role: "",
  });

  const { company } = useAuth();
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  // Fetch roles from the API when component mounts or company changes
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        if (company?.id) {
          const roles = await roleService.getRoles(company.id);
          const options = roles
            .filter((r) => r.active !== false)
            .map((r) => ({ label: r.name, value: r.name }));
          setRoleOptions(options);

          // Set default role if available
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
      // username, password, email removed from add payload — backend will
      // generate or admin will set them later if required

      // Use companyRole (human-readable) for display
      companyRole: form.role || "Employee",
    };
    onAdd(payload);
    onClose();
  };

  const inputCls =
    "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const selectCls =
    "h-9 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Header */}
        <div className="relative flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Add New Employee</h2>
            <p className="text-xs text-blue-100">Fill in the details to create an employee record</p>
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6 bg-gray-50">
          {/* Personal Information */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Personal Information</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Prefix</label>
                <div className="relative">
                  <select name="prefix" value={form.prefix} onChange={handleChange} className={selectCls}>
                    <option value="">Select</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className={labelCls}>First Name <span className="text-red-400">*</span></label>
                <input name="firstName" placeholder="e.g. John" value={form.firstName} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Name <span className="text-red-400">*</span></label>
                <input name="lastName" placeholder="e.g. Doe" value={form.lastName} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <div className="relative">
                  <select name="gender" value={form.gender} onChange={handleChange} className={selectCls}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Marital Status</label>
                <div className="relative">
                  <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} className={selectCls}>
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <div className="relative">
                  <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className={inputCls} />
                </div>
              </div>
            </div>
          </div>

          {/* Background Details */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                <Globe className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Background Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Birthplace</label>
                <input name="birthplace" placeholder="City / country of birth" value={form.birthplace} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Hometown</label>
                <input name="hometown" placeholder="Hometown" value={form.hometown} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nationality</label>
                <input name="nationality" placeholder="e.g. Malaysian" value={form.nationality} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Religion</label>
                <input name="religion" placeholder="e.g. Islam" value={form.religion} onChange={handleChange} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Identification No.</label>
                <input name="identification" placeholder="IC / Passport / National ID" value={form.identification} onChange={handleChange} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Role */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <Shield className="h-4 w-4 text-violet-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Access & Role</h3>
            </div>
            <div className="relative">
              <label className={labelCls}>Role</label>
              <select name="role" value={form.role} onChange={handleChange} className={selectCls}>
                {roleOptions.length > 0 ? (
                  roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
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
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 bottom-2.5 h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
          <p className="text-xs text-gray-400"><span className="text-red-400">*</span> Required fields</p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
            >
              <UserPlus className="h-4 w-4" />
              Save Employee
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
