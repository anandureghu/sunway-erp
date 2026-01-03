import type { ReactElement } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { propertyService } from "@/service/propertyService";

type Ctx = { editing: boolean; setEditing?: (v: boolean) => void; registerSave?: (fn: (() => Promise<void> | void) | null) => void };

type CompanyItem = {
  id?: number;
  itemCode: string;
  itemName: string;
  itemStatus: "ISSUED" | "RETURNED" | "";
  dateGiven: string;
  returnDate: string;
  description: string;
};

function validateCompanyItem(item: CompanyItem): boolean {
  if (
    item.itemCode.trim() === "" ||
    item.itemName.trim() === "" ||
    item.itemStatus.trim() === "" ||
    item.dateGiven.trim() === "" ||
    item.description.trim() === ""
  ) {
    return false;
  }

  if (item.itemStatus === "RETURNED") {
    if (!item.returnDate) return false;
    if (item.returnDate < item.dateGiven) return false;
  }

  return true;
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
  const { editing, registerSave } = useOutletContext<Ctx>();
  const params = useParams<{ id?: string; employeeId?: string }>();
  const rawId = params.employeeId ?? params.id;
  const empId = rawId ? Number(rawId) : undefined;

  const [data, setData] = useState<CompanyItem>(defaultData);
  const [saved, setSaved] = useState<CompanyItem>(defaultData);
  const [exists, setExists] = useState(false);

  const set = useCallback((k: keyof CompanyItem, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
  }, []);

  useEffect(() => {
    if (data.itemStatus === "ISSUED") {
      set("returnDate", "");
    }
  }, [data.itemStatus]);
  useEffect(() => {
    if (!empId) return;
    let mounted = true;

    propertyService
      .getAll(empId)
      .then((res) => {
        if (!mounted) return;

        if (res.data?.length > 0) {
          const p = res.data[0];
          const mapped = {
            id: p.id,
            itemCode: p.itemCode ?? "",
            itemName: p.itemName ?? "",
            itemStatus: p.itemStatus ?? "",
            dateGiven: p.dateGiven ?? "",
            returnDate: p.returnDate ?? "",
            description: p.description ?? "",
          };
          setData(mapped);
          setSaved(mapped);
          setExists(true);
        }
      })
      .catch(() => toast.error("Failed to load property"));

    return () => {
      mounted = false;
    };
  }, [empId]);

  const handleSave = useCallback(async () => {
    if (!empId) return;
    if (!validateCompanyItem(data)) {
      toast.error("Please fill required fields");
      return;
    }

      const payload = {
        itemCode: data.itemCode,
        itemName: data.itemName,
        itemStatus: data.itemStatus as "ISSUED" | "RETURNED",
        description: data.description,
        dateGiven: data.dateGiven,
        returnDate: data.itemStatus === "ISSUED" ? null : data.returnDate || null,
      };

    try {
      if (exists && data.id) {
        await propertyService.update(empId, data.id, payload as any); 
        toast.success("Property updated");
      } else {
        await propertyService.create(empId, payload as any);
        toast.success("Property saved");
        setExists(true);
      }
      setSaved(data);
    } catch {
      toast.error("Failed to save property");
    }
  }, [empId, data, exists]);

    useEffect(() => {
      registerSave?.(handleSave);
      return () => {
        registerSave?.(null);
      };
    }, [registerSave, handleSave]);

  const handleCancel = useCallback(() => {
    setData(saved);
  }, [saved]);

  return (
    <div className="space-y-6">
      <div className="text-base font-semibold">Company Properties</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Item Code:" value={data.itemCode} disabled={!editing}
          onChange={(v) => set("itemCode", v)} required />

        <Field label="Date Given:" type="date" value={data.dateGiven}
          disabled={!editing} onChange={(v) => set("dateGiven", v)} required />

        <Field label="Item Name:" value={data.itemName}
          disabled={!editing} onChange={(v) => set("itemName", v)} required />

        <Field
          label="Return Date:"
          type="date"
          value={data.returnDate}
          disabled={!editing || data.itemStatus === "ISSUED"}
          onChange={(v) => set("returnDate", v)}
          ariaLabel="Return Date"
          required={data.itemStatus === "RETURNED"}
        />

        <div>
          <Label className="text-sm">Item Status:<span className="text-red-500 ml-1">*</span></Label>
          <select
            className="h-9 w-full rounded-md border px-3 text-sm"
            value={data.itemStatus}
            disabled={!editing}
            onChange={(e) => set("itemStatus", e.target.value)}
            aria-label="Item Status"
          >
            <option value="">Select status</option>
            <option value="ISSUED">ISSUED</option>
            <option value="RETURNED">RETURNED</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <Label className="text-sm">
            Item Description:<span className="text-red-500 ml-1">*</span>
          </Label>
          <Textarea value={data.description}
            disabled={!editing}
            onChange={(e) => set("description", e.target.value)}
            className="min-h-[160px]" />
        </div>
      </div>

      {editing && (
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
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
