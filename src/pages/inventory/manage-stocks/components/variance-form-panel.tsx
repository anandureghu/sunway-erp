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
import {
  createStockVariance,
  resubmitStockVariance,
  type StockVariance,
} from "@/service/stockVarianceService";
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
  Undo2,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  return "Failed to submit variance";
}

type VarianceFormPanelProps = {
  items: ItemResponseDTO[];
  warehouses: Warehouse[];
  onSubmitted: () => Promise<void>;
  /** When set, the form edits and resubmits this sent-back variance instead of creating a new one. */
  editing?: StockVariance;
  onCancelEdit?: () => void;
};

export function VarianceFormPanel({
  items,
  warehouses,
  onSubmitted,
  editing,
  onCancelEdit,
}: VarianceFormPanelProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
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
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const warehouseId = watch("warehouseId");
  const adjustmentQuantity = watch("adjustmentQuantity");
  const adjustmentMode = watch("adjustmentMode");
  const adjustmentType = watch("adjustmentType");
  const isTransfer = adjustmentType === "transfer";

  const searchResults = useMemo(
    () => filterItemsByQuery(items, itemSearchQuery),
    [items, itemSearchQuery],
  );

  const stockRow = useMemo(() => {
    if (!varianceItem || !warehouseId) return null;
    return items.find(
      (i) =>
        i.id === varianceItem.id && String(i.warehouse_id) === warehouseId,
    );
  }, [items, varianceItem, warehouseId]);

  const currentQuantity = stockRow?.quantity ?? 0;
  const unit = varianceItem?.unitMeasure ?? "units";

  const previewNewQuantity =
    !isTransfer && adjustmentMode === "delta"
      ? currentQuantity + (adjustmentQuantity || 0)
      : null;

  // Pre-fill the form when editing a sent-back variance for resubmission.
  useEffect(() => {
    if (!editing) return;
    const matchingItem = items.find((i) => i.id === editing.itemId) ?? null;
    setVarianceItem(matchingItem);
    const isEditingTransfer = editing.varianceType === "transfer";
    reset({
      itemId: String(editing.itemId),
      warehouseId: String(editing.fromWarehouseId),
      toWarehouseId: editing.toWarehouseId ? String(editing.toWarehouseId) : "",
      adjustmentType: editing.varianceType as StockAdjustmentFormData["adjustmentType"],
      adjustmentMode: (isEditingTransfer
        ? "transfer"
        : editing.adjustmentMode === "set"
          ? "set"
          : "delta") as StockAdjustmentFormData["adjustmentMode"],
      adjustmentQuantity: editing.adjustmentQuantity ?? undefined,
      newQuantity: editing.quantityAfter ?? undefined,
      // Only set transfer qty for transfers — 0 fails zod min(0.01) and blocks resubmit silently.
      transferQuantity: isEditingTransfer
        ? (editing.transferQuantity ?? undefined)
        : undefined,
      reason: editing.reason,
      notes: editing.notes ?? "",
      adjustmentDate: editing.varianceDate,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const handleItemSelect = (item: ItemResponseDTO) => {
    setVarianceItem(item);
    setValue("itemId", item.id.toString());
    setValue("warehouseId", String(item.warehouse_id), {
      shouldValidate: true,
    });
    setItemSearchQuery("");
  };

  const handleTypeChange = (value: StockAdjustmentFormData["adjustmentType"]) => {
    setValue("adjustmentType", value);
    if (value === "transfer") {
      setValue("adjustmentMode", "transfer");
    } else if (watch("adjustmentMode") === "transfer") {
      setValue("adjustmentMode", "delta");
    }
  };

  const onSubmit = async (data: StockAdjustmentFormData) => {
    if (!stockRow) {
      toast.error("Stock not found for this item and warehouse combination.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        itemId: Number(data.itemId),
        warehouseId: Number(data.warehouseId),
        toWarehouseId:
          data.adjustmentType === "transfer" && data.toWarehouseId
            ? Number(data.toWarehouseId)
            : undefined,
        varianceType: data.adjustmentType,
        adjustmentMode:
          data.adjustmentType === "transfer" ? "transfer" : data.adjustmentMode,
        adjustmentQuantity:
          data.adjustmentMode === "delta"
            ? Math.round(Number(data.adjustmentQuantity))
            : undefined,
        newQuantity:
          data.adjustmentMode === "set"
            ? Math.round(Number(data.newQuantity))
            : undefined,
        transferQuantity:
          data.adjustmentType === "transfer"
            ? Math.round(Number(data.transferQuantity))
            : undefined,
        reason: data.reason,
        notes: data.notes,
        varianceDate: data.adjustmentDate,
      };

      if (editing) {
        await resubmitStockVariance(editing.id, payload);
        toast.success("Variance resubmitted for approval");
      } else {
        await createStockVariance(payload);
        toast.success("Variance submitted for approval");
      }
      await onSubmitted();
      reset({
        adjustmentDate: format(new Date(), "yyyy-MM-dd"),
        adjustmentQuantity: 0,
        adjustmentType: "other",
        adjustmentMode: "delta",
        itemId: "",
        warehouseId: "",
      });
      setVarianceItem(null);
      setItemSearchQuery("");
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    reset({
      adjustmentDate: format(new Date(), "yyyy-MM-dd"),
      adjustmentQuantity: 0,
      adjustmentType: "other",
      adjustmentMode: "delta",
      itemId: "",
      warehouseId: "",
    });
    setVarianceItem(null);
    setItemSearchQuery("");
  };

  const selectedWarehouseName = warehouses.find((w) => w.id === warehouseId)?.name;
  const destinationWarehouses = warehouses.filter((w) => w.id !== warehouseId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {editing ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-500/[0.08] p-4">
          <Undo2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Sent back by {editing.sentBackByName ?? "an approver"}
            </p>
            <p className="text-sm text-amber-800/90">{editing.sentBackReason}</p>
          </div>
        </div>
      ) : null}
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
              query={itemSearchQuery}
              onQueryChange={setItemSearchQuery}
              results={itemSearchQuery.length > 0 ? searchResults : []}
              onSelect={handleItemSelect}
              hiddenInputProps={register("itemId")}
              errorText={errors.itemId?.message}
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
                    {isTransfer ? "From warehouse" : "Warehouse"}
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("warehouseId", value, { shouldValidate: true });
                      if (watch("toWarehouseId") === value) {
                        setValue("toWarehouseId", "");
                      }
                    }}
                    value={warehouseId || undefined}
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
                  {errors.warehouseId ? (
                    <p className="text-sm text-destructive">
                      {errors.warehouseId.message}
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
                Variance details
              </CardTitle>
              <CardDescription>
                Submitted variances require manager approval before stock changes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-5 sm:p-6">
          {varianceItem && warehouseId ? (
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
              {!isTransfer &&
              adjustmentMode === "delta" &&
              previewNewQuantity !== null ? (
                <div className="flex flex-col justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-300/90">
                    After approval
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
                  {isTransfer
                    ? "Stock will move between warehouses after approval."
                    : "Choose an adjustment method to preview the new quantity."}
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
                onValueChange={(value) =>
                  handleTypeChange(
                    value as StockAdjustmentFormData["adjustmentType"],
                  )
                }
                value={adjustmentType}
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
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.adjustmentType ? (
                <p className="text-sm text-destructive">
                  {errors.adjustmentType.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="variance-reason">Reason</Label>
              <Input
                id="variance-reason"
                placeholder="e.g. Cycle count correction"
                className="h-11 rounded-xl"
                {...register("reason")}
              />
              {errors.reason ? (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              ) : null}
            </div>
          </div>

          {isTransfer ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="to-warehouse">To warehouse</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("toWarehouseId", value, { shouldValidate: true })
                  }
                  value={watch("toWarehouseId") || undefined}
                >
                  <SelectTrigger id="to-warehouse" className="h-11 rounded-xl">
                    <SelectValue placeholder="Select destination warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationWarehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name} — {wh.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.toWarehouseId ? (
                  <p className="text-sm text-destructive">
                    {errors.toWarehouseId.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-qty">Quantity</Label>
                <Input
                  id="transfer-qty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Units to transfer"
                  className="h-11 rounded-xl font-medium tabular-nums"
                  {...register("transferQuantity", { valueAsNumber: true })}
                />
                {errors.transferQuantity ? (
                  <p className="text-sm text-destructive">
                    {errors.transferQuantity.message}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <>
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
                    onClick={() => setValue("adjustmentMode", "delta")}
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
                    onClick={() => setValue("adjustmentMode", "set")}
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
                    {...register("adjustmentQuantity", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Positive increases stock; negative reduces it (damaged,
                    theft, etc.).
                  </p>
                  {errors.adjustmentQuantity ? (
                    <p className="text-sm text-destructive">
                      {errors.adjustmentQuantity.message}
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
                    {...register("newQuantity", { valueAsNumber: true })}
                  />
                  {errors.newQuantity ? (
                    <p className="text-sm text-destructive">
                      {errors.newQuantity.message}
                    </p>
                  ) : null}
                </div>
              )}
            </>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="adj-date"
                className="inline-flex items-center gap-2"
              >
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Variance date
              </Label>
              <Input
                id="adj-date"
                type="date"
                className="h-11 rounded-xl"
                {...register("adjustmentDate")}
              />
              {errors.adjustmentDate ? (
                <p className="text-sm text-destructive">
                  {errors.adjustmentDate.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adj-notes">Notes (optional)</Label>
              <Input
                id="adj-notes"
                placeholder="Internal note for your team"
                className="h-11 rounded-xl"
                {...register("notes")}
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {editing && onCancelEdit ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancelEdit}
                disabled={submitting}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={submitting}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
            {!editing && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={submitting}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Start over
              </Button>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="gap-2 shadow-md"
            >
              {submitting ? (
                editing ? (
                  "Resubmitting…"
                ) : (
                  "Submitting…"
                )
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {editing ? "Resubmit for approval" : "Submit for approval"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
