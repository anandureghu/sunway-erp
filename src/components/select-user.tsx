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

export type SelectUserOption = {
  id: number;
  fullName: string;
  email?: string;
  username?: string;
  role?: string;
  departmentId?: number | string | null;
  department?: { id?: number | string | null } | null;
  employee?: { departmentId?: number | string | null } | null;
};

function toUserOption(emp: Employee): SelectUserOption | null {
  if (emp.userId == null) return null;
  const fullName =
    [emp.firstName, emp.lastName].filter(Boolean).join(" ") ||
    `Employee #${emp.id}`;
  return {
    id: emp.userId,
    fullName,
    email: emp.email ?? "",
    username: emp.username ?? "",
    role: emp.role ?? "USER",
    departmentId: emp.departmentId ?? null,
    department: emp.departmentId != null ? { id: emp.departmentId } : null,
    employee: { departmentId: emp.departmentId ?? null },
  };
}

const SelectUser = ({
  onChange,
  value,
  label,
  placeholder,
}: {
  label?: string;
  placeholder?: string;
  value: string | undefined;
  onChange: (v: string, user?: SelectUserOption | null) => void;
}) => {
  const [users, setUsers] = useState<SelectUserOption[]>([]);

  useEffect(() => {
    fetchEmployees().then((data) => {
      if (!data) return;
      setUsers(
        (data as Employee[])
          .map(toUserOption)
          .filter((u): u is SelectUserOption => u != null),
      );
    });
  }, []);

  const handleChange = (selectedUserId: string) => {
    const selectedUser =
      users.find((u) => String(u.id) === selectedUserId) ?? null;
    onChange(selectedUserId, selectedUser);
  };

  return (
    <>
      {label !== "" && <Label>{label ? label : "User"}</Label>}
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "Select User"} />
        </SelectTrigger>

        <SelectContent>
          {users.map((d) => (
            <SelectItem key={d.id} value={String(d.id)}>
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

export default SelectUser;
