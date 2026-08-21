import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Percent, Search, Tag } from "lucide-react";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import {
  applyItemBulkDiscount,
  listItems,
} from "@/service/inventoryService";
import type { ItemResponseDTO } from "@/service/erpApiTypes";

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((v) => (v ?? "").trim())
        .filter((v) => v.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = value.slice(0, 10);
  return d || "—";
}

export default function ItemDiscountMaster() {
  const { confirm } = useConfirmDialog();
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [category, setCategory] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [saleByFrom, setSaleByFrom] = useState("");
  const [saleByTo, setSaleByTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listItems();
      setItems(data);
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || "Failed to load items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(
    () => uniqueSorted(items.map((i) => i.category)),
    [items],
  );
  const types = useMemo(() => uniqueSorted(items.map((i) => i.type)), [items]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const from = saleByFrom || null;
    const to = saleByTo || null;

    return items.filter((item) => {
      if (category !== "all" && (item.category || "") !== category) return false;
      if (type !== "all" && (item.type || "") !== type) return false;

      const expiry = item.expiryDate ? String(item.expiryDate).slice(0, 10) : "";
      if (from || to) {
        if (!expiry) return false;
        if (from && expiry < from) return false;
        if (to && expiry > to) return false;
      }

      if (q) {
        const hay = `${item.sku ?? ""} ${item.name ?? ""} ${item.category ?? ""} ${item.type ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, category, type, saleByFrom, saleByTo, searchQuery]);

  const previewDiscount = useMemo(() => {
    const pct = Number(discountPercent);
    if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return null;
    return pct;
  }, [discountPercent]);

  const clearFilters = () => {
    setCategory("all");
    setType("all");
    setSaleByFrom("");
    setSaleByTo("");
    setSearchQuery("");
  };

  const handleApply = async () => {
    if (!previewDiscount) {
      toast.error("Enter a discount percent between 0 and 100 (exclusive).");
      return;
    }
    if (filtered.length === 0) {
      toast.error("No items match the current filters.");
      return;
    }

    const ok = await confirm(
      `Apply a ${previewDiscount}% one-time discount to ${filtered.length} item(s)? This permanently reduces selling price (and unit sale) for those items.`,
    );
    if (!ok) return;

    setApplying(true);
    try {
      const result = await applyItemBulkDiscount({
        itemIds: filtered.map((i) => Number(i.id)),
        discountPercent: previewDiscount,
      });
      toast.success(
        `Discounted ${result.updatedCount} of ${result.requestedCount} item(s) by ${result.discountPercent}%.`,
      );
      await load();
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to apply discount.",
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <SecondaryPageHeader
        title="One-time item discount"
        description="Filter by category, type, or sale-by date, then reduce selling price for all matching items."
        icon={<Tag className="h-5 w-5 text-white" />}
        variant="amber"
        actions={
          <Button
            onClick={() => void handleApply()}
            disabled={applying || loading || !previewDiscount || filtered.length === 0}
            className="gap-2"
          >
            <Percent className="h-4 w-4" />
            {applying ? "Applying…" : `Apply to ${filtered.length} item(s)`}
          </Button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1.5 xl:col-span-2">
            <Label htmlFor="item-search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="item-search"
                className="pl-8"
                placeholder="SKU, name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sale-from">Sale by from</Label>
            <Input
              id="sale-from"
              type="date"
              value={saleByFrom}
              onChange={(e) => setSaleByFrom(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sale-to">Sale by to</Label>
            <Input
              id="sale-to"
              type="date"
              value={saleByTo}
              onChange={(e) => setSaleByTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 w-40">
            <Label htmlFor="discount-pct">Discount %</Label>
            <Input
              id="discount-pct"
              type="number"
              min={0.01}
              max={99.99}
              step="0.01"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
          <p className="text-sm text-muted-foreground pb-2">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
            {items.length} items
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item code</TableHead>
                <TableHead>Item type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty in hand</TableHead>
                <TableHead className="text-right">Cost price</TableHead>
                <TableHead className="text-right">Selling price</TableHead>
                {previewDiscount != null && (
                  <TableHead className="text-right">After discount</TableHead>
                )}
                <TableHead>Sale by date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    Loading items…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No items match the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const selling = Number(item.sellingPrice ?? 0);
                  const after =
                    previewDiscount != null
                      ? Math.round(selling * (1 - previewDiscount / 100) * 100) / 100
                      : null;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {item.sku || "—"}
                      </TableCell>
                      <TableCell>{item.type || "—"}</TableCell>
                      <TableCell>{item.category || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyAmount amount={Number(item.costPrice ?? 0)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyAmount amount={selling} />
                      </TableCell>
                      {previewDiscount != null && (
                        <TableCell className="text-right text-emerald-700 font-medium">
                          <CurrencyAmount amount={after ?? 0} />
                        </TableCell>
                      )}
                      <TableCell>{formatDate(item.expiryDate)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {(item.status || "—").replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
