import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { fetchCurrency } from "@/service/currencyService";
import type { Currency } from "@/types/currency";

const SelectCurrency = ({
  onChange,
  value,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
}) => {
  const [currency, setCurrency] = useState([]);

  useEffect(() => {
    fetchCurrency().then((data) => {
      if (data) setCurrency(data);
    });
  }, []);

  return (
    <>
      <Label>Currency</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select Currency" />
        </SelectTrigger>

        <SelectContent className="w-full">
          {currency.map((c: Currency) => (
            <SelectItem key={c.id} value={String(c.id)}>
              <div>
                <h2 className="font-semibold">
                  {c.currencyCode} ({c.currencySymbol}) - {c.currencyName}
                </h2>
                <h4 className="font-sm text-gray-500">
                  Country: {c.countryName}
                </h4>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default SelectCurrency;
