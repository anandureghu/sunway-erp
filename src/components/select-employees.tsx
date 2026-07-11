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

const SelectEmployees = ({
  onChange,
  value,
  label,
  placeholder,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchEmployees().then((data) => {
      if (data) setEmployees(data);
    });
  }, []);

  return (
    <>
      <Label>{label || "User"}</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "Select User"} />
        </SelectTrigger>

        <SelectContent>
          {employees.map((d) => {
            const fullName =
              [d.firstName, d.lastName].filter(Boolean).join(" ") ||
              `Employee #${d.id}`;
            return (
              <SelectItem key={d.id} value={String(d.id)}>
                <div>
                  <h2 className="font-semibold">{fullName}</h2>
                  <h4 className="font-sm text-gray-500">ID: {d.id}</h4>
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
