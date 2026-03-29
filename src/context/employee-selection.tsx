import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import roleService from "@/service/roleService";
import type { RoleOption } from "@/types/role";

export type SelectedEmployee = {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <p className="text-sm text-gray-600">
            Provide required account details and optional profile fields.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Prefix</label>
              <select
                name="prefix"
                value={form.prefix}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Select</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">First Name</label>
              <input
                name="firstName"
                placeholder="First Name"
                value={form.firstName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <input
                name="lastName"
                placeholder="Last Name"
                value={form.lastName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              />
            </div>

            {/* Username / Password fields removed */}

            {/* Email / Phone fields removed */}

            <div>
              <label className="text-sm font-medium">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Marital Status</label>
              <select
                name="maritalStatus"
                value={form.maritalStatus}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Birthplace</label>
              <input
                name="birthplace"
                placeholder="Birthplace"
                value={form.birthplace}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Hometown</label>
              <input
                name="hometown"
                placeholder="Hometown"
                value={form.hometown}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Nationality</label>
              <input
                name="nationality"
                placeholder="Nationality"
                value={form.nationality}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Religion</label>
              <input
                name="religion"
                placeholder="Religion"
                value={form.religion}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Identification</label>
              <input
                name="identification"
                placeholder="ID number / identification"
                value={form.identification}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                {roleOptions.length > 0 ? (
                  roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                ) : (
                  // Fallback options when no roles are loaded
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
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              type="button"
              className="mr-2 inline-flex h-9 items-center rounded-md border px-3 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              type="button"
              className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm text-white"
            >
              Save Employee
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
