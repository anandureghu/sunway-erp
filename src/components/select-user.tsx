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

const SelectUser = ({
  onChange,
  value,
  label,
  placeholder,
}: {
  label?: string;
  placeholder?: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then((data) => {
      if (data) setUsers(data);
    });
  }, []);

  return (
    <>
      <Label>{label ? label : "User"}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "Select User"} />
        </SelectTrigger>

        <SelectContent>
          {users.map((d: User) => (
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
