import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import {
  AlertTriangle, Ban, ImageIcon, Pencil, ShieldCheck, Tag,
} from "lucide-react";
import type { ItemResponseDTO } from "@/service/erpApiTypes";

const STATUS_STYLES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  active:        { variant: "default",     label: "Active" },
  discontinued:  { variant: "secondary",   label: "Discontinued" },
  out_of_stock:  { variant: "destructive", label: "Out of stock" },
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

interface Props {
  item: ItemResponseDTO;
  onEdit: () => void;
  onUpdateImage: () => void;
}

export function ItemPriceBlock({ item, onEdit, onUpdateImage }: Props) {
  const statusKey  = item.status ?? "active";
  const statusMeta = STATUS_STYLES[statusKey] ?? { variant: "outline" as const, label: String(statusKey).replace(/_/g, " ") };
  const stockIndicator = resolveStockIndicator(item);

  return (
    <div className="space-y-4">
      {/* name / sku / tags row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            SKU <span className="font-mono text-foreground">{item.sku}</span>
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{item.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5">
              <Tag className="h-3.5 w-3.5" />
              {item.category}
            </span>
            {item.brand && (
              <span className="rounded-full bg-muted px-2.5 py-0.5">{item.brand}</span>
            )}
          </div>
        </div>
        <Badge variant={statusMeta.variant} className="shrink-0 capitalize">
          {statusMeta.label}
        </Badge>
      </div>

      {/* price card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selling price</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-primary tabular-nums">
              <CurrencyAmount amount={item.sellingPrice} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cost:{" "}
              <span className="font-medium text-foreground tabular-nums">
                <CurrencyAmount amount={item.costPrice} />
              </span>
            </p>
            {item.unitSale != null && Number(item.unitSale) > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Unit sale:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  <CurrencyAmount amount={item.unitSale} />
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {stockIndicator === "in_stock" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" /> In stock
              </span>
            )}
            {stockIndicator === "low_stock" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" /> Low stock
              </span>
            )}
            {stockIndicator === "out_of_stock" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                <Ban className="h-4 w-4" /> Out of stock
              </span>
            )}
            {stockIndicator === "discontinued" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <Ban className="h-4 w-4" /> Discontinued
              </span>
            )}
          </div>
        </div>

        {stockIndicator === "low_stock" && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Available quantity is at or below reorder level. Consider restocking.
          </div>
        )}

        <Separator className="my-5" />

        <div className="flex flex-wrap gap-3">
          <Button type="button" size="lg" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit product
          </Button>
          <Button type="button" size="lg" variant="outline" className="hidden gap-2 sm:inline-flex" onClick={onUpdateImage}>
            <ImageIcon className="h-4 w-4" /> Update image
          </Button>
        </div>
      </div>
    </div>
  );
}
