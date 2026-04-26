import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  STOCK_ADJUSTMENT_SCHEMA,
  type StockAdjustmentFormData,
} from "@/schema/inventory";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { adjustItemStock } from "@/service/inventoryService";
import type { Warehouse } from "@/types/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowRightLeft,
  CalendarDays,
  ClipboardList,
  Package,
  RotateCcw,
  Search,
  Sparkles,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { filterItemsByQuery } from "../use-manage-stocks";
import { ItemSearchCombobox } from "./item-search-combobox";

function getRequestErrorMessage(e: unknown): string {
  if (
    e &&
    typeof e === "object" &&
    "response" in e &&
    (e as { response?: { data?: { message?: string } } }).response?.data
      ?.message
  ) {
    return String(
      (e as { response: { data: { message: string } } }).response.data.message,
    );
  }
  if (e instanceof Error) return e.message;
  return "Failed to adjust stock";
}

type VarianceTabProps = {
  items: ItemResponseDTO[];
  warehouses: Warehouse[];
  onStockUpdated: () => Promise<void>;
};

export function VarianceTab({
  items,
  warehouses,
  onStockUpdated,
}: VarianceTabProps) {
  const {
    register: registerVariance,
    handleSubmit: handleVarianceSubmit,
    formState: { errors: varianceErrors },
    reset: resetVariance,
    watch: watchVariance,
    setValue: setVarianceValue,
  } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(STOCK_ADJUSTMENT_SCHEMA),
    defaultValues: {
      adjustmentDate: format(new Date(), "yyyy-MM-dd"),
      adjustmentQuantity: 0,
      adjustmentType: "other",
      adjustmentMode: "delta",
    },
  });

  const [varianceItem, setVarianceItem] = useState<ItemResponseDTO | null>(
    null,
  );
  const [varianceItemSearchQuery, setVarianceItemSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const varianceWarehouseId = watchVariance("warehouseId");
  const adjustmentQuantity = watchVariance("adjustmentQuantity");
  const adjustmentMode = watchVariance("adjustmentMode");

  const varianceSearchResults = useMemo(
    () => filterItemsByQuery(items, varianceItemSearchQuery),
    [items, varianceItemSearchQuery],
  );

  const stockRow = useMemo(() => {
    if (!varianceItem || !varianceWarehouseId) return null;
    return items.find(
      (i) =>
        i.id === varianceItem.id &&
        String(i.warehouse_id) === varianceWarehouseId,
    );
  }, [items, varianceItem, varianceWarehouseId]);

  const currentQuantity = stockRow?.quantity ?? 0;
  const unit = varianceItem?.unitMeasure ?? "units";

  const previewNewQuantity =
    adjustmentMode === "delta"
      ? currentQuantity + (adjustmentQuantity || 0)
      : null;

  const handleVarianceItemSelect = (item: ItemResponseDTO) => {
    setVarianceItem(item);
    setVarianceValue("itemId", item.id.toString());
    setVarianceValue("warehouseId", String(item.warehouse_id), {
      shouldValidate: true,
    });
    setVarianceItemSearchQuery("");
  };

  const onAdjustStock = async (data: StockAdjustmentFormData) => {
    if (!stockRow) {
      toast.error("Stock not found for this item and warehouse combination.");
      return;
    }

    setSubmitting(true);
    try {
      const base = {
        reason: data.reason,
        adjustmentType: data.adjustmentType,
        adjustmentDate: data.adjustmentDate,
        notes: data.notes,
        warehouseId: Number(data.warehouseId),
      };

      if (data.adjustmentMode === "delta") {
        await adjustItemStock(data.itemId, {
          ...base,
          adjustmentQuantity: Math.round(Number(data.adjustmentQuantity)),
        });
      } else {
        await adjustItemStock(data.itemId, {
          ...base,
          newQuantity: Math.round(Number(data.newQuantity)),
        });
      }

      toast.success("Stock adjusted");
      await onStockUpdated();
      resetVariance({
        adjustmentDate: format(new Date(), "yyyy-MM-dd"),
        adjustmentQuantity: 0,
        adjustmentType: "other",
        adjustmentMode: "delta",
        itemId: "",
        warehouseId: "",
      });
      setVarianceItem(null);
      setVarianceItemSearchQuery("");
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewVariance = () => {
    resetVariance({
      adjustmentDate: format(new Date(), "yyyy-MM-dd"),
      adjustmentQuantity: 0,
      adjustmentType: "other",
      adjustmentMode: "delta",
      itemId: "",
      warehouseId: "",
    });
    setVarianceItem(null);
    setVarianceItemSearchQuery("");
  };

  const handleCancelVariance = () => {
    handleNewVariance();
  };

  const selectedWarehouseName = warehouses.find(
    (w) => w.id === varianceWarehouseId,
  )?.name;

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-violet-500/[0.06] via-background to-background p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Inventory adjustment
            </div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Correct on-hand stock
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Search a product, choose how to adjust counts, and record the
              reason—like updating inventory in a storefront back office.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleVarianceSubmit(onAdjustStock)}
        className="space-y-6"
      >
        <Card className="overflow-hidden border-border/80 shadow-md">
          <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/60">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Find a product
                </CardTitle>
                <CardDescription>
                  Search by name, SKU, or barcode
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
              <ItemSearchCombobox
                label="Search catalog"
                query={varianceItemSearchQuery}
                onQueryChange={setVarianceItemSearchQuery}
                results={
                  varianceItemSearchQuery.length > 0
                    ? varianceSearchResults
                    : []
                }
                onSelect={handleVarianceItemSelect}
                hiddenInputProps={registerVariance("itemId")}
                errorText={varianceErrors.itemId?.message}
              />
            </div>

            {varianceItem ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                <div className="flex gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/40">
                    {varianceItem.imageUrl ? (
                      <img
                        src={varianceItem.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Package className="h-8 w-8 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="line-clamp-2 font-semibold leading-snug">
                      {varianceItem.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {varianceItem.sku}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="secondary" className="font-normal">
                        {varianceItem.status.replace(/_/g, " ")}
                      </Badge>
                      {selectedWarehouseName ? (
                        <Badge variant="outline" className="gap-1 font-normal">
                          <WarehouseIcon className="h-3 w-3" />
                          {selectedWarehouseName}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 sm:max-w-xs">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Ship from / warehouse
                    </Label>
                    <Select
                      onValueChange={(value) => {
                        setVarianceValue("warehouseId", value, {
                          shouldValidate: true,
                        });
                      }}
                      value={varianceWarehouseId || undefined}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name} — {wh.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {varianceErrors.warehouseId ? (
                      <p className="text-sm text-destructive">
                        {varianceErrors.warehouseId.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/80 shadow-md">
          <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/60">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Adjustment details
                </CardTitle>
                <CardDescription>
                  Reason, method, and new stock level
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-5 sm:p-6">
            {varianceItem && varianceWarehouseId ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    On hand now
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                    {currentQuantity}
                    <span className="ml-1.5 text-lg font-semibold text-muted-foreground">
                      {unit}
                    </span>
                  </p>
                </div>
                {adjustmentMode === "delta" &&
                previewNewQuantity !== null &&
                varianceItem ? (
                  <div className="flex flex-col justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-300/90">
                      After this adjustment
                    </p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {previewNewQuantity}
                      <span className="ml-1.5 text-lg font-semibold opacity-80">
                        {unit}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-5 text-sm text-muted-foreground">
                    <ClipboardList className="mb-2 h-5 w-5 opacity-50" />
                    Choose an adjustment method below to preview the new
                    quantity.
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                Select a product above to see current stock and preview changes.
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="variance-type">Variance type</Label>
                <Select
                  onValueChange={(value) => {
                    setVarianceValue(
                      "adjustmentType",
                      value as StockAdjustmentFormData["adjustmentType"],
                    );
                  }}
                  value={watchVariance("adjustmentType")}
                >
                  <SelectTrigger id="variance-type" className="h-11 rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="wastage">Wastage</SelectItem>
                    <SelectItem value="found">Found</SelectItem>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {varianceErrors.adjustmentType ? (
                  <p className="text-sm text-destructive">
                    {varianceErrors.adjustmentType.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="variance-reason">Reason</Label>
                <Input
                  id="variance-reason"
                  placeholder="e.g. Cycle count correction"
                  className="h-11 rounded-xl"
                  {...registerVariance("reason")}
                />
                {varianceErrors.reason ? (
                  <p className="text-sm text-destructive">
                    {varianceErrors.reason.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">How to adjust</Label>
              <div className="inline-flex w-full max-w-md rounded-full border border-border/80 bg-muted/40 p-1">
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all",
                    adjustmentMode === "delta"
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setVarianceValue("adjustmentMode", "delta")}
                >
                  Add or subtract
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all",
                    adjustmentMode === "set"
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setVarianceValue("adjustmentMode", "set")}
                >
                  Set exact qty
                </button>
              </div>
            </div>

            {adjustmentMode === "delta" ? (
              <div className="space-y-2">
                <Label htmlFor="adj-qty">Adjustment amount</Label>
                <Input
                  id="adj-qty"
                  type="number"
                  step="0.01"
                  placeholder="Use negative values to decrease"
                  className="h-11 rounded-xl font-medium tabular-nums"
                  {...registerVariance("adjustmentQuantity", {
                    valueAsNumber: true,
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Positive increases stock; negative reduces it (damaged, theft,
                  etc.).
                </p>
                {varianceErrors.adjustmentQuantity ? (
                  <p className="text-sm text-destructive">
                    {varianceErrors.adjustmentQuantity.message}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="new-qty">New quantity on hand</Label>
                <Input
                  id="new-qty"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="h-11 rounded-xl font-medium tabular-nums"
                  {...registerVariance("newQuantity", {
                    valueAsNumber: true,
                  })}
                />
                {varianceErrors.newQuantity ? (
                  <p className="text-sm text-destructive">
                    {varianceErrors.newQuantity.message}
                  </p>
                ) : null}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="adj-date"
                  className="inline-flex items-center gap-2"
                >
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Adjustment date
                </Label>
                <Input
                  id="adj-date"
                  type="date"
                  className="h-11 rounded-xl"
                  {...registerVariance("adjustmentDate")}
                />
                {varianceErrors.adjustmentDate ? (
                  <p className="text-sm text-destructive">
                    {varianceErrors.adjustmentDate.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adj-notes">Notes (optional)</Label>
                <Input
                  id="adj-notes"
                  placeholder="Internal note for your team"
                  className="h-11 rounded-xl"
                  {...registerVariance("notes")}
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelVariance}
                disabled={submitting}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleNewVariance}
                disabled={submitting}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Start over
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="gap-2 shadow-md"
              >
                {submitting ? (
                  "Applying…"
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Apply adjustment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
