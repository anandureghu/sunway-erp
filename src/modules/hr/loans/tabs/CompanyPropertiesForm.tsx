import type { ReactElement } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Eye } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { propertyService } from "@/service/propertyService";

type Ctx = { editing: boolean; setEditing?: (v: boolean) => void; registerSave?: (fn: (() => Promise<void> | void) | null) => void };

type CompanyItem = {
  id?: number;
  itemCode: string;
  itemName: string;
  itemStatus: "ASSIGNED" | "RETURNED" | "LOST" | "DAMAGED" | "";
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

  if (item.itemStatus === "RETURNED" || item.itemStatus === "LOST") {
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

  const [items, setItems] = useState<CompanyItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const reload = useCallback(async () => {
    if (!empId) return;
    try {
      const res = await propertyService.getAll(empId);
      setItems((res.data || []).map((p) => ({
        id: p.id,
        itemCode: p.itemCode ?? "",
        itemName: p.itemName ?? "",
        itemStatus: p.itemStatus ?? "",
        dateGiven: p.dateGiven ?? "",
        returnDate: p.returnDate ?? "",
        description: p.description ?? "",
      })));
    } catch (err: any) {
      console.error("Failed to load properties", err);
      toast.error("Failed to load properties");
    }
  }, [empId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleAdd = useCallback(() => {
    const newItem: CompanyItem = { ...defaultData };
    setItems((cur) => {
      const newItems = [...cur, newItem];
      setEditingIndex(newItems.length - 1);
      return newItems;
    });
  }, []);

  const handleEdit = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  const handleDelete = useCallback((index: number) => {
    const it = items[index];
    if (!window.confirm("Are you sure you want to remove this property?")) return;
    // if item has an id, try server delete; otherwise just remove locally
    void (async () => {
      try {
        if (empId && it?.id) {
          await propertyService.delete(empId, it.id);
          toast.success("Property deleted");
          await reload();
        } else {
          setItems((cur) => cur.filter((_, i) => i !== index));
          toast.success("Property removed");
        }
      } catch (err: any) {
        console.error("Failed to delete property", err);
        toast.error("Failed to delete property");
      } finally {
        setEditingIndex(null);
        setViewingIndex(null);
      }
    })();
  }, [items]);

  const handleSaveItem = useCallback(async (item: CompanyItem) => {
    if (!empId) return;
    if (!validateCompanyItem(item)) {
      toast.error("Please fill required fields");
      return;
    }
    const payload = {
      itemCode: item.itemCode,
      itemName: item.itemName,
      itemStatus: item.itemStatus as "ASSIGNED" | "RETURNED" | "LOST" | "DAMAGED",
      description: item.description,
      dateGiven: item.dateGiven,
      returnDate: item.itemStatus === "ASSIGNED" ? null : item.returnDate || null,
    };

  
    try {
      let response: any = null;
      if (item.id) {
        response = await propertyService.update(empId, item.id, payload as any);
        toast.success("Property updated");
      } else {
        response = await propertyService.create(empId, payload as any);
        toast.success("Property created");
      }
      // reload list from server to get canonical data
      await reload();
      setEditingIndex(null);
      try {
        document.dispatchEvent(new CustomEvent("property:saved", { detail: response?.data }));
      } catch (e) {
        // ignore if not supported
      }
    } catch (err: any) {
      console.error("Failed to save property", err?.response?.data || err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to save property";
      toast.error(msg);
    }
  }, [empId, reload]);

  const handleCancel = useCallback(() => {
    void reload();
    setEditingIndex(null);
  }, [reload]);

  const updateItem = useCallback((index: number, changes: Partial<CompanyItem>) => {
    setItems((cur) => cur.map((it, i) => (i === index ? { ...it, ...changes } : it)));
  }, []);

  useEffect(() => {
    if (!registerSave) return;
    const fn = async () => {
      if (editingIndex == null) return;
      const item = items[editingIndex];
      if (!item) return;
      await handleSaveItem(item);
    };
    registerSave(() => fn());
    return () => registerSave(null);
  }, [registerSave, editingIndex, items, handleSaveItem]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">Company Properties</div>
        <Button onClick={handleAdd} size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">No properties recorded.</div>
        )}

        {items.map((it, idx) => {
          const isEditing = editingIndex === idx;
          return (
            <div key={it.id ?? idx} className="border rounded-md p-4 bg-white">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Item Code:" value={it.itemCode} disabled={!editing && !isEditing}
                    onChange={(v) => updateItem(idx, { itemCode: v })} required />

                  <Field label="Date Given:" type="date" value={it.dateGiven}
                    disabled={!editing && !isEditing} onChange={(v) => updateItem(idx, { dateGiven: v })} required />

                  <Field label="Item Name:" value={it.itemName}
                    disabled={!editing && !isEditing} onChange={(v) => updateItem(idx, { itemName: v })} required />

                  <Field
                    label="Return Date:"
                    type="date"
                    value={it.returnDate}
                    disabled={(!editing && !isEditing) || it.itemStatus === "ASSIGNED"}
                    onChange={(v) => updateItem(idx, { returnDate: v })}
                    ariaLabel="Return Date"
                    required={it.itemStatus === "RETURNED" || it.itemStatus === "LOST"}
                  />

                  <div>
                    <Label className="text-sm">Item Status:<span className="text-red-500 ml-1">*</span></Label>
                    <Select
                      value={it.itemStatus || ""}
                      onValueChange={(v) => updateItem(idx, { itemStatus: v as any })}
                      disabled={!editing && !isEditing}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue>{it.itemStatus || "Select status"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASSIGNED">Assigned</SelectItem>
                        <SelectItem value="RETURNED">Returned</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm">Item Description:<span className="text-red-500 ml-1">*</span></Label>
                    <Textarea value={it.description}
                      disabled={!editing && !isEditing}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      className="min-h-[120px]" />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => handleCancel()}>Cancel</Button>
                    <Button onClick={() => void handleSaveItem(it)}>Save</Button>
                  </div>
                </div>
                  ) : (
                <div className="space-y-3">
                  {viewingIndex !== idx ? (
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{it.itemCode} — {it.itemName}</div>
                        <div className="text-sm text-muted-foreground">{it.dateGiven} • {it.itemStatus || "-"}</div>
                        <div className="mt-2 text-sm">{it.description}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setViewingIndex(idx)} className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(idx)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Item Code</p>
                          <p className="text-sm mt-1">{it.itemCode || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Item Name</p>
                          <p className="text-sm mt-1">{it.itemName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Date Given</p>
                          <p className="text-sm mt-1">{it.dateGiven ? new Date(it.dateGiven).toLocaleDateString() : "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Status</p>
                          <p className="text-sm mt-1">{it.itemStatus || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Return Date</p>
                          <p className="text-sm mt-1">{it.returnDate ? new Date(it.returnDate).toLocaleDateString() : "—"}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Description</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{it.description || "—"}</p>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={() => setViewingIndex(null)}>Close</Button>
                        <Button size="sm" onClick={() => { setViewingIndex(null); handleEdit(idx); }}>Edit</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
