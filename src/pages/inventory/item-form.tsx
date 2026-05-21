/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createItem,
  listCategories,
  createCategory,
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
import type { ItemResponseDTO } from "@/service/erpApiTypes";

// Section card
function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
          {icon}
        </div>
        <span className="text-[13px] font-semibold text-slate-700">{title}</span>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

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
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

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
      const newCategory = await createCategory({ name: newCategoryName.trim(), code: newCategoryName.trim().toUpperCase().replace(/\s+/g, "_") });
      toast.success("Category created successfully!");
      const cats = await listCategories();
      setCategories(cats);
      setValue("category", newCategory.name);
      setNewCategoryName("");
      setShowCreateCategoryDialog(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to create category. Please try again.");
    } finally {
      setCreatingCategory(false);
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
    unitSale: Number(data.unitSale ?? 0),
    unitMeasure: data.unit, reorderLevel: Number(data.reorderLevel ?? 0),
    status: data.status, barcode: data.barcode,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* ── Section: Item Image ── */}
      <SectionCard icon={<Package className="h-3.5 w-3.5 text-white" />} title="Item image">
        <div className="flex items-center gap-4">
          <Input
            type="file" accept="image/*"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) setValue("image", file); }}
            className="file:mr-4 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white file:transition-all hover:file:bg-slate-700"
          />
          {watch("image") && <span className="text-[12px] text-emerald-600 font-medium">{(watch("image") as File)?.name}</span>}
        </div>
        <p className="text-[11px] text-slate-400">JPG / PNG · Max 5MB</p>
      </SectionCard>

      {/* ── Section: Basic Information ── */}
      <SectionCard icon={<Tag className="h-3.5 w-3.5 text-white" />} title="Basic information">
        <div className="grid grid-cols-2 gap-5">
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

          <div className="col-span-2">
            <F label="Description">
              <Textarea
                placeholder="Item description"
                rows={3}
                {...register("description")}
                className="rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] resize-none"
              />
            </F>
          </div>
        </div>
      </SectionCard>

      {/* ── Section: Classification ── */}
      <SectionCard icon={<Layers className="h-3.5 w-3.5 text-white" />} title="Classification">
        <div className="grid grid-cols-2 gap-5">
          <F label="Category" required>
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(value) => { setValue("category", value); setValue("subcategory", ""); const cat = categories.find((c) => c.name === value); if (cat) setSelectedCategory(cat); }}
                value={watch("category")} disabled={loadingCategories}
              >
                <SelectTrigger className={icls}>
                  <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  {loadingCategories ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Loading categories...</div>
                  ) : categories.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">No categories available. Click "New Category" to create one.</div>
                  ) : (
                    categories.map((cat) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateCategoryDialog(true)} className="h-10 shrink-0 rounded-xl border-slate-200 text-[12px] font-medium">
                <Plus className="h-3.5 w-3.5 mr-1" />New
              </Button>
            </div>
            {errors.category && <p className="text-[11px] text-rose-400 mt-1">{errors.category.message}</p>}
          </F>

          <F label="Sub Category">
            <Select onValueChange={(value) => setValue("subcategory", value)} value={watch("subcategory")} disabled={selectedCategory?.subCategories?.length === 0}>
              <SelectTrigger className={icls}>
                <SelectValue placeholder={loadingCategories ? "Loading subcategories..." : "Select sub category"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                {!selectedCategory ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">Please select a category first.</div>
                ) : (
                  selectedCategory.subCategories?.map((cat) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)
                )}
              </SelectContent>
            </Select>
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
      </SectionCard>

      {/* ── Section: Unit & Warehouse ── */}
      <SectionCard icon={<Package className="h-3.5 w-3.5 text-white" />} title="Unit &amp; warehouse">
        <div className="grid grid-cols-2 gap-5">
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

          <div className="col-span-2">
            <F label="Bin / Location">
              <Input placeholder="e.g., Aisle 3, Shelf B" {...register("location")} className={icls} />
            </F>
          </div>
        </div>
      </SectionCard>

      {/* ── Section: Pricing ── */}
      <SectionCard icon={<DollarSign className="h-3.5 w-3.5 text-white" />} title="Pricing">
        <div className="grid grid-cols-2 gap-5">
          <F label="Cost Price" required>
            <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("costPrice", { valueAsNumber: true })} className={icls} />
            {errors.costPrice && <p className="text-[11px] text-rose-400 mt-1">{errors.costPrice.message}</p>}
          </F>

          <F label="Selling Price" required>
            <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("sellingPrice", { valueAsNumber: true })} className={icls} />
            {errors.sellingPrice && <p className="text-[11px] text-rose-400 mt-1">{errors.sellingPrice.message}</p>}
          </F>

          <F label="Unit Sale Price">
            <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("unitSale", { setValueAs: (v) => v === "" || v == null ? 0 : Number(v) })} className={icls} />
            {errors.unitSale && <p className="text-[11px] text-rose-400 mt-1">{errors.unitSale.message}</p>}
          </F>

          <F label="Reorder Level" required>
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
      </SectionCard>

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
    </form>
  );
}

export default CreateItemForm;