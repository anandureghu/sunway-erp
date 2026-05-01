import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { fetchUsers } from "@/service/userService";
import type { User } from "@/types/hr";

export type SelectUserOption = User & {
  departmentId?: number | string | null;
  department?: { id?: number | string | null } | null;
  employee?: { departmentId?: number | string | null } | null;
};

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
    fetchUsers().then((data) => {
      if (data) setUsers(data);
    });
  }, []);

  const handleChange = (selectedUserId: string) => {
    const selectedUser =
      users.find((u) => String(u.id) === selectedUserId) ?? null;
    onChange(selectedUserId, selectedUser);
  };

  return (
    <>
      <Label>{label ? label : "User"}</Label>
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
