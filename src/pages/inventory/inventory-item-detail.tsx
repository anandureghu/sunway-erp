import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, Plus } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { getItemById } from "@/service/inventoryService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateItemForm from "./item-form";
import type { ItemResponseDTO } from "@/service/erpApiTypes";

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
  const [item, setItem] = useState<ItemResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) return;

        const data = await getItemById(id);

        if (!cancelled) {
          setItem(data);
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

  if (error) {
    return (
      <div className="p-8 min-h-screen bg-gray-50">
        <p className="text-center text-gray-500">{error || "Item not found"}</p>
      </div>
    );
  }

  if (!item) return null;

  const isLowStock = item.available <= item.reorderLevel;

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

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => setShowEditItemDialog(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>

      <div className="flex items-start justify-between gap-5">
        <Section title="general">
          <LabelRow label="SKU" value={item.sku} />
          <LabelRow label="Brand" value={item.brand} />
          <LabelRow label="Category" value={item.category} />
        </Section>
        {/* Warehouse */}
        <Section title="Warehouse Details">
          <LabelRow label="Location" value={item.warehouse_location} />
          <LabelRow label="Warehouse" value={item.warehouse_name} />
          {/* <LabelRow label="Serial No." value={stock.serialNo || "-"} /> */}
          <LabelRow
            label="Available since"
            value={
              item.available
                ? " " + format(new Date(item.createdAt), "MMM dd, yyyy")
                : "-"
            }
          />
        </Section>
      </div>

      <div className="flex items-start justify-between gap-5">
        <Section title="Overview">
          <LabelRow
            label="Available Stock"
            value={`${item.available.toLocaleString()} ${item.unitMeasure}`}
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
              item.reserved
                ? `${item.reserved.toLocaleString()} ${item.unitMeasure}`
                : "-"
            }
          />

          <LabelRow
            label="Reorder Level"
            value={`${item.reorderLevel?.toLocaleString()} ${item.unitMeasure}`}
          />

          <LabelRow
            label="Maximum"
            value={
              item.maximum
                ? `${item.maximum?.toLocaleString()} ${item.unitMeasure}`
                : "-"
            }
          />

          <LabelRow
            label="Retail Price"
            value={`₹ ${item.sellingPrice.toLocaleString()}`}
          />
        </Section>

        {/* Additional Info */}
        <LabelRow label="Item Type" value={item.type || "-"} />
        <LabelRow label="Subcategory" value={item.subCategory || "-"} />
        <LabelRow label="Unit of Measure" value={item.unitMeasure} />
        <LabelRow
          label="Last Updated"
          value={
            item.updatedAt
              ? format(new Date(item.updatedAt), "MMM dd, yyyy")
              : "-"
          }
        />
      </div>

      {/* Description */}
      <Section title="Description">
        <p className="text-sm text-gray-700 leading-relaxed">
          {item?.description || "No description available."}
        </p>
      </Section>

      <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Item</DialogTitle>
            <DialogDescription>
              Add a new inventory item with all required details.
            </DialogDescription>
          </DialogHeader>
          <CreateItemForm
            editMode
            initialData={item}
            onSuccess={(newItem: ItemResponseDTO) => {
              // Item is already saved to API via createItem()
              // Select the newly created item
              // handleItemSelect(newItem);
              setItem(newItem);
              setShowEditItemDialog(false);
              // Clear search query
              // setItemSearchQuery("");
            }}
            onCancel={() => setShowEditItemDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryItemDetail;
