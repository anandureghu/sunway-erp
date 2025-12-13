import type { ChartOfAccounts } from "@/types/coa";
import { useEffect, useState } from "react";
import { SelectContent, SelectItem } from "./ui/select";
import { fetchCOAAccounts } from "@/service/coaService";
import { useAuth } from "@/context/AuthContext";

const SelectAccount = ({ useId }: { useId?: boolean }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (user?.companyId) {
      fetchCOAAccounts(user?.companyId.toString()).then((data) => {
        if (data) setAccounts(data);
      });
    }
  }, [user]);

  return (
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
  );
};

export default SelectAccount;
