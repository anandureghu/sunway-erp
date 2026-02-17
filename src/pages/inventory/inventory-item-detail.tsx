import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import {
  listStock,
  listItems,
  listWarehouses,
} from "@/service/inventoryService";
import type { Stock, Item, Warehouse } from "@/types/inventory";

const LabelRow = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) => (
  <div className="flex justify-between py-3 border-b border-gray-100 text-sm">
    <span className="text-gray-500">{label}</span>
    <span
      className={`font-medium ${
        highlight ? "text-red-600 font-semibold" : "text-gray-900"
      }`}
    >
      {value}
    </span>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4 w-full">
    <h2 className="text-base font-semibold text-gray-900 tracking-tight">
      {title}
    </h2>
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {children}
    </div>
  </div>
);

const InventoryItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stock, setStock] = useState<
    (Stock & { item: Item; warehouse: Warehouse }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [stockList, itemsList, warehousesList] = await Promise.all([
          listStock(),
          listItems(),
          listWarehouses(),
        ]);

        if (!cancelled) {
          const enrichedStock = stockList
            .map((s) => {
              const item = itemsList.find((i) => i.id === s.itemId);
              const warehouse = warehousesList.find(
                (w) => w.id === s.warehouse_id?.toString(),
              );

              if (!item || !warehouse) return null;

              return { ...s, item, warehouse };
            })
            .filter(
              (s): s is Stock & { item: Item; warehouse: Warehouse } =>
                s !== null,
            );

          const foundStock = enrichedStock.find((s) => s.id === id);

          if (foundStock) {
            setStock(foundStock);
          } else {
            setError("Stock record not found");
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load item details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-gray-50">
        <p className="text-center text-gray-500">Loading item details...</p>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="p-8 min-h-screen bg-gray-50">
        <p className="text-center text-gray-500">{error || "Item not found"}</p>
      </div>
    );
  }

  const { item, warehouse } = stock;

  const isLowStock = stock.quantity <= (item.reorderLevel || 0);

  const statusColors = {
    active: "bg-green-100 text-green-800",
    discontinued: "bg-gray-100 text-gray-800",
    out_of_stock: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-8 space-y-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/inventory/stocks")}
            className="mb-4 px-0 text-sm text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>

          <div className="flex items-center gap-5">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                className="w-[100px] h-[100px] object-cover rounded-full bg-gray-500"
              />
            ) : (
              <div className="w-[100px] h-[100px] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[40px] h-[40px]"
                >
                  <path d="M4 5V19H20V7H11.5858L9.58579 5H4ZM12.4142 5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5ZM10 10.5C10 11.3284 9.32843 12 8.5 12C7.67157 12 7 11.3284 7 10.5C7 9.67157 7.67157 9 8.5 9C9.32843 9 10 9.67157 10 10.5ZM18 17L14 11L7 17H18Z"></path>
                </svg>
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {item.name}
              </h1>
              <p className="text-sm text-gray-500">
                {item.sku} • {item.category} • {item.brand || "No Brand"}
              </p>
            </div>
          </div>
        </div>

        <Badge
          variant="outline"
          className={`${
            statusColors[item.status] || "bg-gray-100 text-gray-800"
          } px-3 py-1 rounded-full text-xs font-semibold`}
        >
          {item.status.replace("_", " ").toUpperCase()}
        </Badge>
      </div>

      <div className="flex items-start justify-between gap-5">
        <Section title="general">
          <LabelRow label="SKU" value={item.sku} />
          <LabelRow label="Brand" value={item.brand} />
          <LabelRow label="Category" value={item.category} />
        </Section>

        {/* Warehouse */}
        <Section title="Warehouse Details">
          <LabelRow label="Location" value={warehouse.location} />
          <LabelRow label="Serial No." value={stock.serialNo || "-"} />
          <LabelRow
            label="Date Received"
            value={
              stock.dateReceived
                ? format(new Date(stock.dateReceived), "MMM dd, yyyy")
                : "-"
            }
          />
        </Section>
      </div>

      <div className="flex items-start justify-between gap-5">
        <Section title="Overview">
          <LabelRow
            label="Available Stock"
            value={`${stock.availableQuantity.toLocaleString()} ${item.unit}`}
            highlight={isLowStock}
          />

          {isLowStock && (
            <div className="flex items-center gap-2 text-red-600 text-xs mt-2">
              <AlertTriangle className="h-4 w-4" />
              Low stock. Reorder recommended.
            </div>
          )}

          <LabelRow
            label="Reserved"
            value={
              stock.reservedQuantity
                ? `${stock.reservedQuantity.toLocaleString()} ${item.unit}`
                : "-"
            }
          />

          <LabelRow
            label="Reorder Level"
            value={`${item.reorderLevel.toLocaleString()} ${item.unit}`}
          />

          <LabelRow
            label="Maximum"
            value={
              item.maximum
                ? `${item.maximum.toLocaleString()} ${item.unit}`
                : "-"
            }
          />

          <LabelRow
            label="Retail Price"
            value={`₹ ${item.sellingPrice.toLocaleString()}`}
          />
        </Section>

        {/* Additional Info */}
        <Section title="Additional Information">
          <LabelRow label="Item Type" value={item.itemType || "-"} />
          <LabelRow label="Subcategory" value={item.subcategory || "-"} />
          <LabelRow label="Unit of Measure" value={item.unit} />
          <LabelRow
            label="Last Updated"
            value={format(new Date(stock.lastUpdated), "MMM dd, yyyy")}
          />
          <LabelRow label="Updated By" value={stock.updatedBy || "-"} />
        </Section>
      </div>

      {/* Description */}
      <Section title="Description">
        <p className="text-sm text-gray-700 leading-relaxed">
          {item.description || "No description available."}
        </p>
      </Section>
    </div>
  );
};

export default InventoryItemDetail;
