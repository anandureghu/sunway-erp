import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Warehouse, AlertTriangle } from "lucide-react";
import { getStockWithDetails } from "@/lib/inventory-data";
import { format } from "date-fns";

// Reusable InfoCard Component
const InfoCard = ({ 
  title, 
  children, 
  span = "" 
}: { 
  title: string; 
  children: React.ReactNode; 
  span?: string;
}) => (
  <Card className={`hover:shadow-md transition-shadow duration-200 ${span}`}>
    <CardHeader className="pb-3">
      <CardTitle className="text-xs uppercase tracking-wide text-blue-800 bg-blue-50 px-3 py-2 rounded-md font-medium">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const InventoryItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const stockData = getStockWithDetails();
  const stock = stockData.find((s) => s.id === id);

  if (!stock) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/inventory/stocks")}
            className="flex items-center gap-2 rounded-full px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Item not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { item, warehouse } = stock;
  const statusColors = {
    active: "bg-green-100 text-green-800",
    discontinued: "bg-gray-100 text-gray-800",
    out_of_stock: "bg-red-100 text-red-800",
  };

  const isLowStock = stock.quantity <= (item.reorderLevel || 0);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/inventory/stocks")}
            className="flex items-center gap-2 rounded-full px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{item.name}</h1>
            <p className="text-gray-600 text-sm mt-1">Inventory Item Details</p>
          </div>
        </div>
      </div>

      {/* Item Basic Info Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Item Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard title="SKU / Item Code">
            <div className="flex flex-col">
              <span className="text-lg font-semibold">{item.sku}</span>
              {item.barcode && (
                <span className="text-xs text-gray-500 mt-1">Barcode: {item.barcode}</span>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Item Name">
            <span className="text-lg font-semibold">{item.name}</span>
          </InfoCard>

          <InfoCard title="Item Type">
            <span className="text-gray-900">{item.itemType || "-"}</span>
          </InfoCard>

          <InfoCard title="Category">
            <span className="text-gray-900">{item.category}</span>
          </InfoCard>

          <InfoCard title="Subcategory">
            <span className="text-gray-900">{item.subcategory || "-"}</span>
          </InfoCard>

          <InfoCard title="Brand">
            <span className="text-gray-900">{item.brand || "-"}</span>
          </InfoCard>
        </div>
      </div>

      <div className="border-b my-4"></div>

      {/* Stock & Warehouse Details Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Stock & Warehouse Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard title="Location">
            <div className="flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{warehouse.location}</span>
            </div>
          </InfoCard>

          <InfoCard title="Quantity">
            <div className="flex flex-col">
              <span className={`text-lg font-semibold ${isLowStock ? "text-red-600" : "text-gray-900"}`}>
                {stock.quantity.toLocaleString()} {item.unit}
              </span>
              {isLowStock && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  Low Stock – Needs Reorder
                </div>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Available">
            <span className="text-lg font-semibold text-gray-900">
              {stock.availableQuantity.toLocaleString()} {item.unit}
            </span>
          </InfoCard>

          <InfoCard title="Reserved">
            <span className={`text-lg font-semibold ${stock.reservedQuantity && stock.reservedQuantity > 0 ? "text-amber-600" : "text-gray-400"}`}>
              {stock.reservedQuantity ? stock.reservedQuantity.toLocaleString() : "-"} {stock.reservedQuantity ? item.unit : ""}
            </span>
          </InfoCard>

          <InfoCard title="Minimum">
            <span className={`text-gray-900 ${isLowStock ? "text-red-600 font-semibold" : ""}`}>
              {item.reorderLevel.toLocaleString()} {item.unit}
            </span>
          </InfoCard>

          <InfoCard title="Maximum">
            <span className="text-gray-900">
              {item.maximum ? `${item.maximum.toLocaleString()} ${item.unit}` : "-"}
            </span>
          </InfoCard>

          <InfoCard title="Serial No.">
            <span className="text-gray-900">{stock.serialNo || "-"}</span>
          </InfoCard>
        </div>
      </div>

      <div className="border-b my-4"></div>

      {/* Pricing Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard title="Retail Price">
            <span className="text-lg font-semibold">
              ₹ {item.sellingPrice.toLocaleString()}
            </span>
          </InfoCard>

          <InfoCard title="Unit Sale">
            <span className="text-gray-900">{item.unit}</span>
          </InfoCard>

          <InfoCard title="Unit of Measure">
            <span className="text-gray-900">{item.unit}</span>
          </InfoCard>
        </div>
      </div>

      <div className="border-b my-4"></div>

      {/* Metadata Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard title="Date Received">
            <span className="text-gray-900">
              {stock.dateReceived ? format(new Date(stock.dateReceived), "MMM dd, yyyy") : "-"}
            </span>
          </InfoCard>

          <InfoCard title="Sale By Date">
            <span className="text-gray-900">
              {stock.saleByDate ? format(new Date(stock.saleByDate), "MMM dd, yyyy") : "-"}
            </span>
          </InfoCard>

          <InfoCard title="Last Updated">
            <span className="text-gray-900">
              {format(new Date(stock.lastUpdated), "MMM dd, yyyy")}
            </span>
          </InfoCard>

          <InfoCard title="Updated By">
            <span className="text-gray-900">{stock.updatedBy || "-"}</span>
          </InfoCard>

          <InfoCard title="Status">
            <Badge
              variant="outline"
              className={`${statusColors[item.status] || "bg-gray-100 text-gray-800"} px-3 py-1 rounded-full text-xs font-semibold`}
            >
              {item.status.replace("_", " ").toUpperCase()}
            </Badge>
          </InfoCard>
        </div>
      </div>

      <div className="border-b my-4"></div>

      {/* Item Description */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Description</h2>
        <InfoCard title="Item Description" span="md:col-span-2 lg:col-span-3">
          <p className="text-gray-900">{item.description || "-"}</p>
        </InfoCard>
      </div>
    </div>
  );
};

export default InventoryItemDetail;
