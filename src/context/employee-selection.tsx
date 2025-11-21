import React, { createContext, useContext, useState } from "react";
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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (form.firstName && form.lastName && form.employeeNo) {
      onAdd(form);
      setForm({ firstName: "", lastName: "", employeeNo: "" });
      onClose();
    } else {
      alert("Please fill all fields.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <p>Fill in the employee details below.</p>
        </DialogHeader>
        <div className="space-y-4">
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
          <input
            type="text"
            name="employeeNo"
            placeholder="Employee No"
            value={form.employeeNo}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          />
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
