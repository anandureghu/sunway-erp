import type { ChartOfAccounts } from "@/types/coa";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { fetchCOAAccounts } from "@/service/coaService";
import { Label } from "./ui/label";

const SelectAccount = ({
  useId,
  onChange,
  value,
  label,
  placeholder,
}: {
  useId?: boolean;
  value: string | undefined;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
}) => {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    fetchCOAAccounts().then((data) => {
      if (data) setAccounts(data);
    });
  }, []);

  return (
    <>
      <Label>{label || "Account"}</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "Select Account"} />
        </SelectTrigger>

        <SelectContent>
          {accounts.map((d: ChartOfAccounts) => (
            <SelectItem
              key={d.id}
              value={useId ? d.id.toString() : String(d.accountCode)}
            >
              <div>
                <h2 className="font-semibold">{d.accountName}</h2>
                <h4 className="font-sm text-gray-500">{d.accountCode}</h4>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default SelectAccount;
