import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { fetchWarehouses } from "@/service/warehouseService";
import type { Warehouse } from "@/types/inventory";

const SelectWarehouse = ({
  onChange,
  value,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
}) => {
  const [warehouses, setWarehoues] = useState([]);

  useEffect(() => {
    fetchWarehouses().then((data) => {
      if (data) setWarehoues(data);
    });
  }, []);

  return (
    <>
      <Label>Warehouse</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select warehouse" />
        </SelectTrigger>

        <SelectContent>
          {warehouses
            .filter((w: Warehouse) => w.status === "active")
            .map((warehouse: Warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                {warehouse.name} - {warehouse.location}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default SelectWarehouse;
