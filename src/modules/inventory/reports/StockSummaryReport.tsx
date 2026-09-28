/**
 * STOCK_SHEET_REPORTS — Stock Summary sheet (HR Employee Register style).
 * Delete with Item Summary page, sidebar entries, and backend StockSheetReportService.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Loader2,
  Package,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import {
  CAT_COLORS,
  money,
  qty,
  stockSheetReportService,
  type StockSummaryReport,
  type StockSummaryRow,
} from "@/service/stockSheetReportService";

const NAVY = "#1F3A6E";
const NAVY_DARK = "#16294E";
const NON_MOVING = 180;

type SortKey =
  | "sku"
  | "category"
  | "unitMeasure"
  | "tracking"
  | "onHand"
  | "reorderLevel"
  | "avgCost"
  | "stockValue"
  | "lastIssueDays"
  | "abc";

type StatusFilter = "" | "below" | "nonmoving" | "expiring" | "zero";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "below", label: "Below reorder" },
  { value: "zero", label: "Out of stock" },
  { value: "nonmoving", label: "Non-moving" },
  { value: "expiring", label: "Expiring batches" },
];

function statusOf(r: StockSummaryRow): [string, string] {
  if (r.onHand === 0) return ["Out of stock", "border-rose-200 bg-rose-50 text-rose-700"];
  if (r.reorderLevel != null && r.onHand < r.reorderLevel)
    return ["Below reorder", "border-amber-200 bg-amber-50 text-amber-800"];
  if (r.lastIssueDays != null && r.lastIssueDays >= NON_MOVING)
    return ["Non-moving", "border-amber-200 bg-amber-50 text-amber-800"];
  if (r.expiringBatch) return ["Batch expiring", "border-rose-200 bg-rose-50 text-rose-700"];
  return ["In range", "border-emerald-200 bg-emerald-50 text-emerald-800"];
}

export default function StockSummaryReport({
  onOpenItem,
}: {
  onOpenItem: (id: number) => void;
}) {
  const { company } = useAuth();
  const currency = company?.currency?.currencyCode ?? "";

  const [data, setData] = useState<StockSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCost, setShowCost] = useState(true);

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [sortKey, setSortKey] = useState<SortKey>("category");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  useEffect(() => {
    let cancelled = false;
    stockSheetReportService
      .stockSummary()
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((err) => toast.error(getApiErrorMessage(err, "Could not load the stock summary.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = data?.rows ?? [];
  const categories = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.category || "Uncategorized"))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [rows],
  );
  const catColor = (name: string) =>
    CAT_COLORS[Math.max(categories.indexOf(name), 0) % CAT_COLORS.length];

  const mask = (v: number) => (showCost ? money(v) : "·····");

  const abcSplit = useMemo(() => {
    const a = rows.filter((r) => r.abc === "A").length;
    const b = rows.filter((r) => r.abc === "B").length;
    const c = rows.filter((r) => r.abc === "C").length;
    return [
      ["A", a, "#1E6B4F"],
      ["B", b, "#1E6E8C"],
      ["C", c, "#98A3B5"],
    ] as [string, number, string][];
  }, [rows]);

  const ageSplit = useMemo(() => {
    const g = [0, 0, 0, 0];
    rows.forEach((r) => {
      const d = r.lastIssueDays;
      if (d == null) g[3]++;
      else if (d <= 30) g[0]++;
      else if (d <= 90) g[1]++;
      else if (d <= 180) g[2]++;
      else g[3]++;
    });
    return [
      ["Within 30 days", g[0], "#1E6B4F"],
      ["31–90 days", g[1], "#1E6E8C"],
      ["91–180 days", g[2], "#A9631A"],
      ["Over 180 days / never", g[3], "#B4232F"],
    ] as [string, number, string][];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (cat && r.category !== cat) return false;
      if (statusFilter === "below" && !(r.reorderLevel != null && r.onHand < r.reorderLevel))
        return false;
      if (statusFilter === "zero" && r.onHand !== 0) return false;
      if (
        statusFilter === "nonmoving" &&
        !(r.lastIssueDays != null && r.lastIssueDays >= NON_MOVING)
      )
        return false;
      if (statusFilter === "expiring" && !r.expiringBatch) return false;
      if (q) {
        const hay = [r.sku, r.name, r.brand, r.category].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      const val = (r: StockSummaryRow): string | number => {
        switch (sortKey) {
          case "onHand":
          case "avgCost":
          case "stockValue":
            return r[sortKey] ?? 0;
          case "reorderLevel":
            return r.reorderLevel ?? -1;
          case "lastIssueDays":
            return r.lastIssueDays ?? 99999;
          default:
            return String(r[sortKey] ?? "");
        }
      };
      const x = val(a);
      const y = val(b);
      if (typeof x === "number" && typeof y === "number") return (x - y) * sortDir;
      return String(x).localeCompare(String(y)) * sortDir;
    });
  }, [rows, query, cat, statusFilter, sortKey, sortDir]);

  const shownValue = useMemo(
    () => filtered.reduce((a, r) => a + (r.stockValue ?? 0), 0),
    [filtered],
  );

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(1);
    }
  };

  const exportCsv = () => {
    const header = [
      "SKU",
      "Name",
      "Category",
      "UOM",
      "Tracking",
      "On hand",
      "Reorder",
      ...(showCost ? ["Avg cost", `Value (${currency || "cost"})`] : []),
      "Last issue (days)",
      "ABC",
      "Status",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = filtered.map((r) => {
      const [st] = statusOf(r);
      return [
        r.sku,
        r.name,
        r.category,
        r.unitMeasure,
        r.tracking,
        r.onHand,
        r.reorderLevel ?? "",
        ...(showCost ? [r.avgCost, r.stockValue] : []),
        r.lastIssueDays ?? "",
        r.abc,
        st,
      ]
        .map(esc)
        .join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading stock summary…
      </div>
    );
  }

  const maxCat = Math.max(1, ...(data?.byCategory.map((c) => c.valueAtCost) ?? [1]));

  const SortTh = ({
    k,
    label,
    className,
  }: {
    k: SortKey;
    label: string;
    className?: string;
  }) => (
    <th
      onClick={() => toggleSort(k)}
      className={cn(
        "cursor-pointer select-none whitespace-nowrap border-b border-slate-300 bg-slate-50 px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider",
        sortKey === k ? "text-[#1F3A6E]" : "text-slate-400 hover:text-[#1F3A6E]",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k &&
          (sortDir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </span>
    </th>
  );

  const exceptions = [
    {
      label: "Below reorder point",
      count: data?.belowReorderCount ?? 0,
      items: rows
        .filter((r) => r.reorderLevel != null && r.onHand < r.reorderLevel)
        .map((r) => r.sku),
      owner: "Buyer",
      tone: "warn" as const,
    },
    {
      label: "Out of stock",
      count: data?.outOfStockCount ?? 0,
      items: rows.filter((r) => r.onHand === 0).map((r) => r.sku),
      owner: "Buyer",
      tone: "dgr" as const,
    },
    {
      label: "Non-moving over 180 days",
      count: data?.nonMovingCount ?? 0,
      items: rows
        .filter((r) => r.lastIssueDays != null && r.lastIssueDays >= NON_MOVING)
        .map((r) => r.sku),
      owner: "Inventory Manager",
      tone: "warn" as const,
    },
    {
      label: "Batches expiring within 90 days",
      count: data?.expiringBatchCount ?? 0,
      items: rows.filter((r) => r.expiringBatch).map((r) => r.sku),
      owner: "Storekeeper",
      tone: "dgr" as const,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="px-6 pb-5 pt-5 text-white sm:px-8" style={{ background: NAVY }}>
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9FB4D8]">
          <span>SIMS · Stock Summary</span>
          <span>RPT-INV-001</span>
          <span>{data?.companyName || company?.companyName || ""}</span>
          <span>As at {today}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">Stock Summary</h2>
            <p className="mt-1 max-w-3xl text-[13px] text-[#C9D7EE]">
              All stocked items across every warehouse, with valuation, movement ageing and the
              exceptions requiring action before month-end close.
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setShowCost((v) => !v)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs",
                showCost
                  ? "border-white bg-white font-semibold text-[#1F3A6E]"
                  : "border-white/30 hover:bg-white/15",
              )}
            >
              {showCost ? "Cost data shown" : "Cost data"}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/30 px-3 text-xs hover:bg-white/15"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/30 px-3 text-xs hover:bg-white/15"
            >
              Print / PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap text-white" style={{ background: NAVY_DARK }}>
        {[
          ["Active SKUs", rows.length, ""],
          ["Stock value", showCost ? money(data?.totalStockValue) : "·····", showCost ? currency : ""],
          [
            "Below reorder",
            data?.belowReorderCount ?? 0,
            "",
            (data?.belowReorderCount ?? 0) ? "text-[#F0C98A]" : "",
          ],
          [
            "Out of stock",
            data?.outOfStockCount ?? 0,
            "",
            (data?.outOfStockCount ?? 0) ? "text-[#F2A9B2]" : "",
          ],
          [
            "Non-moving 180d",
            data?.nonMovingCount ?? 0,
            "",
            (data?.nonMovingCount ?? 0) ? "text-[#F0C98A]" : "",
          ],
          [
            "Expiring batches",
            data?.expiringBatchCount ?? 0,
            "≤90d",
            (data?.expiringBatchCount ?? 0) ? "text-[#F2A9B2]" : "",
          ],
        ].map(([label, value, unit, cls]) => (
          <div key={String(label)} className="min-w-[120px] flex-1 border-r border-white/10 px-5 py-3">
            <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.13em] text-[#8FA5CC]">
              {label}
            </p>
            <p className={cn("text-lg font-semibold", cls)}>
              {value}
              {unit ? (
                <small className="ml-1 text-[11px] font-normal text-[#B9C7E2]">{unit}</small>
              ) : null}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-7 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.25fr_0.75fr]">
          <section>
            <SectionTitle title="Value by category" note={showCost ? "By stock value" : "Cost hidden"} />
            {(data?.byCategory.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-400">No stock categories yet.</p>
            ) : (
              <div className="space-y-2.5">
                {data!.byCategory.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex items-baseline gap-2 text-[12.5px]">
                      <span className="inline-flex items-center gap-1.5">
                        <i
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: catColor(c.category) }}
                        />
                        <b className="font-medium">{c.category}</b>
                      </span>
                      <span className="ml-auto font-mono text-[11.5px] text-slate-500">
                        {c.skuCount} SKUs
                        {showCost
                          ? ` · ${currency} ${money(c.valueAtCost)} · ${
                              (data?.totalStockValue ?? 0) > 0
                                ? ((c.valueAtCost / (data?.totalStockValue ?? 1)) * 100).toFixed(0)
                                : 0
                            }%`
                          : " · ·····"}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-slate-100">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${showCost ? (c.valueAtCost / maxCat) * 100 : 4}%`,
                          background: catColor(c.category),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle title="Composition" />
            <p className="mb-1.5 text-xs text-slate-500">ABC classification — by stock value</p>
            <SplitBar groups={abcSplit} />
            <p className="mb-1.5 mt-5 text-xs text-slate-500">Movement age — last issue</p>
            <SplitBar groups={ageSplit} />
          </section>
        </div>

        <section>
          <SectionTitle title="Exceptions requiring action" note="Before month-end close" />
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className="w-[220px] border-b border-slate-300 bg-slate-50 px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Exception
                </th>
                <th className="w-[70px] border-b border-slate-300 bg-slate-50 px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Count
                </th>
                <th className="border-b border-slate-300 bg-slate-50 px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Items
                </th>
                <th className="w-[140px] border-b border-slate-300 bg-slate-50 px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((ex) => {
                const pill =
                  ex.count === 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : ex.tone === "dgr"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-amber-200 bg-amber-50 text-amber-800";
                const names =
                  ex.items.slice(0, 8).join(", ") +
                  (ex.items.length > 8 ? ` and ${ex.items.length - 8} more` : "");
                return (
                  <tr key={ex.label} className="border-b border-slate-100 last:border-0">
                    <td className="px-2.5 py-2 font-semibold">{ex.label}</td>
                    <td className="px-2.5 py-2">
                      <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px]", pill)}>
                        {ex.count}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 font-mono text-[11.5px] text-slate-500">
                      {names || <span className="text-slate-300">None</span>}
                    </td>
                    <td className="px-2.5 py-2 text-slate-500">{ex.owner}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section>
          <SectionTitle title="Valuation by warehouse" note={showCost ? undefined : "Cost hidden"} />
          {!showCost ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-[12.5px] text-slate-500">
              <b className="mb-1 block text-slate-700">Valuation withheld</b>
              Toggle cost data above to show warehouse values.
            </div>
          ) : (
            <>
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    {["Warehouse", "Type", "SKUs held", `Value (${currency || "cost"})`, "Share"].map(
                      (h) => (
                        <th
                          key={h}
                          className={cn(
                            "border-b border-slate-300 bg-slate-50 px-2.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400",
                            h.startsWith("Value") || h === "Share" || h === "SKUs held"
                              ? "text-right"
                              : "text-left",
                          )}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(data?.byWarehouse ?? []).map((w) => (
                    <tr key={w.warehouseId} className="border-b border-slate-100">
                      <td className="px-2.5 py-2 font-semibold">{w.warehouseName}</td>
                      <td className="px-2.5 py-2">
                        <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                          {w.warehouseType || "Store"}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 text-right font-mono text-xs">{w.skuCount}</td>
                      <td className="px-2.5 py-2 text-right font-mono text-xs">{money(w.valueAtCost)}</td>
                      <td className="px-2.5 py-2 text-right font-mono text-xs">
                        {(w.share * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-300 bg-slate-50 font-semibold">
                    <td className="px-2.5 py-2">Total</td>
                    <td />
                    <td className="px-2.5 py-2 text-right font-mono text-xs">{rows.length}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-xs">
                      {money(data?.totalStockValue)}
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-xs">100%</td>
                  </tr>
                </tbody>
              </table>
              {(data?.nonMovingValue ?? 0) > 0 && (
                <p className="mt-2.5 font-mono text-[11.5px] text-slate-400">
                  Non-moving stock of {currency} {money(data?.nonMovingValue)} (
                  {(data?.totalStockValue ?? 0) > 0
                    ? (((data?.nonMovingValue ?? 0) / (data?.totalStockValue ?? 1)) * 100).toFixed(1)
                    : "0"}
                  % of value) is write-down exposure at year end.
                </p>
              )}
            </>
          )}
        </section>

        <section>
          <SectionTitle title="Stock register" />
          <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search code, description or brand"
                className="h-8 w-56 rounded-md border border-slate-300 bg-white pl-8 pr-2 text-[13px] outline-none focus:border-[#1F3A6E]"
              />
            </div>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[13px] outline-none focus:border-[#1F3A6E]"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value || "all"}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "h-8 rounded-md border px-2.5 text-[12.5px]",
                  statusFilter === f.value
                    ? "border-[#1F3A6E] bg-[#1F3A6E] text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-[#1F3A6E] hover:text-[#1F3A6E]",
                )}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto font-mono text-[11.5px] text-slate-400">
              {filtered.length} of {rows.length} items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <SortTh k="sku" label="Item" />
                  <SortTh k="category" label="Category" />
                  <SortTh k="unitMeasure" label="UOM" />
                  <SortTh k="tracking" label="Tracking" />
                  <SortTh k="onHand" label="On hand" className="text-right" />
                  <SortTh k="reorderLevel" label="Reorder" className="text-right" />
                  <SortTh k="avgCost" label="Avg cost" className="text-right" />
                  <SortTh k="stockValue" label="Value" className="text-right" />
                  <SortTh k="lastIssueDays" label="Last issue" />
                  <SortTh k="abc" label="ABC" />
                  <th className="border-b border-slate-300 bg-slate-50 px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-2.5 py-8 text-center text-slate-400">
                      <Package className="mx-auto mb-1 h-5 w-5 opacity-40" />
                      No items match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const [st, stCls] = statusOf(r);
                    const below = r.reorderLevel != null && r.onHand < r.reorderLevel;
                    return (
                      <tr
                        key={r.itemId}
                        onClick={() => onOpenItem(r.itemId)}
                        className="cursor-pointer border-b border-slate-100 hover:bg-[#EEF2F9]"
                      >
                        <td className="px-2.5 py-2">
                          <b className="text-[#1F3A6E]">{r.sku}</b>
                          <div className="max-w-[230px] font-mono text-[11px] text-slate-400">
                            {r.name}
                          </div>
                        </td>
                        <td className="px-2.5 py-2">
                          <span className="inline-flex items-center gap-1.5">
                            <i
                              className="inline-block h-1.5 w-1.5 rounded-full"
                              style={{ background: catColor(r.category) }}
                            />
                            {r.category}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 font-mono text-[11.5px] text-slate-500">
                          {r.unitMeasure}
                        </td>
                        <td className="px-2.5 py-2 font-mono text-[11.5px] text-slate-500">
                          {r.tracking}
                        </td>
                        <td
                          className={cn(
                            "px-2.5 py-2 text-right font-mono text-xs",
                            below && "font-semibold text-rose-700",
                          )}
                        >
                          {qty(r.onHand)}
                        </td>
                        <td className="px-2.5 py-2 text-right font-mono text-xs text-slate-400">
                          {r.reorderLevel != null ? qty(r.reorderLevel) : "—"}
                        </td>
                        <td className="px-2.5 py-2 text-right font-mono text-xs">{mask(r.avgCost)}</td>
                        <td className="px-2.5 py-2 text-right font-mono text-xs">
                          {mask(r.stockValue)}
                        </td>
                        <td
                          className={cn(
                            "px-2.5 py-2 text-right font-mono text-xs",
                            r.lastIssueDays != null && r.lastIssueDays >= NON_MOVING
                              ? "text-amber-700"
                              : "text-slate-400",
                          )}
                        >
                          {r.lastIssueDays != null ? `${r.lastIssueDays}d` : "—"}
                        </td>
                        <td className="px-2.5 py-2">
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 font-mono text-[10px]",
                              r.abc === "A"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : r.abc === "B"
                                  ? "border-sky-200 bg-sky-50 text-sky-800"
                                  : "border-slate-200 bg-slate-50 text-slate-500",
                            )}
                          >
                            {r.abc}
                          </span>
                        </td>
                        <td className="px-2.5 py-2">
                          <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px]", stCls)}>
                            {st}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-300 bg-slate-50 font-semibold">
                  <td className="px-2.5 py-2" colSpan={7}>
                    Total — {filtered.length} items shown
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono text-xs">{mask(shownValue)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          <span>RPT-INV-001 · SIMS Stock Summary</span>
          <span>Internal — Inventory &amp; Finance</span>
          <span className="ml-auto">
            Generated {today} · {showCost ? "Includes cost data" : "Cost data withheld"}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 border-b-[1.5px] border-[#1F3A6E] pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1F3A6E]">
      {title}
      {note && (
        <span className="ml-auto font-sans text-[11px] normal-case tracking-normal text-slate-400">
          {note}
        </span>
      )}
    </h3>
  );
}

function SplitBar({ groups }: { groups: [string, number, string][] }) {
  const total = groups.reduce((a, g) => a + g[1], 0) || 1;
  return (
    <>
      <div className="mb-2 flex h-6 overflow-hidden rounded">
        {groups.map(([label, n, color]) => (
          <i
            key={label}
            title={`${label}: ${n}`}
            className="block h-full"
            style={{ width: `${(n / total) * 100}%`, background: color }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {groups.map(([label, n, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
            {label} <b className="font-mono text-[11.5px] text-slate-800">{n}</b>
          </span>
        ))}
      </div>
    </>
  );
}
