import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import {
  ArrowUpRight,
  ImageIcon,
  Package,
  Pencil,
  ShieldCheck,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  displaySellingPrice,
  marginPercent,
  resolveStockIndicator,
  STATUS_LABELS,
  warehouseLabel,
  type StockIndicator,
} from "./item-detail-utils";
import { safeLocaleNumber } from "./formatters";

type Props = {
  item: ItemResponseDTO;
  imageNonce: number;
  onEdit: () => void;
  onUpdateImage: () => void;
};

function StockPill({ indicator }: { indicator: StockIndicator }) {
  if (indicator === "in_stock") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <ShieldCheck className="h-3.5 w-3.5" /> In stock
      </span>
    );
  }
  if (indicator === "low_stock") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
        <AlertTriangle className="h-3.5 w-3.5" /> Low stock
      </span>
    );
  }
  if (indicator === "out_of_stock") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
        <Ban className="h-3.5 w-3.5" /> Out of stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Ban className="h-3.5 w-3.5" /> Discontinued
    </span>
  );
}

export function ItemDetailHero({ item, imageNonce, onEdit, onUpdateImage }: Props) {
  const unit = item.unitMeasure || "pcs";
  const indicator = resolveStockIndicator(item);
  const selling = displaySellingPrice(item);
  const margin = marginPercent(item);
  const warehouse = warehouseLabel(item);
  const statusLabel =
    STATUS_LABELS[item.status ?? "active"] ??
    String(item.status ?? "active").replace(/_/g, " ");
  const available = Number(item.available ?? 0);
  const typeBadge = item.type?.trim() || item.category?.trim() || null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
      {/* Media gallery */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-slate-50">
          {item.imageUrl ? (
            <img
              key={`${item.imageUrl}-${imageNonce}`}
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-contain p-4"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-300">
              <Package className="h-16 w-16" strokeWidth={1} />
              <span className="text-sm text-slate-400">No product photo</span>
            </div>
          )}
          {typeBadge ? (
            <span className="absolute right-3 top-3 rounded-full bg-indigo-900/70 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
              {typeBadge}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-indigo-500 bg-slate-50 ring-2 ring-indigo-500/20"
            aria-label="Primary product image"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <Package className="m-auto h-6 w-6 text-slate-300" />
            )}
          </button>
          <button
            type="button"
            onClick={onUpdateImage}
            className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500"
            aria-label="Update product image"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          {item.brand ? (
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              {item.brand}
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {item.category || "Catalog item"}
            </span>
          )}
          <StockPill indicator={indicator} />
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {item.name}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Item ID: {item.id}
          <span className="mx-1.5 text-slate-300">·</span>
          SKU: <span className="font-mono text-[13px]">{item.sku || "—"}</span>
        </p>

        {item.category || item.subCategory ? (
          <p className="mt-3 text-sm text-slate-600">
            {[item.category, item.subCategory].filter(Boolean).join(" · ")}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <span className="text-3xl font-bold tabular-nums text-indigo-600 sm:text-4xl">
            <CurrencyAmount amount={selling} />
          </span>
          {Number(item.costPrice) > 0 && Number(item.costPrice) !== selling ? (
            <span className="pb-1 text-base text-slate-400 line-through tabular-nums">
              <CurrencyAmount amount={item.costPrice} />
            </span>
          ) : null}
          {margin != null && margin > 0 ? (
            <span className="mb-1 inline-flex items-center rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">
              +{margin}% margin
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Selling price · cost shown for margin reference
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            size="lg"
            className="h-12 gap-2 rounded-xl bg-indigo-600 text-base font-semibold hover:bg-indigo-700"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
            Edit product
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 gap-2 rounded-xl border-indigo-200 text-base font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
            onClick={onUpdateImage}
          >
            <ImageIcon className="h-4 w-4" />
            Update image
          </Button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 text-white shadow-md shadow-indigo-500/20">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
                Inventory status
              </p>
              <p className="mt-0.5 text-lg font-bold tabular-nums">
                {safeLocaleNumber(available)} {unit} left
              </p>
              {warehouse ? (
                <p className="mt-0.5 truncate text-xs text-white/75">
                  {item.warehouse_id ? (
                    <Link
                      to={`/inventory/warehouses/${item.warehouse_id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {warehouse}
                      {item.warehouse_location ? ` · ${item.warehouse_location}` : ""}
                    </Link>
                  ) : (
                    <>
                      {warehouse}
                      {item.warehouse_location ? ` · ${item.warehouse_location}` : ""}
                    </>
                  )}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-white/75">No warehouse assigned</p>
              )}
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">
            {statusLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
