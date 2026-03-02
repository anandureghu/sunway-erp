/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createItem,
  listCategories,
  createCategory,
  updateItem,
} from "@/service/inventoryService";
import type { ItemCategory } from "@/types/inventory";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SelectWarehouse from "@/components/select-warehouse";
import type { ItemResponseDTO } from "@/service/erpApiTypes";

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
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(
    null,
  );
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] =
    useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Load categories from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingCategories(true);
        const cats = await listCategories();
        if (!cancelled) {
          setCategories(cats);
          if (cats.length === 0) {
            console.warn("No categories returned from API");
          }
        }
      } catch (error: any) {
        console.error("Failed to load categories:", error);
        console.error("Error details:", {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        });
        if (!cancelled) {
          toast.error(
            `Failed to load categories: ${
              error?.response?.data?.message ||
              error?.message ||
              "Unknown error"
            }`,
          );
          // Set empty array so the UI shows the "no categories" message
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle creating a new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setCreatingCategory(true);
      const newCategory = await createCategory({
        name: newCategoryName.trim(),
        code: newCategoryName.trim().toUpperCase().replace(/\s+/g, "_"),
      });
      toast.success("Category created successfully!");

      // Reload categories
      const cats = await listCategories();
      setCategories(cats);

      // Set the new category as selected
      setValue("category", newCategory.name);

      // Reset form
      setNewCategoryName("");
      setShowCreateCategoryDialog(false);
    } catch (error: any) {
      console.error("Failed to create category:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to create category. Please try again.",
      );
    } finally {
      setCreatingCategory(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    getValues,
  } = useForm<ItemFormValues>({
    resolver: zodResolver(ITEM_SCHEMA),
    defaultValues: {
      status: "active",
      unit: "pcs",
      costPrice: 0,
      sellingPrice: 0,
      reorderLevel: 0,
    },
  });

  const buildPayload = (data: ItemFormData) => ({
    sku: data.sku?.toUpperCase(),
    name: data.name,
    type: data.itemType,
    category: data.category,
    subCategory: data.subcategory,
    brand: data.brand,
    description: data.description,
    warehouse: data.warehouse,
    quantity: Number(data.quantity ?? 0),
    minimum: 0,
    maximum: 0,
    costPrice: Number(data.costPrice ?? 0),
    sellingPrice: Number(data.sellingPrice ?? 0),
    unitMeasure: data.unit,
    reorderLevel: Number(data.reorderLevel ?? 0),
    status: data.status,
    barcode: data.barcode,
  });

  const mapItemToForm = (item: ItemResponseDTO): ItemFormValues => ({
    id: item.id?.toString(),

    sku: item.sku ?? "",
    name: item.name ?? "",
    itemType: item.type ?? "",
    category: item.category ?? "",
    subcategory: item.subCategory ?? "",
    brand: item.brand ?? "",
    description: item.description ?? "",

    unit: (item.unitMeasure as any) ?? undefined,

    warehouse: Number(item.warehouse_id) || 0,

    quantity: item.quantity ?? 0,
    reorderLevel: item.reorderLevel ?? 0,

    costPrice: Number(item.costPrice ?? 0),
    sellingPrice: Number(item.sellingPrice ?? 0),

    status: (item.status as any) ?? "active",

    barcode: item.barcode ?? "",
  });

  useEffect(() => {
    if (editMode && initialData) {
      reset(mapItemToForm(initialData));

      setSelectedCategory(
        categories.find((c) => c.name === initialData.category) || null,
      );
    }
  }, [editMode, initialData, reset, categories]);

  const onSubmit = async (data: ItemFormData) => {
    try {
      setSubmitting(true);

      const formData = new FormData();
      const payload = buildPayload(data);

      formData.append(
        "data",
        new Blob([JSON.stringify(payload)], {
          type: "application/json",
        }),
      );

      if (data.image) {
        formData.append("image", data.image);
      }

      if (editMode) {
        const updated = await updateItem(data.id!, formData);
        toast.success("Item updated successfully!");
        onSuccess(updated);
      } else {
        const created = await createItem(formData);
        toast.success("Item created successfully!");
        onSuccess(created);
        reset();
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to save item. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium mb-2 block">Item Image</label>

          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setValue("image", file);
                }
              }}
            />

            {watch("image") && (
              <span className="text-sm text-green-600">
                {(watch("image") as File)?.name}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            JPG / PNG · Max 5MB
          </p>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">
            SKU <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="SKU-001"
            {...register("sku")}
            disabled={editMode}
          />
          {errors.sku && (
            <p className="text-sm text-red-500 mt-1">{errors.sku.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Item Name <span className="text-red-500">*</span>
          </label>
          <Input placeholder="Item name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium mb-2 block">Description</label>
          <Input placeholder="Item description" {...register("description")} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateCategoryDialog(true)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              New Category
            </Button>
          </div>
          <Select
            onValueChange={(value) => {
              setValue("category", value);
              setValue("subcategory", "");
              const category = categories.find((cat) => cat.name === value);
              if (category) setSelectedCategory(category);
            }}
            value={watch("category")}
            disabled={loadingCategories}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingCategories
                    ? "Loading categories..."
                    : "Select category"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {loadingCategories ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No categories available. Click "New Category" to create one.
                </div>
              ) : (
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500 mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Item Type</label>
          <Input
            placeholder="e.g., Raw Material, Finished Good"
            {...register("itemType")}
          />
          {errors.itemType && (
            <p className="text-sm text-red-500 mt-1">
              {errors.itemType.message}
            </p>
          )}
        </div>

        {/* <div>
          <label className="text-sm font-medium mb-2 block">Subcategory</label>
          <Input
            placeholder="Optional subcategory"
            {...register("subcategory")}
          />
          {errors.subcategory && (
            <p className="text-sm text-red-500 mt-1">
              {errors.subcategory.message}
            </p>
          )}
        </div> */}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Sub Category</label>
          </div>
          <Select
            onValueChange={(value) => setValue("subcategory", value)}
            value={watch("subcategory")}
            disabled={selectedCategory?.subCategories?.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingCategories
                    ? "Loading subcategories..."
                    : "Select sub category"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {!selectedCategory ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  please select a category first.
                </div>
              ) : (
                (selectedCategory.subCategories || []).map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500 mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Brand</label>
          <Input placeholder="Optional brand name" {...register("brand")} />
          {errors.brand && (
            <p className="text-sm text-red-500 mt-1">{errors.brand.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Unit <span className="text-red-500">*</span>
          </label>
          <Select
            onValueChange={(value) => setValue("unit", value as any)}
            value={watch("unit")}
            disabled={editMode} // Disable changing unit on edit to prevent complications with existing stock
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pcs">Pieces (pcs)</SelectItem>
              <SelectItem value="kg">Kilogram (kg)</SelectItem>
              <SelectItem value="g">Gram (g)</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="pallet">Pallet</SelectItem>
              <SelectItem value="liter">Liter</SelectItem>
              <SelectItem value="meter">Meter</SelectItem>
              <SelectItem value="carton">Carton</SelectItem>
              <SelectItem value="bag">Bag</SelectItem>
              <SelectItem value="bucket">Bucket</SelectItem>
            </SelectContent>
          </Select>
          {errors.unit && (
            <p className="text-sm text-red-500 mt-1">{errors.unit.message}</p>
          )}
        </div>

        <div>
          <SelectWarehouse
            value={getValues("warehouse")?.toString() || undefined}
            onChange={(value) => {
              setValue("warehouse", Number(value));
            }}
          />
          {errors.warehouse && (
            <p className="text-sm text-red-500 mt-1">
              {errors.warehouse.message}
            </p>
          )}
        </div>

        {!editMode && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Initial Quantity <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="0"
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="text-sm text-red-500 mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">
            Cost Price <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("costPrice", { valueAsNumber: true })}
          />
          {errors.costPrice && (
            <p className="text-sm text-red-500 mt-1">
              {errors.costPrice.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Selling Price <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("sellingPrice", { valueAsNumber: true })}
          />
          {errors.sellingPrice && (
            <p className="text-sm text-red-500 mt-1">
              {errors.sellingPrice.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Reorder Level <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="1"
            min="0"
            placeholder="0"
            {...register("reorderLevel", { valueAsNumber: true })}
          />
          {errors.reorderLevel && (
            <p className="text-sm text-red-500 mt-1">
              {errors.reorderLevel.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Status <span className="text-red-500">*</span>
          </label>
          <Select
            onValueChange={(value) => setValue("status", value as any)}
            value={watch("status")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-red-500 mt-1">{errors.status.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Barcode</label>
          <Input placeholder="Optional barcode" {...register("barcode")} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? editMode
              ? "Updating..."
              : "Creating..."
            : editMode
              ? "Update Item"
              : "Create Item"}
        </Button>
      </div>

      {/* Create Category Dialog */}
      <Dialog
        open={showCreateCategoryDialog}
        onOpenChange={setShowCreateCategoryDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Create a new category that can be used when creating items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Category Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Raw Materials"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !creatingCategory) {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateCategoryDialog(false);
                  setNewCategoryName("");
                }}
                disabled={creatingCategory}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
              >
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
