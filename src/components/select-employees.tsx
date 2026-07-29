import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { fetchEmployees } from "@/service/employeeService";
import type { Employee } from "@/types/hr";

export type SelectEmployeesIdMode = "employee" | "user";

const SelectEmployees = ({
  onChange,
  value,
  label,
  placeholder,
  idMode = "employee",
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  /** Which id to use as option value. Warehouse managers are Users; dept/div managers are Employees. */
  idMode?: SelectEmployeesIdMode;
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchEmployees().then((data) => {
      if (data) setEmployees(data);
    });
  }, []);

  const optionValue = (d: Employee) => {
    if (idMode === "user") {
      return d.userId != null ? String(d.userId) : "";
    }
    return String(d.id);
  };

  return (
    <>
      {label !== "" && <Label>{label || "User"}</Label>}
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "Select User"} />
        </SelectTrigger>

        <SelectContent>
          {employees
            .filter((d) => optionValue(d) !== "")
            .map((d) => {
              const fullName =
                [d.firstName, d.lastName].filter(Boolean).join(" ") ||
                `Employee #${d.id}`;
              const val = optionValue(d);
              return (
                <SelectItem key={`${idMode}-${val}`} value={val}>
                  <div>
                    <h2 className="font-semibold">{fullName}</h2>
                    <h4 className="font-sm text-gray-500">
                      {idMode === "user" ? `User ID: ${val}` : `ID: ${d.id}`}
                    </h4>
                  </div>
                </SelectItem>
              );
            })}
        </SelectContent>
      </Select>
    </>
  );
};

export default SelectEmployees;
