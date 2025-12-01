import type { ReactElement } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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

function validateCompanyItem(item: CompanyItem): boolean {
  return (
    item.itemCode.trim() !== "" &&
    item.itemName.trim() !== "" &&
    item.itemStatus.trim() !== "" &&
    item.dateGiven.trim() !== "" &&
    item.returnDate.trim() !== "" &&
    item.description.trim() !== ""
  );
}

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
  const [saved, setSaved] = useState<CompanyItem>(defaultData);

  const set = useCallback((k: keyof CompanyItem, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
  }, []);

  const handleSave = useCallback(() => {
    setSaved(data);
  }, [data]);

  const handleCancel = useCallback(() => {
    setData(saved);
  }, [saved]);

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
          required
        />
        <Field
          label="Date Given:"
          type="date"
          value={data.dateGiven}
          disabled={!editing}
          onChange={(v) => set("dateGiven", v)}
          ariaLabel="Date Given"
          required
        />

        <Field
          label="Item Name:"
          value={data.itemName}
          disabled={!editing}
          onChange={(v) => set("itemName", v)}
          ariaLabel="Item Name"
          required
        />
        <Field
          label="Return Date:"
          type="date"
          value={data.returnDate}
          disabled={!editing}
          onChange={(v) => set("returnDate", v)}
          ariaLabel="Return Date"
          required
        />

        <Field
          label="Item Status:"
          value={data.itemStatus}
          disabled={!editing}
          onChange={(v) => set("itemStatus", v)}
          ariaLabel="Item Status"
          required
        />
        <div className="md:col-span-2">
          <Label className="text-sm">
            Item Description:
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Textarea
            value={data.description}
            disabled={!editing}
            onChange={(e) => set("description", e.target.value)}
            className="min-h-[160px]"
            required
          />
        </div>
      </div>

      {editing && (
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button disabled={!validateCompanyItem(data)} onClick={handleSave}>
            Save
          </Button>
        </div>
      )}
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
  required?: boolean;
}) {
  const { label, value, onChange, type = "text", disabled, ariaLabel, required } = props;
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        required={required}
      />
    </div>
  );
}
