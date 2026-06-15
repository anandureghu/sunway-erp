import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { formatOptionalDate, safeLocaleQty } from "./formatters";

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-muted/30">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground tabular-nums">{children}</dd>
    </div>
  );
}

interface Props {
  item: ItemResponseDTO;
}

export function ItemStockSpecs({ item }: Props) {
  const unit = item.unitMeasure || "units";

  const numVal = (v: number | null | undefined) =>
    v != null && Number.isFinite(Number(v)) ? safeLocaleQty(v, unit) : "—";

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Inventory
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Spec label="Available">{safeLocaleQty(item.available, unit)}</Spec>
        <Spec label="Total quantity">{safeLocaleQty(item.quantity, unit)}</Spec>
        <Spec label="Reserved">{numVal(item.reserved)}</Spec>
        <Spec label="Minimum">{numVal(item.minimum)}</Spec>
        <Spec label="Maximum">{numVal(item.maximum)}</Spec>
        <Spec label="Reorder level">{safeLocaleQty(item.reorderLevel, unit, "Not set")}</Spec>
        <Spec label="Unit">{unit}</Spec>
        <Spec label="Date received">{formatOptionalDate(item.dateReceived)}</Spec>
        <Spec label="Sale by Date">{formatOptionalDate(item.expiryDate, "Not set")}</Spec>
      </dl>
    </div>
  );
}
