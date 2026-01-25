import type { ReactElement } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye } from "lucide-react";
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
      await reload();
      setEditingIndex(null);
      try {
        document.dispatchEvent(new CustomEvent("property:saved", { detail: response?.data }));
      } catch (e) {
        // ignore
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-8 px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600&family=DM+Sans:wght@400;500;700&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        h1,h2,h3 { font-family: 'Crimson Pro', serif; }
        @keyframes slideIn { from { opacity:0; transform:translateY(30px);} to {opacity:1; transform:translateY(0);} }
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-20px);} to {opacity:1; transform:translateY(0);} }
        .container { animation: slideIn 0.6s cubic-bezier(0.22,1,0.36,1); }
        .header-title { animation: fadeInDown 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
        .header-subtitle { animation: fadeInDown 0.6s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
        input, select, textarea { transition: all 0.3s cubic-bezier(0.22,1,0.36,1); }
        input:focus, select:focus, textarea:focus { outline: none; }
        button { transition: all 0.3s cubic-bezier(0.22,1,0.36,1); }
      `}</style>

      <div className="container mx-auto max-w-5xl bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="relative bg-gradient-to-br from-white to-gray-50 p-8 md:p-12 border-b border-gray-200 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-orange-500/5 to-transparent rounded-full -mr-48 -mt-48"></div>
          <h1 className="header-title relative text-2xl md:text-3xl font-semibold text-gray-800 mb-1">
            Company Properties
          </h1>
          <p className="header-subtitle relative text-gray-600 text-base">
            Track and manage company assets and equipment
          </p>
        </div>

        <div className="p-6 md:p-10">
          <div className="flex items-start gap-4 mb-8 p-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50/50 border-l-4 border-green-500 shadow-sm">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm">
              📦
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800 mb-1">New Property Assignment</div>
              <div className="text-sm text-gray-600">Fill in the details below to assign company property to an employee</div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800">Company Properties</h2>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg hover:shadow-xl px-6 py-3 rounded-xl font-semibold hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                Add Property
              </button>
            </div>

            <div className="space-y-4">
              {items.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="text-4xl mb-3">📋</div>
                  <div className="font-medium">No properties recorded yet</div>
                  <div className="text-sm mt-1">Click "Add Property" to get started</div>
                </div>
              )}

              {items.map((it, idx) => {
                const isEditing = editingIndex === idx;
                return (
                  <div
                    key={it.id ?? idx}
                    className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-md"
                  >
                    {isEditing ? (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-800 pb-3 border-b-2 border-gray-200">Item Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Field
                            label="Item Code"
                            value={it.itemCode}
                            onChange={(v) => updateItem(idx, { itemCode: v })}
                            required
                            helpText="Unique identifier for this item"
                          />

                          <Field
                            label="Item Name"
                            value={it.itemName}
                            onChange={(v) => updateItem(idx, { itemName: v })}
                            required
                          />

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                              Item Status<span className="text-orange-500">*</span>
                            </label>
                            <select
                              value={it.itemStatus || ""}
                              onChange={(e) => updateItem(idx, { itemStatus: e.target.value as any })}
                              className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 bg-white"
                              disabled={!(editing || isEditing)}
                            >
                              <option value="">Select status</option>
                              <option value="ASSIGNED">Assigned</option>
                              <option value="RETURNED">Returned</option>
                              <option value="LOST">Lost</option>
                              <option value="DAMAGED">Damaged</option>
                            </select>
                          </div>

                          <Field
                            label="Date Given"
                            type="date"
                            value={it.dateGiven}
                            onChange={(v) => updateItem(idx, { dateGiven: v })}
                            required
                          />

                          <Field
                            label="Return Date"
                            type="date"
                            value={it.returnDate}
                            onChange={(v) => updateItem(idx, { returnDate: v })}
                            disabled={it.itemStatus === "ASSIGNED"}
                            required={it.itemStatus === "RETURNED" || it.itemStatus === "LOST"}
                            helpText="Expected or actual return date"
                          />

                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                              Item Description<span className="text-orange-500">*</span>
                            </label>
                            <Textarea
                              value={it.description}
                              disabled={!(editing || isEditing)}
                              onChange={(e) => updateItem(idx, { description: e.target.value })}
                              className="w-full min-h-[120px] px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-y"
                              placeholder="Provide detailed description including model, serial number, specifications, condition, etc."
                            />
                          </div>

                          <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-gray-200">
                            <button
                              onClick={() => handleCancel()}
                              className="px-6 py-2.5 border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-medium text-gray-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => void handleSaveItem(it)}
                              className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg hover:shadow-xl rounded-xl font-semibold hover:-translate-y-0.5"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {viewingIndex !== idx ? (
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <div className="font-semibold text-lg text-gray-800">{it.itemCode} — {it.itemName}</div>
                                {getStatusBadge(it.itemStatus)}
                              </div>
                              <div className="text-sm text-gray-600 mb-3">
                                📅 {it.dateGiven ? new Date(it.dateGiven).toLocaleDateString() : "—"}
                              </div>
                              <div className="text-sm text-gray-700 line-clamp-2">{it.description}</div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setViewingIndex(idx)}
                                className="flex items-center gap-1.5 px-3 py-2 hover:bg-blue-50 rounded-lg text-sm font-medium text-gray-700"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                onClick={() => handleEdit(idx)}
                                className="px-3 py-2 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(idx)}
                                className="px-3 py-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-sm font-medium"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <ViewField label="Item Code" value={it.itemCode} />
                              <ViewField label="Item Name" value={it.itemName} />
                              <ViewField label="Date Given" value={it.dateGiven ? new Date(it.dateGiven).toLocaleDateString() : "—"} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
                                <div>{getStatusBadge(it.itemStatus)}</div>
                              </div>
                              <ViewField label="Return Date" value={it.returnDate ? new Date(it.returnDate).toLocaleDateString() : "—"} />
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">{it.description || "—"}</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => setViewingIndex(null)}
                                className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                              >
                                Close
                              </button>
                              <button
                                onClick={() => { setViewingIndex(null); handleEdit(idx); }}
                                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-lg text-sm font-semibold"
                              >
                                Edit
                              </button>
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
  required?: boolean;
  helpText?: string;
}) {
  const { label, value, onChange, type = "text", disabled, required, helpText } = props;
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-orange-500">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
    </div>
  );
}

function ViewField(props: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{props.label}</p>
      <p className="text-sm text-gray-700">{props.value || "—"}</p>
    </div>
  );
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    ASSIGNED: { label: "Assigned", className: "bg-blue-50 text-blue-700" },
    RETURNED: { label: "Returned", className: "bg-gray-100 text-gray-700" },
    LOST: { label: "Lost", className: "bg-red-50 text-red-700" },
    DAMAGED: { label: "Damaged", className: "bg-red-50 text-red-700" },
    "": { label: "-", className: "bg-gray-100 text-gray-700" },
  };
  const cfg = statusConfig[status] ?? { label: status || "-", className: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
