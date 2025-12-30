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
import type { User } from "@/types/hr";

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
  const [employees, setEmployees] = useState([]);

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
          {employees.map((d: User) => (
            <SelectItem key={d.id} value={d.id.toString()}>
              <div>
                <h2 className="font-semibold">{d.fullName}</h2>
                <h4 className="font-sm text-gray-500">ID: {d.id}</h4>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default SelectEmployees;
