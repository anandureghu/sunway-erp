import React, { createContext, useContext, useState } from "react";

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
