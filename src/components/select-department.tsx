import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { fetchDepartments } from "@/service/departmentService";
import type { Department } from "@/types/department";
import { Label } from "./ui/label";

const SelectDepartment = ({
  onChange,
  value,
}: {
  value: string | undefined;
  onChange: (v: string, dept?: Department | null) => void;
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchDepartments().then((data) => {
      if (data) setDepartments(data);
    });
  }, []);

  const handleChange = (val: string) => {
    const selectedDept = departments.find((d) => String(d.id) === val) || null;

    onChange(val, selectedDept);
  };

  return (
    <>
      <Label>Department</Label>

      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select Department" />
        </SelectTrigger>

        <SelectContent>
          {departments.map((d) => (
            <SelectItem key={d.id} value={String(d.id)}>
              <div>
                <h2 className="font-semibold">{d.departmentName}</h2>
                <h4 className="text-sm text-gray-500">ID: {d.id}</h4>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default SelectDepartment;
