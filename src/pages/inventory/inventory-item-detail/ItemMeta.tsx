import { Button } from "@/components/ui/button";
import { MapPin, Tag, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { ItemResponseDTO } from "@/service/erpApiTypes";

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <li className="flex justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs font-medium" : "font-medium"}>{value}</span>
    </li>
  );
}

interface Props {
  item: ItemResponseDTO;
}

export function ItemMeta({ item }: Props) {
  return (
    <div className="space-y-6">
      {/* Details + Fulfillment */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Classification */}
        <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Details
          </h2>
          <ul className="space-y-3 text-sm">
            <Row label="Type"        value={item.type        || "—"} />
            <Row label="Subcategory" value={item.subCategory ?? "—"} />
            <Row label="Brand"       value={item.brand       ?? "—"} />
            <Row label="Barcode"     value={item.barcode     ?? "—"} mono />
            <Row label="Serial No."  value={item.serialNo    ?? "—"} mono />
            <Row label="Location"    value={item.location    ?? "—"} />
          </ul>
        </div>

        {/* Warehouse */}
        <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Truck className="h-4 w-4 text-muted-foreground" />
            Fulfillment
          </h2>
          <p className="font-medium leading-snug">{item.warehouse_name}</p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.warehouse_location}</p>
          <Button variant="link" className="mt-3 h-auto p-0 text-primary" asChild>
            <Link to={`/inventory/warehouses/${item.warehouse_id}`}>
              <MapPin className="mr-1.5 h-4 w-4" />
              View warehouse
            </Link>
          </Button>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {item.description?.trim() || "No description added for this product."}
        </p>
      </div>

      {/* Timestamps */}
      <p className="text-xs text-muted-foreground">
        Listed {format(new Date(item.createdAt), "MMM d, yyyy")}
        {item.updatedAt && (
          <> · Updated {format(new Date(item.updatedAt), "MMM d, yyyy")}</>
        )}
      </p>
    </div>
  );
}
