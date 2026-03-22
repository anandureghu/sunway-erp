import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { getItemById } from "@/service/inventoryService";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  ChevronRight,
  ImageIcon,
  Loader2,
  MapPin,
  Package,
  Pencil,
  ShieldCheck,
  Tag,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CreateItemForm from "../item-form";
import { ChangeItemImageDialog } from "./change-item-image-dialog";
import {
  formatInr,
  safeLocaleQty,
  toFiniteNumber,
} from "./formatters";

function apiErrorMessage(e: unknown): string {
  const ax = e as { response?: { data?: { message?: string } }; message?: string };
  return (
    ax.response?.data?.message ??
    ax.message ??
    "Failed to load item"
  );
}

const STATUS_STYLES: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
> = {
  active: { variant: "default", label: "Active" },
  discontinued: { variant: "secondary", label: "Discontinued" },
  out_of_stock: { variant: "destructive", label: "Out of stock" },
};

function Spec({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-muted/30">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground tabular-nums">
        {children}
      </dd>
    </div>
  );
}

export default function InventoryItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageNonce, setImageNonce] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getItemById(id);
        if (!cancelled) setItem(data);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(apiErrorMessage(e));
          setItem(null);
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-gradient-to-b from-slate-50 to-background dark:from-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading product…</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <Package className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-center text-muted-foreground">{error ?? "Item not found."}</p>
        <Button variant="outline" onClick={() => navigate("/inventory/stocks")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to catalog
        </Button>
      </div>
    );
  }

  const unit = item.unitMeasure || "units";
  const available = toFiniteNumber(item.available, 0);
  const reorderLevel = toFiniteNumber(item.reorderLevel, 0);
  const isLowStock = available <= reorderLevel && reorderLevel > 0;
  const stockOk = available > 0 && !isLowStock;

  const statusKey = item.status ?? "active";
  const statusMeta = STATUS_STYLES[statusKey] ?? {
    variant: "outline" as const,
    label: String(statusKey).replace(/_/g, " "),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/90 via-background to-background dark:from-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate("/inventory/stocks")}
            className="inline-flex items-center transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Inventory
          </button>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
          <span className="font-medium text-foreground line-clamp-1">{item.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Gallery — e-commerce style */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 space-y-4">
              <div className="group relative overflow-hidden rounded-2xl bg-muted/40 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                <div className="aspect-square w-full">
                  {item.imageUrl ? (
                    <img
                      key={`${item.imageUrl}-${imageNonce}`}
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/50 text-muted-foreground">
                      <Package className="h-20 w-20 opacity-30" strokeWidth={1} />
                      <span className="text-sm">No product photo</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 pt-16 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="shadow-lg"
                    onClick={() => setImageDialogOpen(true)}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Update photo
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full lg:hidden"
                onClick={() => setImageDialogOpen(true)}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Change product image
              </Button>
            </div>
          </div>

          {/* Product info */}
          <div className="lg:col-span-7">
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    SKU{" "}
                    <span className="font-mono text-foreground">{item.sku}</span>
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                    {item.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5">
                      <Tag className="h-3.5 w-3.5" />
                      {item.category}
                    </span>
                    {item.brand ? (
                      <span className="rounded-full bg-muted px-2.5 py-0.5">
                        {item.brand}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Badge variant={statusMeta.variant} className="shrink-0 capitalize">
                  {statusMeta.label}
                </Badge>
              </div>

              {/* Price block — storefront emphasis */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Selling price
                    </p>
                    <p className="mt-1 text-4xl font-bold tracking-tight text-primary tabular-nums">
                      {formatInr(item.sellingPrice)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Cost:{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {formatInr(item.costPrice)}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {stockOk ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                        In stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4" />
                        Low stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                        <Box className="h-4 w-4" />
                        Check availability
                      </span>
                    )}
                  </div>
                </div>

                {isLowStock ? (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Available quantity is at or below reorder level. Consider
                    restocking.
                  </div>
                ) : null}

                <Separator className="my-5" />

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    size="lg"
                    className="gap-2"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit product
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="hidden gap-2 sm:inline-flex"
                    onClick={() => setImageDialogOpen(true)}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Update image
                  </Button>
                </div>
              </div>

              {/* Quick specs grid */}
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Inventory
                </h2>
                <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Spec label="Available">{safeLocaleQty(item.available, unit)}</Spec>
                  <Spec label="Total quantity">{safeLocaleQty(item.quantity, unit)}</Spec>
                  <Spec label="Reserved">
                    {item.reserved != null && Number.isFinite(Number(item.reserved))
                      ? safeLocaleQty(item.reserved, unit)
                      : "—"}
                  </Spec>
                  <Spec label="Reorder level">{safeLocaleQty(item.reorderLevel, unit, "Not set")}</Spec>
                  <Spec label="Maximum">
                    {item.maximum != null && Number.isFinite(Number(item.maximum))
                      ? safeLocaleQty(item.maximum, unit)
                      : "—"}
                  </Spec>
                  <Spec label="Unit">{unit}</Spec>
                </dl>
              </div>

              {/* Classification + warehouse */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    Details
                  </h2>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between gap-4 border-b border-border/50 pb-3">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">{item.type || "—"}</span>
                    </li>
                    <li className="flex justify-between gap-4 border-b border-border/50 pb-3">
                      <span className="text-muted-foreground">Subcategory</span>
                      <span className="font-medium">{item.subCategory ?? "—"}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Barcode</span>
                      <span className="font-mono text-xs font-medium">
                        {item.barcode ?? "—"}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    Fulfillment
                  </h2>
                  <p className="font-medium leading-snug">{item.warehouse_name}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.warehouse_location}
                  </p>
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

              <p className="text-center text-xs text-muted-foreground sm:text-left">
                Listed {format(new Date(item.createdAt), "MMM d, yyyy")}
                {item.updatedAt ? (
                  <>
                    {" "}
                    · Updated {format(new Date(item.updatedAt), "MMM d, yyyy")}
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ChangeItemImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        itemId={String(item.id)}
        onUpdated={(updated) => {
          setItem(updated);
          setImageNonce((n) => n + 1);
        }}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>
              Update catalog details. SKU cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <CreateItemForm
            editMode
            initialData={item}
            onSuccess={(newItem) => {
              setItem(newItem);
              setImageNonce((n) => n + 1);
              setEditOpen(false);
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
