import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import {
  ItemDetailField,
  ItemSectionCard,
} from "@/components/inventory/item-section-card";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import {
  AlertTriangle,
  Ban,
  DollarSign,
  ImageIcon,
  Layers,
  Package,
  Pencil,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  formatOptionalDate,
  formatRecordTimestamp,
  formatUnitLabel,
  safeLocaleQty,
} from "./formatters";

const STATUS_STYLES: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
> = {
  active: { variant: "default", label: "Active" },
  discontinued: { variant: "secondary", label: "Discontinued" },
  out_of_stock: { variant: "destructive", label: "Out of stock" },
};

type StockIndicator = "in_stock" | "low_stock" | "out_of_stock" | "discontinued";

function resolveStockIndicator(item: ItemResponseDTO): StockIndicator {
  if (item.status === "discontinued") return "discontinued";
  const available = Number(item.available ?? 0);
  const reorderLevel = Number(item.reorderLevel ?? 0);
  if (item.status === "out_of_stock" || available <= 0) return "out_of_stock";
  if (reorderLevel > 0 && available <= reorderLevel) return "low_stock";
  return "in_stock";
}

function displaySellingPrice(item: ItemResponseDTO): number {
  const selling = Number(item.sellingPrice);
  const unitSale = Number(item.unitSale);
  if (Number.isFinite(selling) && selling > 0) return selling;
  if (Number.isFinite(unitSale) && unitSale > 0) return unitSale;
  return Number.isFinite(selling) ? selling : 0;
}

function StockStatusBadge({ indicator }: { indicator: StockIndicator }) {
  if (indicator === "in_stock") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
        <ShieldCheck className="h-3.5 w-3.5" /> In stock
      </span>
    );
  }
  if (indicator === "low_stock") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5" /> Low stock
      </span>
    );
  }
  if (indicator === "out_of_stock") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
        <Ban className="h-3.5 w-3.5" /> Out of stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      <Ban className="h-3.5 w-3.5" /> Discontinued
    </span>
  );
}

type Props = {
  item: ItemResponseDTO;
  imageNonce: number;
  onEdit: () => void;
  onUpdateImage: () => void;
};

export function ItemDetailSections({
  item,
  imageNonce,
  onEdit,
  onUpdateImage,
}: Props) {
  const unit = item.unitMeasure || "pcs";
  const stockIndicator = resolveStockIndicator(item);
  const statusKey = item.status ?? "active";
  const statusMeta = STATUS_STYLES[statusKey] ?? {
    variant: "outline" as const,
    label: String(statusKey).replace(/_/g, " "),
  };

  const numVal = (v: number | null | undefined, empty = "—") => {
    if (v == null || !Number.isFinite(Number(v))) return empty;
    return safeLocaleQty(v, unit);
  };

  const warehouseLabel =
    item.warehouse_name && item.warehouse_id
      ? `${item.warehouse_name} (${item.warehouse_id})`
      : item.warehouse_name || (item.warehouse_id ? String(item.warehouse_id) : null);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StockStatusBadge indicator={stockIndicator} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-2 rounded-xl" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit product
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={onUpdateImage}
          >
            <ImageIcon className="h-4 w-4" />
            Update image
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <ItemSectionCard
          icon={<Package className="h-3.5 w-3.5 text-white" />}
          title="Item image"
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={onUpdateImage}
            >
              Change
            </Button>
          }
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            <div className="flex h-full min-h-[240px] w-full flex-1 items-center justify-center bg-white p-4">
              {item.imageUrl ? (
                <img
                  key={`${item.imageUrl}-${imageNonce}`}
                  src={item.imageUrl}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain object-center"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Package className="h-14 w-14 opacity-30" strokeWidth={1} />
                  <span className="text-sm">No product photo</span>
                </div>
              )}
            </div>
          </div>
        </ItemSectionCard>

        <ItemSectionCard
          icon={<Tag className="h-3.5 w-3.5 text-white" />}
          title="Basic information"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ItemDetailField label="Item ID" value={String(item.id)} mono />
            <ItemDetailField label="SKU" value={item.sku} mono />
            <ItemDetailField label="Item name" value={item.name} />
            <ItemDetailField label="Brand" value={item.brand} />
            <ItemDetailField label="Item type" value={item.type} />
            <ItemDetailField
              label="Description"
              value={item.description?.trim() || null}
              className="sm:col-span-2"
            />
          </div>
        </ItemSectionCard>

        <ItemSectionCard
          icon={<Layers className="h-3.5 w-3.5 text-white" />}
          title="Classification"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ItemDetailField label="Category" value={item.category} />
            <ItemDetailField label="Sub category" value={item.subCategory} />
            <ItemDetailField
              label="Status"
              value={
                <Badge variant={statusMeta.variant} className="capitalize">
                  {statusMeta.label}
                </Badge>
              }
            />
            <ItemDetailField label="Barcode" value={item.barcode} mono />
            <ItemDetailField label="Serial no." value={item.serialNo} mono />
          </div>
        </ItemSectionCard>

        <ItemSectionCard
          icon={<Package className="h-3.5 w-3.5 text-white" />}
          title="Unit & warehouse"
        >
          {stockIndicator === "low_stock" && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Available quantity is at or below reorder level. Consider restocking.
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ItemDetailField label="Unit" value={formatUnitLabel(unit)} />
            <ItemDetailField
              label="Warehouse"
              value={
                warehouseLabel ? (
                  item.warehouse_id ? (
                    <Link
                      to={`/inventory/warehouses/${item.warehouse_id}`}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {warehouseLabel}
                    </Link>
                  ) : (
                    warehouseLabel
                  )
                ) : null
              }
            />
            <ItemDetailField
              label="Warehouse address"
              value={item.warehouse_location}
              className="sm:col-span-2"
            />
            <ItemDetailField label="Bin / location" value={item.location} />
            <ItemDetailField label="Available" value={numVal(item.available)} />
            <ItemDetailField label="Total quantity" value={numVal(item.quantity)} />
            <ItemDetailField label="Reserved" value={numVal(item.reserved)} />
            <ItemDetailField label="Date received" value={formatOptionalDate(item.dateReceived)} />
            <ItemDetailField
              label="Sale by date"
              value={formatOptionalDate(item.expiryDate)}
            />
          </div>
        </ItemSectionCard>

        <ItemSectionCard
          icon={<DollarSign className="h-3.5 w-3.5 text-white" />}
          title="Pricing"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ItemDetailField
              label="Cost price"
              value={
                <span className="font-semibold tabular-nums">
                  <CurrencyAmount amount={item.costPrice} />
                </span>
              }
            />
            <ItemDetailField
              label="Selling price"
              value={
                <span className="text-lg font-bold tabular-nums text-primary">
                  <CurrencyAmount amount={displaySellingPrice(item)} />
                </span>
              }
            />
            <ItemDetailField
              label="Reorder level"
              value={numVal(item.reorderLevel)}
            />
            <ItemDetailField label="Minimum stock" value={numVal(item.minimum)} />
            <ItemDetailField label="Maximum stock" value={numVal(item.maximum)} />
          </div>
        </ItemSectionCard>

        <ItemSectionCard
          icon={<Tag className="h-3.5 w-3.5 text-white" />}
          title="Record"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ItemDetailField
              label="Stock level"
              value={<StockStatusBadge indicator={stockIndicator} />}
            />
            <ItemDetailField
              label="Created"
              value={formatRecordTimestamp(item.createdAt)}
            />
            <ItemDetailField
              label="Last updated"
              value={formatRecordTimestamp(item.updatedAt)}
            />
          </div>
        </ItemSectionCard>
      </div>
    </div>
  );
}
