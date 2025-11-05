import type { ReactElement } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useCallback } from "react";

type Ctx = { editing: boolean };

type CompanyItem = {
  itemCode: string;
  itemName: string;
  itemStatus: string;
  dateGiven: string;
  returnDate: string;
  description: string;
};

const defaultData: CompanyItem = {
  itemCode: "",
  itemName: "",
  itemStatus: "",
  dateGiven: "",
  returnDate: "",
  description: "",
};

export default function CompanyPropertiesForm(): ReactElement {
  const { editing } = useOutletContext<Ctx>();
  const [data, setData] = useState<CompanyItem>(defaultData);

  const set = useCallback((k: keyof CompanyItem, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-base font-semibold">Company Properties</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Item Code:"
          value={data.itemCode}
          disabled={!editing}
          onChange={(v) => set("itemCode", v)}
          ariaLabel="Item Code"
        />
        <Field
          label="Date Given:"
          type="date"
          value={data.dateGiven}
          disabled={!editing}
          onChange={(v) => set("dateGiven", v)}
          ariaLabel="Date Given"
        />

        <Field
          label="Item Name:"
          value={data.itemName}
          disabled={!editing}
          onChange={(v) => set("itemName", v)}
          ariaLabel="Item Name"
        />
        <Field
          label="Return Date:"
          type="date"
          value={data.returnDate}
          disabled={!editing}
          onChange={(v) => set("returnDate", v)}
          ariaLabel="Return Date"
        />

        <Field
          label="Item Status:"
          value={data.itemStatus}
          disabled={!editing}
          onChange={(v) => set("itemStatus", v)}
          ariaLabel="Item Status"
        />
        <div className="md:col-span-2">
          <Label className="text-sm">Item Description:</Label>
          <Textarea
            value={data.description}
            disabled={!editing}
            onChange={(e) => set("description", e.target.value)}
            className="min-h-[160px]"
          />
        </div>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const { label, value, onChange, type = "text", disabled, ariaLabel } = props;
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
      />
    </div>
  );
}
