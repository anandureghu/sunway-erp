/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTable } from "@/components/datatable";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { STOCK_COLUMNS } from "@/lib/columns/inventory-columns";
import { getStockWithDetails } from "@/lib/inventory-data";
import {
  createItem,
  listCategories,
  createCategory,
  listItems,
  listWarehouses,
  listStock,
} from "@/service/inventoryService";
import type { ItemCategory, Item, Warehouse, Stock } from "@/types/inventory";
import { toast } from "sonner";
import { purchaseOrders } from "@/lib/purchase-data";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  TrendingUp,
  FileEdit,
  Save,
  X,
  Check,
} from "lucide-react";
import {
  RECEIVE_ITEM_SCHEMA,
  type ReceiveItemFormData,
  STOCK_ADJUSTMENT_SCHEMA,
  type StockAdjustmentFormData,
  ITEM_SCHEMA,
  type ItemFormData,
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
import { format } from "date-fns";

// Create Item Form Component
function CreateItemForm({
  onSuccess,
  onCancel,
  warehouses,
}: {
  onSuccess: (item: Item) => void;
  onCancel: () => void;
  warehouses: Warehouse[];
}) {
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
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
            }`
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
          "Failed to create category. Please try again."
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
  } = useForm<ItemFormData>({
    resolver: zodResolver(ITEM_SCHEMA),
    defaultValues: {
      status: "active",
      unit: "pcs",
      costPrice: 0,
      sellingPrice: 0,
      reorderLevel: 0,
    },
  });

  const onSubmit = async (data: ItemFormData) => {
    try {
      setSubmitting(true);

      const formData = new FormData();

      // JSON payload
      const payload = {
        sku: data.sku?.toUpperCase(),
        name: data.name,
        description: data.description,
        type: data.itemType,
        category: data.category,
        subCategory: data.subcategory,
        brand: data.brand,
        warehouse: data.warehouse,
        quantity: data.quantity || 0,
        costPrice: data.costPrice || 0,
        sellingPrice: data.sellingPrice || 0,
        unitMeasure: data.unit || "pcs",
        reorderLevel: data.reorderLevel || 0,
        status: data.status || "active",
        barcode: data.barcode,
      };

      formData.append(
        "data",
        new Blob([JSON.stringify(payload)], {
          type: "application/json",
        })
      );

      if (data.image) {
        formData.append("image", data.image);
      }

      const createdItem = await createItem(formData);

      toast.success("Item created successfully!");
      onSuccess(createdItem);
    } catch (error: any) {
      console.error("Failed to create item:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to create item. Please try again."
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
          <Input placeholder="SKU-001" {...register("sku")} />
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
            onValueChange={(value) => setValue("category", value)}
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

        <div>
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
          <label className="text-sm font-medium mb-2 block">
            Warehouse <span className="text-red-500">*</span>
          </label>
          <Select
            onValueChange={(value) => setValue("warehouse", Number(value))}
            {...register("warehouse")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses
                .filter((w) => w.status === "active")
                .map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} - {warehouse.location}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.warehouse && (
            <p className="text-sm text-red-500 mt-1">
              {errors.warehouse.message}
            </p>
          )}
        </div>

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
          {submitting ? "Creating..." : "Create Item"}
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

const ManageStocks = () => {
  const navigate = useNavigate();
  const [stockData, setStockData] = useState<
    (Stock & { item: Item; warehouse: Warehouse })[]
  >([]);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  // Receive Item Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ReceiveItemFormData>({
    resolver: zodResolver(RECEIVE_ITEM_SCHEMA),
    defaultValues: {
      receivedDate: format(new Date(), "yyyy-MM-dd"),
      quantityReceived: 0,
    },
  });

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [showCreateItemDialog, setShowCreateItemDialog] = useState(false);
  const selectedWarehouseId = watch("warehouseId");

  // Variance/Adjustment Form
  const {
    register: registerVariance,
    handleSubmit: handleVarianceSubmit,
    formState: { errors: varianceErrors },
    reset: resetVariance,
    watch: watchVariance,
    setValue: setVarianceValue,
  } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(STOCK_ADJUSTMENT_SCHEMA),
    defaultValues: {
      adjustmentDate: format(new Date(), "yyyy-MM-dd"),
      adjustmentQuantity: 0,
      adjustmentType: "other",
    },
  });

  const [varianceItem, setVarianceItem] = useState<Item | null>(null);
  const [varianceItemSearchQuery, setVarianceItemSearchQuery] = useState("");
  const [varianceSearchResults, setVarianceSearchResults] = useState<Item[]>(
    []
  );
  const varianceWarehouseId = watchVariance("warehouseId");
  const adjustmentQuantity = watchVariance("adjustmentQuantity");
  const [isAdjustingByQuantity, setIsAdjustingByQuantity] = useState(true); // true = adjust by quantity, false = set new quantity

  // Filter stock data
  const filteredStock = stockData.filter((stock) => {
    const matchesWarehouse =
      selectedWarehouse === "all" ||
      String(stock.warehouse_id) === selectedWarehouse;
    const matchesSearch =
      searchQuery === "" ||
      stock.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWarehouse && matchesSearch;
  });

  console.log(filteredStock);

  // Load stock data from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // Fetch all data in parallel
        const [stockList, itemsList, warehousesList] = await Promise.all([
          listStock(),
          listItems(),
          listWarehouses(),
          listCategories(),
        ]);

        if (!cancelled) {
          setItems(itemsList);
          setWarehouses(warehousesList);

          console.log(stockList);

          // Enrich stock with item and warehouse details
          const enrichedStock = stockList
            .map((stock) => {
              const item = itemsList.find((i) => i.id === stock.itemId);
              const warehouse = warehousesList.find(
                (w) => w.id === String(stock.warehouse_id)
              );

              // if (!item || !warehouse) return null;

              return {
                ...stock,
                item: item || null,
                warehouse: warehouse || null,
              };
            })
            .filter(
              (s): s is Stock & { item: Item; warehouse: Warehouse } =>
                s !== null
            );

          setStockData(enrichedStock);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Failed to load stock data:", error);
          setLoadError(error?.message || "Failed to load inventory data");
          // Fallback to mock data if API fails
          setStockData(getStockWithDetails());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Search items for receiving (using API items)
  useEffect(() => {
    if (itemSearchQuery.length > 0) {
      const lowerQuery = itemSearchQuery.toLowerCase();
      const results = items.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.sku.toLowerCase().includes(lowerQuery) ||
          item.barcode?.toLowerCase().includes(lowerQuery)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [itemSearchQuery, items]);

  // Search items for variance (using API items)
  useEffect(() => {
    if (varianceItemSearchQuery.length > 0) {
      const lowerQuery = varianceItemSearchQuery.toLowerCase();
      const results = items.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.sku.toLowerCase().includes(lowerQuery) ||
          item.barcode?.toLowerCase().includes(lowerQuery)
      );
      setVarianceSearchResults(results);
    } else {
      setVarianceSearchResults([]);
    }
  }, [varianceItemSearchQuery, items]);

  // Get current stock quantity for selected item and warehouse
  const getCurrentStock = (itemId: string, warehouseId: string): number => {
    const stock = stockData.find(
      (s) => s.itemId === itemId && String(s.warehouse_id) === warehouseId
    );
    return stock?.quantity || 0;
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    setValue("itemId", item.id);
    setItemSearchQuery(item.name);
    setSearchResults([]);
  };

  const handleVarianceItemSelect = (item: Item) => {
    setVarianceItem(item);
    setVarianceValue("itemId", item.id);
    setVarianceItemSearchQuery(item.name);
    setVarianceSearchResults([]);
  };

  const onReceiveItem = (data: ReceiveItemFormData) => {
    // In a real app, this would make an API call
    console.log("Receiving item:", data);

    // Update stock (mock update)
    const existingStockIndex = stockData.findIndex(
      (s) =>
        s.itemId === data.itemId &&
        s.warehouse_id?.toString() === data.warehouseId
    );

    if (existingStockIndex >= 0) {
      // Update existing stock
      const updatedStock = [...stockData];
      updatedStock[existingStockIndex] = {
        ...updatedStock[existingStockIndex],
        quantity:
          updatedStock[existingStockIndex].quantity + data.quantityReceived,
        availableQuantity:
          updatedStock[existingStockIndex].availableQuantity +
          data.quantityReceived,
        lastUpdated: new Date().toISOString(),
        batchNo: data.batchNo || updatedStock[existingStockIndex].batchNo,
        dateReceived: data.receivedDate,
      };
      setStockData(updatedStock);
    } else {
      // Create new stock entry
      const item = items.find((i) => i.id === data.itemId);
      const warehouse = warehouses.find((w) => w.id === data.warehouseId);
      if (item && warehouse) {
        const newStock: Stock & { item: Item; warehouse: typeof warehouse } = {
          id: `stock-${Date.now()}`,
          itemId: data.itemId,
          quantity: data.quantityReceived,
          availableQuantity: data.quantityReceived,
          reservedQuantity: 0,
          batchNo: data.batchNo,
          serialNo: data.serialNo,
          dateReceived: data.receivedDate,
          lastUpdated: new Date().toISOString(),
          item,
          warehouse,
        };
        setStockData([...stockData, newStock]);
      }
    }

    // Reset form
    reset();
    setSelectedItem(null);
    setItemSearchQuery("");
  };

  // Variance adjustment handlers
  const onAdjustStock = (data: StockAdjustmentFormData) => {
    console.log("Adjusting stock:", data);

    // Find existing stock
    const existingStockIndex = stockData.findIndex(
      (s) =>
        s.itemId === data.itemId &&
        s.warehouse_id?.toString() === data.warehouseId
    );

    if (existingStockIndex >= 0) {
      const currentStock = stockData[existingStockIndex];
      let newQuantity: number;

      if (isAdjustingByQuantity) {
        // Adjust by quantity (add or subtract)
        newQuantity = currentStock.quantity + data.adjustmentQuantity;
      } else {
        // Set to new quantity
        newQuantity = data.newQuantity || currentStock.quantity;
        data.adjustmentQuantity = newQuantity - currentStock.quantity;
      }

      if (newQuantity < 0) {
        alert(
          "Adjustment would result in negative stock. Please check the quantity."
        );
        return;
      }

      // Update stock
      const updatedStock = [...stockData];
      updatedStock[existingStockIndex] = {
        ...updatedStock[existingStockIndex],
        quantity: newQuantity,
        availableQuantity:
          newQuantity -
          (updatedStock[existingStockIndex].reservedQuantity || 0),
        lastUpdated: new Date().toISOString(),
      };
      setStockData(updatedStock);
    } else {
      alert("Stock not found for this item and warehouse combination.");
      return;
    }

    // Reset form
    resetVariance();
    setVarianceItem(null);
    setVarianceItemSearchQuery("");
    setIsAdjustingByQuantity(true);
  };

  const handleNewVariance = () => {
    resetVariance();
    setVarianceItem(null);
    setVarianceItemSearchQuery("");
    setIsAdjustingByQuantity(true);
    setVarianceValue("adjustmentDate", format(new Date(), "yyyy-MM-dd"));
  };

  const handleCancelVariance = () => {
    resetVariance();
    setVarianceItem(null);
    setVarianceItemSearchQuery("");
    setIsAdjustingByQuantity(true);
  };

  // Calculate stats
  const totalItems = stockData.length;
  const lowStockItems = stockData.filter(
    (s) => s.quantity <= (s.item?.reorderLevel || 0)
  ).length;
  const totalValue = stockData.reduce(
    (sum, s) => sum + s.quantity * (s.item?.costPrice || 0),
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manage Inventory</h1>
          <p className="text-gray-600 text-sm mt-1">
            Track and control your inventory
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold mt-1">{totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {lowStockItems}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold mt-1">
                  ₹ {totalValue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warehouses</p>
                <p className="text-2xl font-bold mt-1">{warehouses.length}</p>
              </div>
              <WarehouseIcon className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="stock" className="w-full">
            <TabsList className="w-full">
              <StyledTabsTrigger value="stock">
                Inventory Items (Stock)
              </StyledTabsTrigger>
              <StyledTabsTrigger value="receive">
                Receive Item
              </StyledTabsTrigger>
              <StyledTabsTrigger value="variances">Variances</StyledTabsTrigger>
            </TabsList>

            {/* Inventory Items (Stock) Tab */}
            <TabsContent value="stock" className="space-y-4 mt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by SKU, name, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedWarehouse}
                  onValueChange={setSelectedWarehouse}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">
                  Loading inventory data...
                </div>
              ) : loadError ? (
                <div className="py-10 text-center text-red-600">
                  {loadError}
                </div>
              ) : filteredStock.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  {searchQuery || selectedWarehouse !== "all"
                    ? "No inventory items found matching your filters."
                    : "No inventory items found. Add items to get started."}
                </div>
              ) : (
                <DataTable
                  columns={STOCK_COLUMNS}
                  data={filteredStock}
                  onRowClick={(row) => {
                    navigate(`/inventory/stocks/${row.original.id}`);
                  }}
                />
              )}
            </TabsContent>

            {/* Receive Item Tab */}
            <TabsContent value="receive" className="space-y-6 mt-6">
              <form
                onSubmit={handleSubmit(onReceiveItem)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-orange-500" />
                      Receive Item
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Item Search */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">
                          Item Code / SKU / Barcode
                        </label>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => setShowCreateItemDialog(true)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4" />
                          Add New Item
                        </Button>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by SKU, name, or barcode..."
                          value={itemSearchQuery}
                          onChange={(e) => setItemSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {itemSearchQuery.length > 0 &&
                        searchResults.length === 0 && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                              No items found.{" "}
                              <button
                                type="button"
                                onClick={() => setShowCreateItemDialog(true)}
                                className="font-semibold underline hover:text-blue-900"
                              >
                                Click here to create a new item
                              </button>
                            </p>
                          </div>
                        )}
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          {searchResults.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleItemSelect(item)}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                SKU: {item.sku} | {item.category}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <input type="hidden" {...register("itemId")} />
                      {errors.itemId && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.itemId.message}
                        </p>
                      )}
                    </div>

                    {selectedItem && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Field 1: Item Description */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Item Description
                          </label>
                          <Input
                            value={
                              selectedItem.description || selectedItem.name
                            }
                            disabled
                          />
                        </div>

                        {/* Field 2: Location/ warehouse */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Location/ warehouse
                          </label>
                          <Select
                            onValueChange={(value) => {
                              setValue("warehouseId", value, {
                                shouldValidate: true,
                              });
                            }}
                            value={selectedWarehouseId || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map((wh) => (
                                <SelectItem key={wh.id} value={wh.id}>
                                  {wh.name} - {wh.location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.warehouseId && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.warehouseId.message}
                            </p>
                          )}
                        </div>

                        {/* Field 3: Quantity on Hand */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Quantity on Hand
                          </label>
                          <Input
                            value={
                              selectedWarehouseId && selectedItem
                                ? `${getCurrentStock(
                                    selectedItem.id,
                                    selectedWarehouseId
                                  )} ${selectedItem.unit}`
                                : "-"
                            }
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        {/* Field 4: Product Status */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Product Status
                          </label>
                          <Input
                            value={selectedItem.status}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        {/* Field 5: Received Date */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Received Date
                          </label>
                          <Input type="date" {...register("receivedDate")} />
                          {errors.receivedDate && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.receivedDate.message}
                            </p>
                          )}
                        </div>

                        {/* Field 6: Batch No. */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Batch No.
                          </label>
                          <Input
                            placeholder="Batch number"
                            {...register("batchNo")}
                          />
                        </div>

                        {/* Field 7: Serial No. */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Serial No.
                          </label>
                          <Input
                            placeholder="Serial number"
                            {...register("serialNo")}
                          />
                        </div>

                        {/* Field 8: Reference No. */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Reference No.
                          </label>
                          <Select
                            value={watch("referenceNo") || ""}
                            onValueChange={(value) =>
                              setValue("referenceNo", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select PO number" />
                            </SelectTrigger>
                            <SelectContent>
                              {purchaseOrders
                                .filter(
                                  (po) =>
                                    po.status === "approved" ||
                                    po.status === "ordered"
                                )
                                .map((po) => (
                                  <SelectItem key={po.id} value={po.orderNo}>
                                    {po.orderNo}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Field 9: Quantity Received */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Quantity Received
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter quantity"
                            {...register("quantityReceived", {
                              valueAsNumber: true,
                            })}
                          />
                          {errors.quantityReceived && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.quantityReceived.message}
                            </p>
                          )}
                          {selectedItem && (
                            <p className="text-sm text-gray-600 mt-2">
                              Unit: {selectedItem.unit}
                            </p>
                          )}
                        </div>

                        {/* Field 10: Cost price */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Cost price
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter cost price"
                            {...register("costPrice", { valueAsNumber: true })}
                          />
                          {errors.costPrice && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.costPrice.message}
                            </p>
                          )}
                        </div>

                        {/* Field 11: Unit Price */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Unit Price
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter unit price"
                            {...register("unitPrice", { valueAsNumber: true })}
                          />
                          {errors.unitPrice && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.unitPrice.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          reset();
                          setSelectedItem(null);
                          setItemSearchQuery("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Receive Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>

              {/* Create New Item Dialog */}
              <Dialog
                open={showCreateItemDialog}
                onOpenChange={setShowCreateItemDialog}
              >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Item</DialogTitle>
                    <DialogDescription>
                      Add a new inventory item with all required details.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateItemForm
                    warehouses={warehouses}
                    onSuccess={(newItem) => {
                      // Item is already saved to API via createItem()
                      // Select the newly created item
                      handleItemSelect(newItem);
                      setShowCreateItemDialog(false);
                      // Clear search query
                      setItemSearchQuery("");
                    }}
                    onCancel={() => setShowCreateItemDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Variances Tab */}
            <TabsContent value="variances" className="space-y-6 mt-6">
              <form
                onSubmit={handleVarianceSubmit(onAdjustStock)}
                className="space-y-6"
              >
                {/* Item Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Item Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <label className="text-sm font-medium mb-2 block">
                        Item Code / SKU / Barcode
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by SKU, name, or barcode..."
                          value={varianceItemSearchQuery}
                          onChange={(e) =>
                            setVarianceItemSearchQuery(e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                      {varianceSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          {varianceSearchResults.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleVarianceItemSelect(item)}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                SKU: {item.sku} | {item.category}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <input type="hidden" {...registerVariance("itemId")} />
                      {varianceErrors.itemId && (
                        <p className="text-sm text-red-500 mt-1">
                          {varianceErrors.itemId.message}
                        </p>
                      )}
                    </div>

                    {varianceItem && (
                      <>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Product Name
                          </label>
                          <Input value={varianceItem.name} disabled />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Location / Warehouse
                          </label>
                          <Select
                            onValueChange={(value) => {
                              setVarianceValue("warehouseId", value, {
                                shouldValidate: true,
                              });
                            }}
                            value={varianceWarehouseId || undefined}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map((wh) => (
                                <SelectItem key={wh.id} value={wh.id}>
                                  {wh.name} - {wh.location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {varianceErrors.warehouseId && (
                            <p className="text-sm text-red-500 mt-1">
                              {varianceErrors.warehouseId.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Product Status
                          </label>
                          <Input value={varianceItem.status} disabled />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Adjust Quantity Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileEdit className="h-5 w-5" />
                      Adjust Quantity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Variance Type
                        </label>
                        <Select
                          onValueChange={(value) => {
                            setVarianceValue("adjustmentType", value as any);
                          }}
                          value={watchVariance("adjustmentType")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select variance type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="wastage">Wastage</SelectItem>
                            <SelectItem value="found">Found</SelectItem>
                            <SelectItem value="theft">Theft</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {varianceErrors.adjustmentType && (
                          <p className="text-sm text-red-500 mt-1">
                            {varianceErrors.adjustmentType.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Variance Reason
                        </label>
                        <Input
                          placeholder="Enter reason for adjustment"
                          {...registerVariance("reason")}
                        />
                        {varianceErrors.reason && (
                          <p className="text-sm text-red-500 mt-1">
                            {varianceErrors.reason.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {varianceItem && varianceWarehouseId && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Quantity on Hand
                        </label>
                        <Input
                          value={
                            getCurrentStock(
                              varianceItem.id,
                              varianceWarehouseId
                            ).toLocaleString() +
                            " " +
                            varianceItem.unit
                          }
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <label className="text-sm font-medium">
                          Adjustment Method:
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={isAdjustingByQuantity}
                              onChange={() => setIsAdjustingByQuantity(true)}
                              className="cursor-pointer"
                            />
                            <span className="text-sm">Adjust by Quantity</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={!isAdjustingByQuantity}
                              onChange={() => setIsAdjustingByQuantity(false)}
                              className="cursor-pointer"
                            />
                            <span className="text-sm">Set New Quantity</span>
                          </label>
                        </div>
                      </div>

                      {isAdjustingByQuantity ? (
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Adjustment Quantity
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter adjustment (use negative for decrease)"
                            {...registerVariance("adjustmentQuantity", {
                              valueAsNumber: true,
                            })}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Use positive numbers to increase, negative to
                            decrease
                          </p>
                          {varianceItem &&
                            varianceWarehouseId &&
                            adjustmentQuantity !== undefined && (
                              <p className="text-sm text-blue-600 mt-2">
                                New Quantity:{" "}
                                {getCurrentStock(
                                  varianceItem.id,
                                  varianceWarehouseId
                                ) + (adjustmentQuantity || 0)}{" "}
                                {varianceItem.unit}
                              </p>
                            )}
                        </div>
                      ) : (
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            New Quantity
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter new quantity"
                            {...registerVariance("newQuantity", {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                      )}
                      {varianceErrors.adjustmentQuantity && (
                        <p className="text-sm text-red-500 mt-1">
                          {varianceErrors.adjustmentQuantity.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Adjustment Date
                      </label>
                      <Input
                        type="date"
                        {...registerVariance("adjustmentDate")}
                      />
                      {varianceErrors.adjustmentDate && (
                        <p className="text-sm text-red-500 mt-1">
                          {varianceErrors.adjustmentDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Notes (Optional)
                      </label>
                      <Input
                        placeholder="Additional notes about the adjustment"
                        {...registerVariance("notes")}
                      />
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleNewVariance}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4 text-green-600" />
                        New Variance
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelVariance}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4 text-red-600" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        type="submit"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                        Commit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageStocks;
