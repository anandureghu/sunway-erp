/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createItem,
  listCategories,
  createCategory,
  generateCategoryCode,
  updateItem,
  updateItemMultipart,
} from "@/service/inventoryService";
import type { ItemCategory } from "@/types/inventory";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Package, Tag, DollarSign, Layers } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  ITEM_SCHEMA,
  type ItemFormData,
  type ItemFormValues,
} from "@/schema/inventory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import SelectWarehouse from "@/components/select-warehouse";
import { ItemSectionCard } from "@/components/inventory/item-section-card";
import type { ItemResponseDTO } from "@/service/erpApiTypes";

// Field wrapper
function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const icls =
  "h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

function SelectWithAddButton({
  children,
  onAdd,
  addLabel,
  disabled,
}: {
  children: React.ReactNode;
  onAdd: () => void;
  addLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        onClick={onAdd}
        title={addLabel}
        aria-label={addLabel}
        className="h-10 w-10 shrink-0 rounded-xl border-slate-200"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Create Item Form Component
function CreateItemForm({
  onSuccess,
  onCancel,
  editMode = false,
  initialData,
}: {
  onSuccess: (item: ItemResponseDTO) => void;
  onCancel: () => void;
  editMode?: boolean;
  initialData?: ItemResponseDTO;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [showCreateSubCategoryDialog, setShowCreateSubCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubCategory, setCreatingSubCategory] = useState(false);

  const refreshCategories = async () => {
    const cats = await listCategories();
    setCategories(cats);
    return cats;
  };

  const syncSelectedCategory = (cats: ItemCategory[], categoryName: string) => {
    const cat = cats.find((c) => c.name === categoryName) ?? null;
    setSelectedCategory(cat);
    return cat;
  };

  // Load categories from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingCategories(true);
        const cats = await listCategories();
        if (!cancelled) setCategories(cats);
      } catch (error: any) {
        if (!cancelled) toast.error(`Failed to load categories: ${error?.response?.data?.message ?? error?.message ?? "Unknown error"}`);
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) { toast.error("Please enter a category name"); return; }
    try {
      setCreatingCategory(true);
      const normalizedName = newCategoryName.trim();
      const newCategory = await createCategory({
        name: normalizedName,
        code: generateCategoryCode(normalizedName),
        status: "active",
      });
      toast.success("Category created successfully!");
      const cats = await refreshCategories();
      setValue("category", newCategory.name);
      setValue("subcategory", "");
      syncSelectedCategory(cats, newCategory.name);
      setNewCategoryName("");
      setShowCreateCategoryDialog(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to create category. Please try again.");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateSubCategory = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category first");
      return;
    }
    if (!newSubCategoryName.trim()) {
      toast.error("Please enter a sub category name");
      return;
    }
    try {
      setCreatingSubCategory(true);
      const normalizedName = newSubCategoryName.trim();
      const newSubCategory = await createCategory({
        name: normalizedName,
        code: generateCategoryCode(normalizedName),
        status: "active",
        parentId: Number(selectedCategory.id),
      });
      toast.success("Sub category created successfully!");
      const cats = await refreshCategories();
      syncSelectedCategory(cats, selectedCategory.name);
      setValue("subcategory", newSubCategory.name);
      setNewSubCategoryName("");
      setShowCreateSubCategoryDialog(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to create sub category. Please try again.");
    } finally {
      setCreatingSubCategory(false);
    }
  };

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, getValues } = useForm<ItemFormValues>({
    resolver: zodResolver(ITEM_SCHEMA),
    defaultValues: { status: "active", unit: "pcs", costPrice: 0, sellingPrice: 0, reorderLevel: 0, minimum: 0, maximum: 0, unitSale: 0 },
  });

  const buildPayload = (data: ItemFormData, warehouseId?: number) => ({
    sku: data.sku?.toUpperCase(), name: data.name, type: data.itemType,
    category: data.category, subCategory: data.subcategory, brand: data.brand,
    description: data.description, location: data.location, serialNo: data.serialNo,
    warehouse: warehouseId ?? data.warehouse,
    quantity: Number(data.quantity ?? 0),
    minimum: Number(data.minimum ?? 0), maximum: Number(data.maximum ?? 0),
    costPrice: Number(data.costPrice ?? 0), sellingPrice: Number(data.sellingPrice ?? 0),
    unitSale: Number(data.sellingPrice ?? 0),
    unitMeasure: data.unit, reorderLevel: Number(data.reorderLevel ?? 0),
    status: data.status, barcode: data.barcode,
    expiryDate: data.expiryDate ?? "",
  });

  const mapItemToForm = (item: ItemResponseDTO): ItemFormValues => ({
    id: item.id?.toString(),
    sku: item.sku ?? "", name: item.name ?? "", itemType: item.type ?? "",
    category: item.category ?? "", subcategory: item.subCategory ?? "", brand: item.brand ?? "",
    description: item.description ?? "",
    location: item.location ?? "", serialNo: item.serialNo ?? "",
    unit: (item.unitMeasure as any) ?? undefined,
    warehouse: Number(item.warehouse_id) || 0,
    quantity: item.quantity ?? 0,
    minimum: item.minimum ?? 0, maximum: item.maximum ?? 0,
    reorderLevel: item.reorderLevel ?? 0,
    costPrice: Number(item.costPrice ?? 0), sellingPrice: Number(item.sellingPrice ?? 0),
    unitSale: Number(item.unitSale ?? 0),
    status: (item.status as any) ?? "active",
    barcode: item.barcode ?? "",
    dateReceived: item.dateReceived ?? "",
    expiryDate: item.expiryDate ?? "",
  });

  useEffect(() => {
    if (editMode && initialData) {
      reset(mapItemToForm(initialData));
      setSelectedCategory(categories.find((c) => c.name === initialData.category) || null);
    }
  }, [editMode, initialData, reset, categories]);

  const onSubmit = async (data: ItemFormData) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      const resolvedWarehouseId = Number(data.warehouse ?? getValues("warehouse") ?? initialData?.warehouse_id);
      const payload = buildPayload(data, resolvedWarehouseId);
      formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      if (data.image) formData.append("image", data.image);
      if (editMode) {
        const editItemId = initialData?.id ?? (data.id ? Number(data.id) : NaN);
        if (!Number.isFinite(editItemId)) throw new Error("Missing item id for update");
        if (!Number.isFinite(resolvedWarehouseId) || resolvedWarehouseId <= 0) throw new Error("Please select a valid warehouse");
        const updated = data.image ? await updateItemMultipart(editItemId, formData) : await updateItem(editItemId, payload);
        toast.success("Item updated successfully!");
        onSuccess(updated);
      } else {
        const created = await createItem(formData);
        toast.success("Item created successfully!");
        onSuccess(created);
        reset();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to save item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldsGrid = "grid grid-cols-2 gap-4 xl:grid-cols-3";
  const descriptionSpan = "col-span-2 xl:col-span-3";
  const locationSpan = "col-span-2 xl:col-span-3";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {!editMode && (
      <ItemSectionCard icon={<Package className="h-3.5 w-3.5 text-white" />} title="Item image">
        <div className="flex items-center gap-4">
          <Input
            type="file" accept="image/*"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) setValue("image", file); }}
            className="file:mr-4 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white file:transition-all hover:file:bg-slate-700"
          />
          {watch("image") && <span className="text-[12px] text-emerald-600 font-medium">{(watch("image") as File)?.name}</span>}
        </div>
        <p className="text-[11px] text-slate-400">JPG / PNG · Max 5MB</p>
      </ItemSectionCard>
      )}

      {/* ── Section: Basic Information ── */}
      <ItemSectionCard icon={<Tag className="h-3.5 w-3.5 text-white" />} title="Basic information">
        <div className={fieldsGrid}>
          <F label="SKU" required>
            <Input placeholder="SKU-001" {...register("sku")} className={icls} />
            {errors.sku && <p className="text-[11px] text-rose-400 mt-1">{errors.sku.message}</p>}
          </F>

          <F label="Item Name" required>
            <Input placeholder="Item name" {...register("name")} className={icls} />
            {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name.message}</p>}
          </F>

          <F label="Brand">
            <Input placeholder="Optional brand name" {...register("brand")} className={icls} />
            {errors.brand && <p className="text-[11px] text-rose-400 mt-1">{errors.brand.message}</p>}
          </F>

          <F label="Item Type">
            <Input placeholder="e.g., Raw Material, Finished Good" {...register("itemType")} className={icls} />
            {errors.itemType && <p className="text-[11px] text-rose-400 mt-1">{errors.itemType.message}</p>}
          </F>

          <div className={descriptionSpan}>
            <F label="Description">
              <Textarea
                placeholder="Item description"
                rows={2}
                {...register("description")}
                className="rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] resize-none"
              />
            </F>
          </div>
        </div>
      </ItemSectionCard>

      {/* ── Section: Classification ── */}
      <ItemSectionCard icon={<Layers className="h-3.5 w-3.5 text-white" />} title="Classification">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <F label="Category" required>
            <SelectWithAddButton
              addLabel="Add category"
              onAdd={() => setShowCreateCategoryDialog(true)}
            >
              <Select
                onValueChange={(value) => {
                  setValue("category", value);
                  setValue("subcategory", "");
                  const cat = categories.find((c) => c.name === value);
                  if (cat) setSelectedCategory(cat);
                }}
                value={watch("category")}
                disabled={loadingCategories}
              >
                <SelectTrigger className={icls}>
                  <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  {loadingCategories ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Loading categories...</div>
                  ) : categories.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">No categories yet. Use + to add one.</div>
                  ) : (
                    categories.map((cat) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </SelectWithAddButton>
            {errors.category && <p className="text-[11px] text-rose-400 mt-1">{errors.category.message}</p>}
          </F>

          <F label="Sub category">
            <SelectWithAddButton
              addLabel="Add sub category"
              disabled={!selectedCategory || loadingCategories}
              onAdd={() => setShowCreateSubCategoryDialog(true)}
            >
              <Select
                onValueChange={(value) => setValue("subcategory", value)}
                value={watch("subcategory")}
                disabled={!selectedCategory || loadingCategories}
              >
                <SelectTrigger className={icls}>
                  <SelectValue
                    placeholder={
                      !selectedCategory
                        ? "Select a category first"
                        : loadingCategories
                          ? "Loading subcategories..."
                          : "Select sub category"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  {!selectedCategory ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Select a category first.</div>
                  ) : (selectedCategory.subCategories?.length ?? 0) === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">No sub categories yet. Use + to add one.</div>
                  ) : (
                    selectedCategory.subCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </SelectWithAddButton>
          </F>

          <F label="Status" required>
            <Select onValueChange={(value) => setValue("status", value as any)} value={watch("status")}>
              <SelectTrigger className={icls}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-[11px] text-rose-400 mt-1">{errors.status.message}</p>}
          </F>

          <F label="Barcode">
            <Input placeholder="Optional barcode" {...register("barcode")} className={icls} />
          </F>

          <F label="Serial No.">
            <Input placeholder="Optional serial number" {...register("serialNo")} className={icls} />
          </F>
        </div>
      </ItemSectionCard>

      {/* ── Section: Unit & Warehouse ── */}
      <ItemSectionCard icon={<Package className="h-3.5 w-3.5 text-white" />} title="Unit &amp; warehouse">
        <div className={fieldsGrid}>
          <F label="Unit" required>
            <Select onValueChange={(value) => setValue("unit", value as any)} value={watch("unit")}>
              <SelectTrigger className={icls}><SelectValue placeholder="Select unit" /></SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                <SelectItem value="pcs">Pieces (pcs)</SelectItem><SelectItem value="kg">Kilogram (kg)</SelectItem>
                <SelectItem value="g">Gram (g)</SelectItem><SelectItem value="box">Box</SelectItem>
                <SelectItem value="pallet">Pallet</SelectItem><SelectItem value="liter">Liter</SelectItem>
                <SelectItem value="meter">Meter</SelectItem><SelectItem value="carton">Carton</SelectItem>
                <SelectItem value="bag">Bag</SelectItem><SelectItem value="bucket">Bucket</SelectItem>
              </SelectContent>
            </Select>
            {errors.unit && <p className="text-[11px] text-rose-400 mt-1">{errors.unit.message}</p>}
          </F>

          <div>
            <SelectWarehouse
              value={watch("warehouse")?.toString() || undefined}
              onChange={(value) => { setValue("warehouse", Number(value)); }}
            />
            {errors.warehouse && <p className="text-[11px] text-rose-400 mt-1">{errors.warehouse.message}</p>}
          </div>

          {!editMode && (
            <F label="Initial Quantity" required>
              <Input type="number" step="1" min="0" placeholder="0" {...register("quantity", { valueAsNumber: true })} className={icls} />
              {errors.quantity && <p className="text-[11px] text-rose-400 mt-1">{errors.quantity.message}</p>}
            </F>
          )}

          <div className={locationSpan}>
            <F label="Bin / Location">
              <Input placeholder="e.g., Aisle 3, Shelf B" {...register("location")} className={icls} />
            </F>
          </div>

          {editMode && watch("dateReceived") ? (
            <F label="Date Received">
              <Input type="date" {...register("dateReceived")} className={icls} disabled />
            </F>
          ) : null}

          <F label="Sale by Date">
            <Input type="date" {...register("expiryDate")} className={icls} />
            <p className="text-[11px] text-slate-400 mt-1">Optional</p>
          </F>
        </div>
      </ItemSectionCard>

      {/* ── Section: Pricing ── */}
      <ItemSectionCard icon={<DollarSign className="h-3.5 w-3.5 text-white" />} title="Pricing">
        <div className={fieldsGrid}>
          <F label="Cost Price" required>
            <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("costPrice", { valueAsNumber: true })} className={icls} />
            {errors.costPrice && <p className="text-[11px] text-rose-400 mt-1">{errors.costPrice.message}</p>}
          </F>

          <F label="Selling price" required>
            <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("sellingPrice", { valueAsNumber: true })} className={icls} />
            {errors.sellingPrice && <p className="text-[11px] text-rose-400 mt-1">{errors.sellingPrice.message}</p>}
          </F>

          <F label="Reorder level" required>
            <Input type="number" step="1" min="0" placeholder="0" {...register("reorderLevel", { valueAsNumber: true })} className={icls} />
            {errors.reorderLevel && <p className="text-[11px] text-rose-400 mt-1">{errors.reorderLevel.message}</p>}
          </F>

          <F label="Minimum Stock">
            <Input type="number" step="1" min="0" placeholder="0" {...register("minimum", { setValueAs: (v) => v === "" || v == null ? 0 : Number(v) })} className={icls} />
            {errors.minimum && <p className="text-[11px] text-rose-400 mt-1">{errors.minimum.message}</p>}
          </F>

          <F label="Maximum Stock">
            <Input type="number" step="1" min="0" placeholder="0" {...register("maximum", { setValueAs: (v) => v === "" || v == null ? 0 : Number(v) })} className={icls} />
            {errors.maximum && <p className="text-[11px] text-rose-400 mt-1">{errors.maximum.message}</p>}
          </F>
        </div>
      </ItemSectionCard>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-2.5 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}
          className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}
          className="h-10 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50">
          {submitting ? (editMode ? "Updating..." : "Creating...") : (editMode ? "Update Item" : "Create Item")}
        </Button>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
          style={{ maxWidth: 480, width: "calc(100vw - 32px)" }}
        >
          <div className="bg-linear-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <DialogTitle className="text-[15px] font-semibold text-white">Create New Category</DialogTitle>
            </div>
            <button onClick={() => setShowCreateCategoryDialog(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 space-y-5">
            <F label="Category Name" required>
              <Input
                placeholder="e.g., Raw Materials" value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !creatingCategory) { e.preventDefault(); handleCreateCategory(); } }}
                autoFocus className={icls}
              />
            </F>
            <div className="flex items-center justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={() => { setShowCreateCategoryDialog(false); setNewCategoryName(""); }}
                disabled={creatingCategory}
                className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm">
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()}
                className="h-9 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 text-[13px] font-semibold text-white shadow-sm">
                {creatingCategory ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateSubCategoryDialog} onOpenChange={setShowCreateSubCategoryDialog}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
          style={{ maxWidth: 480, width: "calc(100vw - 32px)" }}
        >
          <div className="bg-linear-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <DialogTitle className="text-[15px] font-semibold text-white">
                Create sub category
                {selectedCategory ? ` · ${selectedCategory.name}` : ""}
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateSubCategoryDialog(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 space-y-5">
            <F label="Sub category name" required>
              <Input
                placeholder="e.g., Engine parts"
                value={newSubCategoryName}
                onChange={(e) => setNewSubCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !creatingSubCategory) {
                    e.preventDefault();
                    void handleCreateSubCategory();
                  }
                }}
                autoFocus
                className={icls}
              />
            </F>
            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateSubCategoryDialog(false);
                  setNewSubCategoryName("");
                }}
                disabled={creatingSubCategory}
                className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreateSubCategory()}
                disabled={creatingSubCategory || !newSubCategoryName.trim()}
                className="h-9 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 text-[13px] font-semibold text-white shadow-sm"
              >
                {creatingSubCategory ? "Creating..." : "Create sub category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}

export default CreateItemForm;