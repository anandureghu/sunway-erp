import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

export function EmployeeSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<SelectedEmployee>(null);
  return (
    <EmployeeSelectionContext.Provider value={{ selected, setSelected }}>
      {children}
    </EmployeeSelectionContext.Provider>
  );
}

export function useEmployeeSelection() {
  const ctx = useContext(EmployeeSelectionContext);
  if (!ctx) throw new Error("useEmployeeSelection must be used within EmployeeSelectionProvider");
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
    employeeNo: "",
    firstName: "",
    lastName: "",

    gender: "",
    prefix: "",
    status: "Active",
    maritalStatus: "",

    dateOfBirth: "",
    joinDate: "",

    phoneNo: "",
    altPhone: "",
    email: "",

    departmentId: "",
    notes: "",
    username: "",
    password: "",
    role: "USER",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.employeeNo || !form.firstName || !form.lastName) {
      toast.error("Employee No, First Name and Last Name are required");
      return;
    }

    if (!form.username || !form.password || !form.email) {
      toast.error("Username, password and email are required");
      return;
    }

    const payload = {
      employeeNo: form.employeeNo,
      firstName: form.firstName,
      lastName: form.lastName,

      username: form.username,
      password: form.password,
      email: form.email,

      phoneNo: form.phoneNo || null,
      gender: form.gender || null,
      prefix: form.prefix || null,
      maritalStatus: form.maritalStatus || null,
      dateOfBirth: form.dateOfBirth || null,
      joinDate: form.joinDate || null,
      // normalize status to backend enum (e.g. "ACTIVE", "ON_LEAVE", "INACTIVE")
      status:
        form.status === "On Leave"
          ? "ON_LEAVE"
          : form.status === "Inactive"
          ? "INACTIVE"
          : form.status === "Active"
          ? "ACTIVE"
          : null,
    
    };
   
    


    onAdd(payload);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <p className="text-sm text-gray-600">Provide required account details and optional profile fields.</p>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Employee No</label>
              <input name="employeeNo" placeholder="Employee No" value={form.employeeNo} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2">
                <option>Active</option>
                <option>On Leave</option>
                <option>Inactive</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">First Name</label>
              <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>

            <div>
              <label className="text-sm font-medium">Username</label>
              <input name="username" placeholder="Username" value={form.username} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input name="phoneNo" placeholder="Phone number" value={form.phoneNo} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>

            <div>
              <label className="text-sm font-medium">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Prefix</label>
              <select name="prefix" value={form.prefix} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2">
                <option value="">Select</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Marital Status</label>
              <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2">
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>

            <div>
              <label className="text-sm font-medium">Join Date</label>
              <input type="date" name="joinDate" value={form.joinDate} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <input name="notes" placeholder="Notes" value={(form as any).notes ?? ""} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button onClick={onClose} type="button" className="mr-2 inline-flex h-9 items-center rounded-md border px-3 text-sm">Cancel</button>
            <button onClick={handleSubmit} type="button" className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm text-white">Save Employee</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
