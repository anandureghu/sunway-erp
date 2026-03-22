import type { ChartOfAccounts } from "@/types/coa";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { fetchCOAAccounts } from "@/service/coaService";
import { Label } from "./ui/label";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

function formatCoaBalance(
  balance: string | number | undefined,
  currencyCode: string,
) {
  const num =
    typeof balance === "string"
      ? parseFloat(balance || "0")
      : Number(balance ?? 0);
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currencyCode ? `${currencyCode} ${formatted}` : formatted;
}

const SelectAccount = ({
  useId,
  onChange,
  value,
  label,
  placeholder,
  disabled = false,
  showNoneOption = false,
}: {
  useId?: boolean;
  value: string | undefined;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Adds "None" so single-sided transactions can omit this leg. */
  showNoneOption?: boolean;
}) => {
  const { company } = useAuth();
  const currencyCode = company?.currency?.currencyCode ?? "";
  const [accounts, setAccounts] = useState<ChartOfAccounts[]>([]);

  useEffect(() => {
    fetchCOAAccounts().then((data) => {
      if (data) setAccounts(data as ChartOfAccounts[]);
    });
  }, []);

  const selectedAccount = useMemo(() => {
    if (!value || value === "__none__") return null;
    return accounts.find((a) =>
      useId ? String(a.id) === value : String(a.accountCode) === value,
    );
  }, [accounts, value, useId]);

  const triggerTitle = selectedAccount
    ? `${selectedAccount.accountName} · ${selectedAccount.accountCode} · ${formatCoaBalance(selectedAccount.balance, currencyCode)}`
    : undefined;

  return (
    <>
      <Label>{label || "Account"}</Label>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          title={triggerTitle}
          className={cn(
            "h-auto min-h-9 items-start py-2 text-left",
            "[&>span]:line-clamp-none [&>span]:block [&>span]:w-full [&>span]:whitespace-normal [&>span]:break-words [&>span]:text-left",
          )}
        >
          <SelectValue placeholder={placeholder || "Select Account"} />
        </SelectTrigger>

        <SelectContent className="max-w-[min(100vw-2rem,32rem)]">
          {showNoneOption && (
            <SelectItem value="__none__">
              <span className="text-muted-foreground">None</span>
            </SelectItem>
          )}
          {accounts.map((d: ChartOfAccounts) => (
            <SelectItem
              key={d.id}
              value={useId ? d.id.toString() : String(d.accountCode)}
              className="items-start"
            >
              <div className="flex w-full max-w-full flex-col gap-0.5 pr-6">
                <span className="break-words font-medium leading-snug">
                  {d.accountName}
                </span>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="font-mono">{d.accountCode}</span>
                  <span className="shrink-0 tabular-nums text-foreground">
                    {formatCoaBalance(d.balance, currencyCode)}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default SelectAccount;
