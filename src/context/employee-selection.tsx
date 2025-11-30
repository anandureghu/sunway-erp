import React, { createContext, useContext, useState, useEffect } from "react";
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

export function AddEmployeeModal({ isOpen, onAdd, onClose }: { isOpen: boolean; onAdd: (employee: Partial<SelectedEmployee>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    employeeNo: "",
    department: "",
    designation: "",
    status: "Active",
  });

  // generate a semi-unique employee number when the modal opens
  useEffect(() => {
    if (isOpen) {
      const generated = `EMP-${Date.now().toString().slice(-6)}`;
      setForm((s) => ({ ...s, employeeNo: generated }));
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // require important fields
    if (!form.firstName.trim() || !form.lastName.trim() || !form.department.trim() || !form.designation.trim()) {
      alert("Please fill First Name, Last Name, Department and Designation.");
      return;
    }

    const payload: Partial<SelectedEmployee> = {
      id: `new-${Date.now()}`,
      no: form.employeeNo,
      name: `${form.firstName} ${form.lastName}`,
      firstName: form.firstName,
      lastName: form.lastName,
      department: form.department,
      designation: form.designation,
      status: form.status,
    };

    onAdd(payload);
    // reset form for next open
    setForm({ firstName: "", lastName: "", employeeNo: "", department: "", designation: "", status: "Active" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <p>Fill in the employee details below.</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Employee No</label>
              <input
                type="text"
                name="employeeNo"
                value={form.employeeNo}
                readOnly
                className="border rounded p-2 w-full bg-gray-50"
              />
            </div>
            <div>
              <label className="text-sm">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="border rounded p-2 w-full">
                <option>Active</option>
                <option>On Leave</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              className="border rounded p-2 w-full"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="border rounded p-2 w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={form.department}
              onChange={handleChange}
              className="border rounded p-2 w-full"
            />
            <input
              type="text"
              name="designation"
              placeholder="Designation"
              value={form.designation}
              onChange={handleChange}
              className="border rounded p-2 w-full"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="bg-primary text-white px-4 py-2 rounded w-full"
          >
            Save Employee
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
