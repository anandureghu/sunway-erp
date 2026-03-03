import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Download,
  BarChart3,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  format,
  differenceInDays,
  parseISO,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ChartContainer } from "@/components/ui/chart";
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
  LineChart,
  Line,
} from "recharts";
import {
  getStockWithDetails,
  items,
  warehouses,
  itemCategories,
} from "@/lib/inventory-data";
import { salesOrders } from "@/lib/sales-data";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function InventoryReportsPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const stockData = useMemo(() => getStockWithDetails(), []);
  const now = new Date();

  // Filter stock by warehouse
  const filteredStock = useMemo(() => {
    if (selectedWarehouse === "all") return stockData;
    return stockData.filter(
      (s) => s.warehouse_id?.toString() === selectedWarehouse,
    );
  }, [stockData, selectedWarehouse]);

  // 1. STOCK VALUATION REPORTS
  const stockValuation = useMemo(() => {
    // Total valuation
    const totalValue = filteredStock.reduce(
      (sum, s) => sum + s.quantity * (s.item?.costPrice || 0),
      0,
    );

    // Valuation by warehouse
    const valuationByWarehouse = warehouses.map((wh) => {
      const stockInWarehouse = filteredStock.filter(
        (s) => s.warehouse_id?.toString() === wh.id,
      );
      const value = stockInWarehouse.reduce(
        (sum, s) => sum + s.quantity * (s.item?.costPrice || 0),
        0,
      );
      const quantity = stockInWarehouse.reduce((sum, s) => sum + s.quantity, 0);
      return { warehouse: wh.name, value, quantity };
    });

    // Valuation by category
    const valuationByCategory = itemCategories.map((cat) => {
      const stockInCategory = filteredStock.filter(
        (s) => s.item?.category === cat.name,
      );
      const value = stockInCategory.reduce(
        (sum, s) => sum + s.quantity * (s.item?.costPrice || 0),
        0,
      );
      return { category: cat.name, value };
    });

    // Top items by value
    const topItemsByValue = filteredStock
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
      totalValue,
      valuationByWarehouse,
      valuationByCategory,
      topItemsByValue,
    };
  }, [filteredStock]);

  // 2. INVENTORY TURNOVER RATIO
  const inventoryTurnover = useMemo(() => {
    // Calculate COGS (Cost of Goods Sold) from sales orders in date range
    const dateFrom = parseISO(dateRange.from);
    const dateTo = parseISO(dateRange.to);

    const salesInRange = salesOrders.filter((so) => {
      const orderDate = parseISO(so.orderDate);
      return orderDate >= dateFrom && orderDate <= dateTo;
    });

    // Calculate COGS from sales order items
    let totalCOGS = 0;
    salesInRange.forEach((order) => {
      order.items.forEach((item) => {
        const itemData = items.find((i) => i.id === item.itemId);
        if (itemData) {
          totalCOGS += item.quantity * itemData.costPrice;
        }
      });
    });

    // Average inventory value (beginning + ending) / 2
    const avgInventoryValue = stockValuation.totalValue;

    // Turnover ratio = COGS / Average Inventory
    const turnoverRatio =
      avgInventoryValue > 0 ? totalCOGS / avgInventoryValue : 0;
    const daysToSell = turnoverRatio > 0 ? 365 / turnoverRatio : 0;

    // Turnover by category
    const turnoverByCategory = stockValuation.valuationByCategory.map((cat) => {
      const categoryCOGS = salesInRange.reduce((sum, order) => {
        const categoryItems = order.items.filter((item) => {
          const itemData = items.find((i) => i.id === item.itemId);
          return itemData?.category === cat.category;
        });
        return (
          sum +
          categoryItems.reduce((itemSum, item) => {
            const itemData = items.find((i) => i.id === item.itemId);
            return itemSum + item.quantity * (itemData?.costPrice || 0);
          }, 0)
        );
      }, 0);

      const categoryTurnover = cat.value > 0 ? categoryCOGS / cat.value : 0;
      return {
        category: cat.category,
        turnoverRatio: categoryTurnover,
        daysToSell: categoryTurnover > 0 ? 365 / categoryTurnover : 0,
        inventoryValue: cat.value,
        cogs: categoryCOGS,
      };
    });

    return {
      totalCOGS,
      avgInventoryValue,
      turnoverRatio,
      daysToSell,
      turnoverByCategory,
      salesCount: salesInRange.length,
    };
  }, [dateRange, stockValuation]);

  // 3. AGEING AND EXPIRY REPORTS
  const ageingAndExpiry = useMemo(() => {
    // Ageing analysis (based on last updated date)
    const ageingData = filteredStock.map((s) => {
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
      { range: "0-30 days", value: 0, quantity: 0, items: 0 },
      { range: "30-60 days", value: 0, quantity: 0, items: 0 },
      { range: "60-90 days", value: 0, quantity: 0, items: 0 },
      { range: "90+ days", value: 0, quantity: 0, items: 0 },
    ];

    ageingData.forEach((item) => {
      const group = ageingSummary.find((g) => g.range === item.ageGroup);
      if (group) {
        group.value += item.value;
        group.quantity += item.quantity;
        group.items += 1;
      }
    });

    // Expiry tracking
    const itemsWithExpiry = filteredStock.filter((s) => s.expiryDate);
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
          sku: s.item?.sku || "",
          expiryDate: s.expiryDate,
          daysUntilExpiry,
          status,
          quantity: s.quantity,
          value: s.quantity * (s.item?.costPrice || 0),
          warehouse: s.warehouse?.name || "",
        };
      })
      .filter(Boolean) as Array<{
      itemName: string;
      sku: string;
      expiryDate: string;
      daysUntilExpiry: number;
      status: string;
      quantity: number;
      value: number;
      warehouse: string;
    }>;

    const expiredItems = expiryAnalysis.filter(
      (item) => item.status === "expired",
    );
    const expiringSoon = expiryAnalysis.filter(
      (item) => item.status === "expiring_soon",
    );
    const warningItems = expiryAnalysis.filter(
      (item) => item.status === "warning",
    );

    return {
      ageingSummary,
      ageingData,
      expiryAnalysis,
      expiredItems,
      expiringSoon,
      warningItems,
    };
  }, [filteredStock, now]);

  // 4. CUSTOM DASHBOARDS AND KPIs
  const kpis = useMemo(() => {
    const totalItems = filteredStock.length;
    const lowStockItems = filteredStock.filter(
      (s) => s.item && s.quantity <= (s.item.reorderLevel || 0),
    ).length;
    const outOfStockItems = filteredStock.filter(
      (s) => s.quantity === 0,
    ).length;
    const totalValue = stockValuation.totalValue;
    const totalQuantity = filteredStock.reduce((sum, s) => sum + s.quantity, 0);

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      totalQuantity,
      avgItemValue: totalItems > 0 ? totalValue / totalItems : 0,
    };
  }, [filteredStock, stockValuation]);

  // Export functions (placeholder)
  const handleExportPDF = () => {
    alert("PDF export functionality will be implemented");
  };

  const handleExportExcel = () => {
    alert("Excel export functionality will be implemented");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/stocks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Inventory Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              Comprehensive inventory analysis and insights
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Warehouse
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                <option value="all">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Date From
              </label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange({ ...dateRange, from: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date To</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange({ ...dateRange, to: e.target.value })
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDateRange({
                    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                    to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
                  });
                }}
              >
                Reset to Current Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Inventory Value
                </p>
                <p className="text-2xl font-bold mt-1">
                  ₹{kpis.totalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold mt-1">{kpis.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">
                  {kpis.lowStockItems}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turnover Ratio</p>
                <p className="text-2xl font-bold mt-1">
                  {inventoryTurnover.turnoverRatio.toFixed(2)}x
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {inventoryTurnover.daysToSell.toFixed(0)} days to sell
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports Tabs */}
      <Tabs defaultValue="valuation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <StyledTabsTrigger value="valuation">
            <DollarSign className="mr-2 h-4 w-4" />
            Stock Valuation
          </StyledTabsTrigger>
          <StyledTabsTrigger value="turnover">
            <TrendingUp className="mr-2 h-4 w-4" />
            Turnover Ratio
          </StyledTabsTrigger>
          <StyledTabsTrigger value="ageing">
            <Clock className="mr-2 h-4 w-4" />
            Ageing & Expiry
          </StyledTabsTrigger>
          <StyledTabsTrigger value="dashboard">
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </StyledTabsTrigger>
        </TabsList>

        {/* Stock Valuation Tab */}
        <TabsContent value="valuation" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Valuation by Warehouse</CardTitle>
                <CardDescription>
                  Total inventory value by location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Value (₹)", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockValuation.valuationByWarehouse}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="warehouse" />
                      <YAxis />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Value
                                    </span>
                                    <span className="font-bold">
                                      ₹{payload[0].value?.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
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

            <Card>
              <CardHeader>
                <CardTitle>Valuation by Category</CardTitle>
                <CardDescription>
                  Inventory value distribution by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Value (₹)", color: "hsl(var(--chart-2))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={stockValuation.valuationByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) =>
                          `${category}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stockValuation.valuationByCategory.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <p className="font-medium">
                                  {payload[0].payload.category}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  ₹{payload[0].value?.toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Items by Value</CardTitle>
              <CardDescription>
                Highest value items in inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Item Name</th>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-right p-2">Unit Cost</th>
                      <th className="text-right p-2">Total Value</th>
                      <th className="text-left p-2">Warehouse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockValuation.topItemsByValue.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {item.sku}
                        </td>
                        <td className="p-2 text-right">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          ₹{item.unitCost.toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          ₹{item.totalValue.toLocaleString()}
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {item.warehouse}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Turnover Tab */}
        <TabsContent value="turnover" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Turnover Overview</CardTitle>
                <CardDescription>
                  Inventory turnover metrics for selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-medium">Cost of Goods Sold (COGS)</span>
                  <span className="text-2xl font-bold">
                    ₹{inventoryTurnover.totalCOGS.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-medium">Average Inventory Value</span>
                  <span className="text-2xl font-bold">
                    ₹{inventoryTurnover.avgInventoryValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="font-medium">Turnover Ratio</span>
                  <span className="text-3xl font-bold text-blue-600">
                    {inventoryTurnover.turnoverRatio.toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-medium">Days to Sell</span>
                  <span className="text-2xl font-bold">
                    {inventoryTurnover.daysToSell.toFixed(0)} days
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-medium">Sales Orders (Period)</span>
                  <span className="text-2xl font-bold">
                    {inventoryTurnover.salesCount}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Turnover by Category</CardTitle>
                <CardDescription>
                  Category-wise inventory turnover analysis
                </CardDescription>
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
                    <BarChart data={inventoryTurnover.turnoverByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <p className="font-medium">{data.category}</p>
                                <p className="text-sm">
                                  Turnover: {data.turnoverRatio.toFixed(2)}x
                                </p>
                                <p className="text-sm">
                                  Days to Sell: {data.daysToSell.toFixed(0)}
                                </p>
                                <p className="text-sm">
                                  COGS: ₹{data.cogs.toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Turnover Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Category</th>
                      <th className="text-right p-2">Inventory Value</th>
                      <th className="text-right p-2">COGS</th>
                      <th className="text-right p-2">Turnover Ratio</th>
                      <th className="text-right p-2">Days to Sell</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryTurnover.turnoverByCategory.map((cat, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 font-medium">{cat.category}</td>
                        <td className="p-2 text-right">
                          ₹{cat.inventoryValue.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          ₹{cat.cogs.toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {cat.turnoverRatio.toFixed(2)}x
                        </td>
                        <td className="p-2 text-right">
                          {cat.daysToSell.toFixed(0)} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ageing & Expiry Tab */}
        <TabsContent value="ageing" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Ageing Analysis</CardTitle>
                <CardDescription>Stock value by age groups</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Value (₹)", color: "hsl(var(--chart-4))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageingAndExpiry.ageingSummary}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <p className="font-medium">{data.range}</p>
                                <p className="text-sm">
                                  Value: ₹{data.value.toLocaleString()}
                                </p>
                                <p className="text-sm">
                                  Quantity: {data.quantity.toLocaleString()}
                                </p>
                                <p className="text-sm">Items: {data.items}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--chart-4))"
                        radius={6}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expiry Status Summary</CardTitle>
                <CardDescription>Items by expiry status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-red-900">Expired Items</p>
                      <p className="text-sm text-red-700">
                        {ageingAndExpiry.expiredItems.length} items
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-red-600">
                      ₹
                      {ageingAndExpiry.expiredItems
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-orange-900">
                        Expiring Soon (&lt;30 days)
                      </p>
                      <p className="text-sm text-orange-700">
                        {ageingAndExpiry.expiringSoon.length} items
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-orange-600">
                      ₹
                      {ageingAndExpiry.expiringSoon
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium text-yellow-900">
                        Warning (30-90 days)
                      </p>
                      <p className="text-sm text-yellow-700">
                        {ageingAndExpiry.warningItems.length} items
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">
                      ₹
                      {ageingAndExpiry.warningItems
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium text-green-900">
                        Safe (&gt;90 days)
                      </p>
                      <p className="text-sm text-green-700">
                        {
                          ageingAndExpiry.expiryAnalysis.filter(
                            (item) => item.status === "safe",
                          ).length
                        }{" "}
                        items
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      ₹
                      {ageingAndExpiry.expiryAnalysis
                        .filter((item) => item.status === "safe")
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expiring Items Details</CardTitle>
              <CardDescription>Items expiring within 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Item Name</th>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Expiry Date</th>
                      <th className="text-right p-2">Days Until Expiry</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-right p-2">Value</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ageingAndExpiry.expiryAnalysis
                      .filter((item) => item.daysUntilExpiry <= 90)
                      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
                      .map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2 font-medium">{item.itemName}</td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {item.sku}
                          </td>
                          <td className="p-2">
                            {format(parseISO(item.expiryDate), "MMM dd, yyyy")}
                          </td>
                          <td className="p-2 text-right">
                            {item.daysUntilExpiry < 0 ? (
                              <span className="text-red-600 font-semibold">
                                Expired ({Math.abs(item.daysUntilExpiry)} days
                                ago)
                              </span>
                            ) : (
                              item.daysUntilExpiry
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {item.quantity.toLocaleString()}
                          </td>
                          <td className="p-2 text-right">
                            ₹{item.value.toLocaleString()}
                          </td>
                          <td className="p-2">
                            <Badge
                              className={
                                item.status === "expired"
                                  ? "bg-red-100 text-red-800"
                                  : item.status === "expiring_soon"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {item.status === "expired"
                                ? "Expired"
                                : item.status === "expiring_soon"
                                  ? "Expiring Soon"
                                  : "Warning"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value Trend</CardTitle>
                <CardDescription>
                  Historical inventory value (simulated)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Value (₹)", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        {
                          month: "Jan",
                          value: stockValuation.totalValue * 0.85,
                        },
                        {
                          month: "Feb",
                          value: stockValuation.totalValue * 0.9,
                        },
                        {
                          month: "Mar",
                          value: stockValuation.totalValue * 0.95,
                        },
                        { month: "Apr", value: stockValuation.totalValue },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <p className="font-medium">
                                  ₹{payload[0].value?.toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Status Distribution</CardTitle>
                <CardDescription>Items by stock status</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: { label: "Count", color: "hsl(var(--chart-2))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          {
                            name: "In Stock",
                            value:
                              kpis.totalItems -
                              kpis.lowStockItems -
                              kpis.outOfStockItems,
                          },
                          { name: "Low Stock", value: kpis.lowStockItems },
                          { name: "Out of Stock", value: kpis.outOfStockItems },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="hsl(var(--chart-1))" />
                        <Cell fill="hsl(var(--chart-2))" />
                        <Cell fill="hsl(var(--chart-3))" />
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Average Item Value
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{kpis.avgItemValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total Quantity
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {kpis.totalQuantity.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Out of Stock Items
                  </p>
                  <p className="text-2xl font-bold mt-1 text-red-600">
                    {kpis.outOfStockItems}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
