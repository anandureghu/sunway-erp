import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, Package, Calendar, FileText } from "lucide-react";
import { FormRow, FormField } from "@/modules/hr/components/form-components";
import { useParams } from "react-router-dom";
import { propertyService } from "@/service/propertyService";
import { toast } from "sonner";

interface ValidationErrors {
  [key: string]: string | undefined;
}

type CompanyItem = {
  id: string;
  itemCode: string;
  itemName: string;
  itemStatus: "ASSIGNED" | "RETURNED" | "LOST" | "DAMAGED" | "";
  dateGiven: string;
  returnDate: string;
  description: string;
};

const INITIAL_ITEM: CompanyItem = {
  id: "",
  itemCode: "",
  itemName: "",
  itemStatus: "",
  dateGiven: "",
  returnDate: "",
  description: "",
};

function validateCompanyItem(item: CompanyItem): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!item.itemCode?.trim()) errors.itemCode = "Item code is required";
  if (!item.itemName?.trim()) errors.itemName = "Item name is required";
  if (!item.itemStatus) errors.itemStatus = "Item status is required";
  if (!item.dateGiven) errors.dateGiven = "Date given is required";
  if (!item.description?.trim()) errors.description = "Description is required";

  if ((item.itemStatus === "RETURNED" || item.itemStatus === "LOST") && !item.returnDate) {
    errors.returnDate = "Return date is required for returned/lost items";
  }

  if (item.returnDate && item.dateGiven && item.returnDate < item.dateGiven) {
    errors.returnDate = "Return date cannot be before date given";
  }

  return errors;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'assigned': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'returned': return 'bg-gray-50 text-gray-700 border-gray-200';
    case 'lost':
    case 'damaged': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function CompanyPropertiesForm() {
  const [items, setItems] = useState<CompanyItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const reloadFromBackend = useCallback(async () => {
    if (!empId) return;
    try {
      const res = await propertyService.getAll(empId);
      setItems((res.data || []).map((p) => ({
        id: String(p.id ?? ""),
        itemCode: p.itemCode ?? "",
        itemName: p.itemName ?? "",
        itemStatus: p.itemStatus ?? "",
        dateGiven: p.dateGiven ?? "",
        returnDate: p.returnDate ?? "",
        description: p.description ?? "",
      })));
    } catch (err: any) {
      console.error("CompanyPropertiesForm -> failed to load properties:", err?.response?.data ?? err);
      toast.error("Failed to load properties");
    }
  }, [empId]);

  useEffect(() => {
    reloadFromBackend();
  }, [reloadFromBackend]);

  const handleAdd = useCallback(() => {
    const newItem = { ...INITIAL_ITEM, id: "" };
    setItems(current => [...current, newItem]);
    setEditingId("");
  }, []);

  const handleEdit = useCallback((item: CompanyItem) => {
    setEditingId(item.id);
  }, []);

  const handleSave = useCallback(
    async (item: CompanyItem) => {
      setItems((current) => current.map((d) => (d.id === item.id ? item : d)));

      if (!empId) return;

      try {
        const payload = {
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemStatus: item.itemStatus as "ASSIGNED" | "RETURNED" | "LOST" | "DAMAGED",
          description: item.description,
          dateGiven: item.dateGiven,
          returnDate: item.itemStatus === "ASSIGNED" ? null : item.returnDate || null,
        };

        if (item.id) {
          await propertyService.update(empId, Number(item.id), payload as any);
          toast.success("Property updated");
        } else {
          await propertyService.create(empId, payload as any);
          toast.success("Property created");
        }

        await reloadFromBackend();
      } catch (err: any) {
        toast.error("Failed to save property");
      }
    },
    [empId, reloadFromBackend]
  );

  const handleCancel = useCallback(() => {
    setItems(current =>
      current.filter(d => {
        if (d.id !== editingId) return true;
        const isEmpty =
          !(d.itemCode?.trim() ||
            d.itemName?.trim() ||
            d.itemStatus ||
            d.dateGiven ||
            d.description?.trim());
        return !isEmpty;
      })
    );
    setEditingId(null);
  }, [editingId]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this property?")) return;
      if (!empId) return;

      try {
        await propertyService.delete(empId, Number(id));
        toast.success("Property deleted");
        setEditingId(null);
        await reloadFromBackend();
      } catch (err: any) {
        console.error("CompanyPropertiesForm -> delete failed:", err?.response?.data ?? err);
        toast.error("Failed to delete property");
      }
    },
    [empId, reloadFromBackend]
  );

  const updateItem = useCallback((id: string, changes: Partial<CompanyItem>) => {
    setItems((current) => current.map((d) => (d.id === id ? { ...d, ...changes } : d)));
  }, []);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Company Properties
            </h2>
            <p className="text-sm text-slate-500 mt-1">Manage company assets and equipment</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-blue-600 text-white shadow-lg flex items-center gap-2 px-6 py-3 rounded-xl"
          >
            <Plus className="h-5 w-5" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Properties Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          Properties Details
        </h3>

        {/* Properties Grid */}
        <div className="grid gap-6">
          {items.map(item => (
            <div key={item.id} className="border border-slate-200 rounded-lg p-6 mb-6">
              {editingId === item.id ? (
                  <div className="p-6 bg-gradient-to-br from-white to-slate-50">
                    {/* Info Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-1">Property Information</h4>
                          <p className="text-sm text-slate-600">
                            Please provide accurate information about the company property. This information is used for asset tracking and management purposes.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Property Information Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">Property Information</h3>

                      <FormRow columns={2}>
                        <FormField
                          label="Item Code"
                          required
                          error={validateCompanyItem(item).itemCode}
                        >
                          <Input
                            value={item.itemCode}
                            onChange={e => updateItem(item.id, { itemCode: e.target.value })}
                            className="rounded-lg border-slate-300"
                            placeholder="Enter item code"
                          />
                        </FormField>

                        <FormField
                          label="Item Name"
                          required
                          error={validateCompanyItem(item).itemName}
                        >
                          <Input
                            value={item.itemName}
                            onChange={e => updateItem(item.id, { itemName: e.target.value })}
                            className="rounded-lg border-slate-300"
                            placeholder="Enter item name"
                          />
                        </FormField>
                      </FormRow>

                      <FormRow columns={2}>
                        <FormField
                          label="Item Status"
                          required
                          error={validateCompanyItem(item).itemStatus}
                        >
                          <select
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            value={item.itemStatus ?? ""}
                            onChange={e => updateItem(item.id, { itemStatus: (e.target.value as CompanyItem['itemStatus']) || "" })}
                          >
                            <option value="">Select Status</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="RETURNED">Returned</option>
                            <option value="LOST">Lost</option>
                            <option value="DAMAGED">Damaged</option>
                          </select>
                        </FormField>

                        <FormField
                          label="Date Given"
                          required
                          error={validateCompanyItem(item).dateGiven}
                        >
                          <Input
                            type="date"
                            value={item.dateGiven}
                            onChange={e => updateItem(item.id, { dateGiven: e.target.value })}
                            className="rounded-lg border-slate-300"
                          />
                        </FormField>
                      </FormRow>

                      <FormRow columns={1}>
                        <FormField
                          label="Return Date"
                          error={validateCompanyItem(item).returnDate}
                        >
                          <Input
                            type="date"
                            value={item.returnDate}
                            onChange={e => updateItem(item.id, { returnDate: e.target.value })}
                            className="rounded-lg border-slate-300"
                            disabled={item.itemStatus === "ASSIGNED"}
                          />
                          <p className="text-xs text-slate-500">Required for returned/lost items</p>
                        </FormField>
                      </FormRow>
                    </div>

                    {/* Description Section */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 shadow-sm border border-blue-100">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Description</h3>

                      <FormField
                        label="Item Description"
                        required
                        error={validateCompanyItem(item).description}
                      >
                        <Textarea
                          value={item.description}
                          onChange={e => updateItem(item.id, { description: e.target.value })}
                          className="rounded-lg border-slate-300 min-h-[120px]"
                          placeholder="Provide detailed description including model, serial number, specifications, condition, etc."
                        />
                      </FormField>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="px-6 rounded-lg border-slate-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={Object.keys(validateCompanyItem(item)).length > 0}
                        onClick={async () => {
                          await handleSave(item);
                          setEditingId(null);
                        }}
                        className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg"
                      >
                        Save Property
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    {/* Summary View */}
                    {viewingId !== item.id && (
                      <div className="relative">
                        <div className="pr-52">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-slate-800">
                              {item.itemCode} — {item.itemName}
                            </h3>
                            {item.itemStatus && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.itemStatus)}`}>
                                {item.itemStatus}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                              <p className="text-xs text-slate-600 mb-1">Date Given</p>
                              <p className="text-sm font-semibold text-blue-700">{item.dateGiven ? new Date(item.dateGiven).toLocaleDateString() : "N/A"}</p>
                            </div>
                            {item.returnDate && (
                              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
                                <p className="text-xs text-slate-600 mb-1">Return Date</p>
                                <p className="text-sm font-semibold text-emerald-700">{new Date(item.returnDate).toLocaleDateString()}</p>
                              </div>
                            )}
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                              <p className="text-xs text-slate-600 mb-1">Status</p>
                              <p className="text-sm font-semibold text-violet-700">{item.itemStatus || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 flex gap-2 w-48">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingId(item.id)}
                            className="flex items-center gap-1 rounded-lg flex-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="rounded-lg flex-1"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 rounded-lg flex-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Full Details View */}
                    {viewingId === item.id && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-slate-800">
                            {item.itemCode} — {item.itemName}
                          </h3>
                          {item.itemStatus && (
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(item.itemStatus)}`}>
                              {item.itemStatus}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Package className="h-5 w-5 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-blue-700">Item Code</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-800">{item.itemCode || "—"}</p>
                          </div>
                          <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-emerald-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-emerald-600" />
                              </div>
                              <span className="text-sm font-medium text-emerald-700">Date Given</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-800">{item.dateGiven ? new Date(item.dateGiven).toLocaleDateString() : "—"}</p>
                          </div>
                          <div className="bg-violet-50 p-5 rounded-lg border border-violet-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-violet-100 rounded-lg">
                                <FileText className="h-5 w-5 text-violet-600" />
                              </div>
                              <span className="text-sm font-medium text-violet-700">Status</span>
                            </div>
                            <p className="text-2xl font-bold text-violet-800">{item.itemStatus || "—"}</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">Property Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label="Item Code" value={item.itemCode || "—"} />
                            <DetailItem label="Item Name" value={item.itemName || "—"} />
                            <DetailItem label="Date Given" value={item.dateGiven ? new Date(item.dateGiven).toLocaleDateString() : "—"} />
                            <DetailItem label="Return Date" value={item.returnDate ? new Date(item.returnDate).toLocaleDateString() : "—"} />
                          </div>
                        </div>

                        {item.description && (
                          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                            <h4 className="text-lg font-semibold text-slate-800 mb-4">Description</h4>
                            <DetailItem label="Item Description" value={item.description} />
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingId(null)}
                            className="rounded-lg border-slate-300"
                          >
                            Close
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setViewingId(null);
                              handleEdit(item);
                            }}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg"
                          >
                            Edit Property
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
              <Package className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No properties added yet</h3>
            <p className="text-slate-600 mb-6">Click "Add Property" to create your first company property</p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg rounded-xl px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Property
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">{label}</p>
      <p className="text-base text-slate-800 font-medium">{value}</p>
    </div>
  );
}
