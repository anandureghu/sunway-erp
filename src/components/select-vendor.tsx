import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { fetchVendors } from "@/service/vendorService";
import type { Vendor } from "@/types/vendor";

const SelectVendor = ({
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
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    fetchVendors().then((data) => {
      if (data) setVendors(data);
    });
  }, []);

  return (
    <>
      <Label>{label ? label : "Supplier"}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "Select Supplier"} />
        </SelectTrigger>

        <SelectContent>
          {vendors.map((d: Vendor) => (
            <SelectItem key={d.id} value={String(d.id)}>
              <div>
                <h2 className="font-semibold">{d.vendorName}</h2>
                <h4 className="font-sm text-gray-500">
                  Contact: {d.contactPersonName}
                </h4>
                {d.is1099Vendor && (
                  <h4 className="font-sm text-gray-500">1099 Vendor</h4>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default SelectVendor;
