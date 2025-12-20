/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTable } from "@/components/datatable";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { STOCK_COLUMNS } from "@/lib/columns/inventory-columns";
import {
  getStockWithDetails,
  items,
  warehouses,
  searchItems,
  itemCategories,
} from "@/lib/inventory-data";
import { createItem, listCategories } from "@/service/inventoryService";
import type { ItemCategory } from "@/types/inventory";
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
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
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
import type { Item, Stock } from "@/types/inventory";
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
} from "@/components/ui/dialog";
import { format, differenceInDays, parseISO } from "date-fns";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Create Item Form Component
function CreateItemForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (item: Item) => void;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load categories from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingCategories(true);
        const cats = await listCategories();
        if (!cancelled) setCategories(cats);
      } catch (error: any) {
        console.error("Failed to load categories:", error);
        if (!cancelled) {
          toast.error("Failed to load categories. Using default options.");
        }
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      // Map form data to API format
      const payload = {
        sku: data.sku?.toUpperCase(),
        name: data.name,
        description: data.description,
        category: data.category,
        subCategory: data.subcategory,
        costPrice: data.costPrice || 0,
        sellingPrice: data.sellingPrice || 0,
        unitMeasure: data.unit || "pcs",
        reorderLevel: data.reorderLevel || 0,
        status: data.status || "active",
        barcode: data.barcode,
      };
      
      const createdItem = await createItem(payload);
      toast.success("Item created successfully!");
      onSuccess(createdItem);
    } catch (error: any) {
      console.error("Failed to create item:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create item. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            SKU <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="SKU-001"
            {...register("sku")}
          />
          {errors.sku && (
            <p className="text-sm text-red-500 mt-1">{errors.sku.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Item Name <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Item name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium mb-2 block">
            Description
          </label>
          <Input
            placeholder="Item description"
            {...register("description")}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Category <span className="text-red-500">*</span>
          </label>
          <Select
            onValueChange={(value) => setValue("category", value)}
            value={watch("category")}
            disabled={loadingCategories}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
            </SelectTrigger>
            <SelectContent>
              {loadingCategories ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No categories available. Please create a category first.
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
            <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
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
            <p className="text-sm text-red-500 mt-1">{errors.costPrice.message}</p>
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
            <p className="text-sm text-red-500 mt-1">{errors.sellingPrice.message}</p>
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
            <p className="text-sm text-red-500 mt-1">{errors.reorderLevel.message}</p>
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
          <label className="text-sm font-medium mb-2 block">
            Barcode
          </label>
          <Input
            placeholder="Optional barcode"
            {...register("barcode")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Item"}
        </Button>
      </div>
    </form>
  );
}

const ManageStocks = () => {
  const navigate = useNavigate();
  const [stockData, setStockData] = useState(getStockWithDetails());
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
      selectedWarehouse === "all" || stock.warehouseId === selectedWarehouse;
    const matchesSearch =
      searchQuery === "" ||
      stock.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWarehouse && matchesSearch;
  });

  // Search items for receiving
  useEffect(() => {
    if (itemSearchQuery.length > 0) {
      const results = searchItems(itemSearchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [itemSearchQuery]);

  // Search items for variance
  useEffect(() => {
    if (varianceItemSearchQuery.length > 0) {
      const results = searchItems(varianceItemSearchQuery);
      setVarianceSearchResults(results);
    } else {
      setVarianceSearchResults([]);
    }
  }, [varianceItemSearchQuery]);

  // Get current stock quantity for selected item and warehouse
  const getCurrentStock = (itemId: string, warehouseId: string): number => {
    const stock = stockData.find(
      (s) => s.itemId === itemId && s.warehouseId === warehouseId
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
      (s) => s.itemId === data.itemId && s.warehouseId === data.warehouseId
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
          warehouseId: data.warehouseId,
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
      (s) => s.itemId === data.itemId && s.warehouseId === data.warehouseId
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

  // Chart colors
  const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  // Inventory Values Calculations
  const calculateInventoryMetrics = () => {
    // Total valuation by warehouse
    const valuationByWarehouse = warehouses.map((wh) => {
      const stockInWarehouse = stockData.filter((s) => s.warehouseId === wh.id);
      const totalValue = stockInWarehouse.reduce(
        (sum, s) => sum + s.quantity * (s.item?.costPrice || 0),
        0
      );
      const totalQuantity = stockInWarehouse.reduce(
        (sum, s) => sum + s.quantity,
        0
      );
      return {
        warehouse: wh.name,
        value: totalValue,
        quantity: totalQuantity,
      };
    });

    // Valuation by category
    const valuationByCategory = itemCategories.map((cat: { name: string }) => {
      const stockInCategory = stockData.filter(
        (s) => s.item?.category === cat.name
      );
      const totalValue = stockInCategory.reduce(
        (sum: number, s: Stock & { item?: Item }) =>
          sum + s.quantity * (s.item?.costPrice || 0),
        0
      );
      return {
        category: cat.name,
        value: totalValue,
      };
    });

    // Ageing analysis (based on last updated date)
    const now = new Date();
    const ageingData = stockData.map((s) => {
      const lastUpdated = parseISO(s.lastUpdated);
      const daysOld = differenceInDays(now, lastUpdated);
      let ageGroup = "0-30 days";
      if (daysOld > 90) ageGroup = "90+ days";
      else if (daysOld > 60) ageGroup = "60-90 days";
      else if (daysOld > 30) ageGroup = "30-60 days";

      return {
        ...s,
        daysOld,
        ageGroup,
        value: s.quantity * (s.item?.costPrice || 0),
      };
    });

    const ageingSummary = [
      { range: "0-30 days", value: 0 },
      { range: "30-60 days", value: 0 },
      { range: "60-90 days", value: 0 },
      { range: "90+ days", value: 0 },
    ];

    ageingData.forEach((item) => {
      const group = ageingSummary.find((g) => g.range === item.ageGroup);
      if (group) {
        group.value += item.value;
      }
    });

    // Expiry tracking (items with expiry dates)
    const itemsWithExpiry = stockData.filter((s) => s.expiryDate);
    const expiryAnalysis = itemsWithExpiry
      .map((s) => {
        if (!s.expiryDate) return null;
        const expiry = parseISO(s.expiryDate);
        const daysUntilExpiry = differenceInDays(expiry, now);
        let status = "safe";
        if (daysUntilExpiry < 0) status = "expired";
        else if (daysUntilExpiry < 30) status = "expiring_soon";
        else if (daysUntilExpiry < 90) status = "warning";

        return {
          itemName: s.item?.name || "",
          expiryDate: s.expiryDate,
          daysUntilExpiry,
          status,
          quantity: s.quantity,
          value: s.quantity * (s.item?.costPrice || 0),
        };
      })
      .filter(Boolean);

    // Inventory turnover simulation (mock data for demo)
    // In real app, this would be calculated from sales history
    const turnoverByCategory = valuationByCategory.map(
      (cat: { category: string; value: number }) => ({
        category: cat.category,
        inventoryValue: cat.value,
        turnoverRatio: Math.random() * 12 + 1, // Mock: 1-13 turns per year
      })
    );

    // Top items by value
    const topItemsByValue = stockData
      .map((s) => ({
        name: s.item?.name || "",
        sku: s.item?.sku || "",
        quantity: s.quantity,
        unitCost: s.item?.costPrice || 0,
        totalValue: s.quantity * (s.item?.costPrice || 0),
        warehouse: s.warehouse?.name || "",
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    return {
      valuationByWarehouse,
      valuationByCategory,
      ageingSummary,
      expiryAnalysis,
      turnoverByCategory,
      topItemsByValue,
      totalInventoryValue: totalValue,
    };
  };

  const inventoryMetrics = calculateInventoryMetrics();

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
            <TabsList className="grid w-full grid-cols-4">
              <StyledTabsTrigger value="stock">
                Inventory Items (Stock)
              </StyledTabsTrigger>
              <StyledTabsTrigger value="receive">
                Receive Item
              </StyledTabsTrigger>
              <StyledTabsTrigger value="variances">Variances</StyledTabsTrigger>
              <StyledTabsTrigger value="values">
                Inventory Values
              </StyledTabsTrigger>
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
              <DataTable
                columns={STOCK_COLUMNS}
                data={filteredStock}
                onRowClick={(row) => {
                  navigate(`/inventory/stocks/${row.original.id}`);
                }}
              />
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
                      {itemSearchQuery.length > 0 && searchResults.length === 0 && (
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
                            onValueChange={(value) => setValue("referenceNo", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select PO number" />
                            </SelectTrigger>
                            <SelectContent>
                              {purchaseOrders
                                .filter((po) => po.status === "approved" || po.status === "ordered")
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
              <Dialog open={showCreateItemDialog} onOpenChange={setShowCreateItemDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Item</DialogTitle>
                  </DialogHeader>
                  <CreateItemForm
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

            {/* Inventory Values Tab */}
            <TabsContent value="values" className="space-y-6 mt-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Total Inventory Value
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          ₹{" "}
                          {inventoryMetrics.totalInventoryValue.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Avg Turnover Ratio
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {inventoryMetrics.turnoverByCategory.length > 0
                            ? (
                                inventoryMetrics.turnoverByCategory.reduce(
                                  (sum: number, c: { turnoverRatio: number }) =>
                                    sum + c.turnoverRatio,
                                  0
                                ) / inventoryMetrics.turnoverByCategory.length
                              ).toFixed(1)
                            : "0"}
                          x
                        </p>
                        <p className="text-xs text-gray-500 mt-1">per year</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Expiring Soon</p>
                        <p className="text-2xl font-bold mt-1 text-orange-600">
                          {
                            inventoryMetrics.expiryAnalysis.filter(
                              (e: any) => e?.status === "expiring_soon"
                            ).length
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">items</p>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Aged Stock (90+ days)
                        </p>
                        <p className="text-2xl font-bold mt-1 text-red-600">
                          ₹{" "}
                          {(
                            inventoryMetrics.ageingSummary.find(
                              (a: { range: string; value: number }) =>
                                a.range === "90+ days"
                            )?.value || 0
                          ).toLocaleString()}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Valuation by Warehouse */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Inventory Valuation by Warehouse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      value: {
                        label: "Inventory Value",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventoryMetrics.valuationByWarehouse}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="warehouse" />
                        <YAxis />
                        <Tooltip
                          content={<ChartTooltipContent />}
                          formatter={(value: number) =>
                            `₹ ${value.toLocaleString()}`
                          }
                        />
                        <Bar
                          dataKey="value"
                          fill="hsl(var(--chart-1))"
                          radius={6}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valuation by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Valuation by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={inventoryMetrics.valuationByCategory.reduce(
                        (
                          acc: Record<string, { label: string; color: string }>,
                          cat: { category: string },
                          idx: number
                        ) => {
                          acc[cat.category] = {
                            label: cat.category,
                            color: CHART_COLORS[idx % CHART_COLORS.length],
                          };
                          return acc;
                        },
                        {} as Record<string, { label: string; color: string }>
                      )}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={inventoryMetrics.valuationByCategory}
                            dataKey="value"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({
                              category,
                              value,
                            }: {
                              category: string;
                              value: number;
                            }) => `${category}: ₹${(value / 1000).toFixed(0)}k`}
                          >
                            {inventoryMetrics.valuationByCategory.map(
                              (
                                _: { category: string; value: number },
                                index: number
                              ) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    CHART_COLORS[index % CHART_COLORS.length]
                                  }
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) =>
                              `₹ ${value.toLocaleString()}`
                            }
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Ageing Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Stock Ageing Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        value: {
                          label: "Inventory Value",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={inventoryMetrics.ageingSummary}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip
                            content={<ChartTooltipContent />}
                            formatter={(value: number) =>
                              `₹ ${value.toLocaleString()}`
                            }
                          />
                          <Bar
                            dataKey="value"
                            fill="hsl(var(--chart-2))"
                            radius={6}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Turnover Ratio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Inventory Turnover Ratio by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      turnoverRatio: {
                        label: "Turnover Ratio",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventoryMetrics.turnoverByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip
                          content={<ChartTooltipContent />}
                          formatter={(value: number) =>
                            `${value.toFixed(1)}x per year`
                          }
                        />
                        <Bar
                          dataKey="turnoverRatio"
                          fill="hsl(var(--chart-3))"
                          radius={6}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Top Items by Value */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Top 10 Items by Inventory Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Item</th>
                          <th className="text-left p-3 font-medium">SKU</th>
                          <th className="text-right p-3 font-medium">
                            Quantity
                          </th>
                          <th className="text-right p-3 font-medium">
                            Unit Cost
                          </th>
                          <th className="text-right p-3 font-medium">
                            Total Value
                          </th>
                          <th className="text-left p-3 font-medium">
                            Warehouse
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryMetrics.topItemsByValue.map(
                          (
                            item: {
                              name: string;
                              sku: string;
                              quantity: number;
                              unitCost: number;
                              totalValue: number;
                              warehouse: string;
                            },
                            idx: number
                          ) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-3">{item.name}</td>
                              <td className="p-3 text-gray-600">{item.sku}</td>
                              <td className="p-3 text-right">
                                {item.quantity.toLocaleString()}
                              </td>
                              <td className="p-3 text-right">
                                ₹ {item.unitCost.toLocaleString()}
                              </td>
                              <td className="p-3 text-right font-semibold">
                                ₹ {item.totalValue.toLocaleString()}
                              </td>
                              <td className="p-3 text-gray-600">
                                {item.warehouse}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Expiry Analysis */}
              {inventoryMetrics.expiryAnalysis.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Expiry Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">Item</th>
                            <th className="text-left p-3 font-medium">
                              Expiry Date
                            </th>
                            <th className="text-right p-3 font-medium">
                              Days Until Expiry
                            </th>
                            <th className="text-right p-3 font-medium">
                              Quantity
                            </th>
                            <th className="text-right p-3 font-medium">
                              Value at Risk
                            </th>
                            <th className="text-left p-3 font-medium">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryMetrics.expiryAnalysis.map(
                            (item: any, idx: number) => (
                              <tr
                                key={idx}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-3">{item.itemName}</td>
                                <td className="p-3">
                                  {format(
                                    parseISO(item.expiryDate),
                                    "MMM dd, yyyy"
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  {item.daysUntilExpiry < 0
                                    ? `Expired ${Math.abs(
                                        item.daysUntilExpiry
                                      )} days ago`
                                    : `${item.daysUntilExpiry} days`}
                                </td>
                                <td className="p-3 text-right">
                                  {item.quantity}
                                </td>
                                <td className="p-3 text-right font-semibold">
                                  ₹ {item.value.toLocaleString()}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      item.status === "expired"
                                        ? "bg-red-100 text-red-800"
                                        : item.status === "expiring_soon"
                                        ? "bg-orange-100 text-orange-800"
                                        : item.status === "warning"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {item.status === "expired"
                                      ? "Expired"
                                      : item.status === "expiring_soon"
                                      ? "Expiring Soon"
                                      : item.status === "warning"
                                      ? "Warning"
                                      : "Safe"}
                                  </span>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageStocks;
