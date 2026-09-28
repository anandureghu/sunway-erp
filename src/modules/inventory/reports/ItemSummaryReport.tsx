/**
 * STOCK_SHEET_REPORTS — Item Summary sheet (HR Employee Summary style).
 * Delete with Stock Summary page, sidebar entries, and backend StockSheetReportService.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ExternalLink, Loader2, Package, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import {
  fmtReportDate,
  money,
  qty,
  stockSheetReportService,
  type ItemSummaryReport as Summary,
  type StockSummaryRow,
} from "@/service/stockSheetReportService";

const NAVY = "#1F3A6E";
const NAVY_DARK = "#16294E";

export default function ItemSummaryReport({
  itemId,
  onSelectItem,
}: {
  itemId: number | null;
  onSelectItem: (id: number | null) => void;
}) {
  const navigate = useNavigate();
  const { company } = useAuth();
  const currency = company?.currency?.currencyCode ?? "";

  const [people, setPeople] = useState<StockSummaryRow[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [code, setCode] = useState("");
  const [nameQ, setNameQ] = useState("");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCost, setShowCost] = useState(true);

  useEffect(() => {
    stockSheetReportService
      .stockSummary()
      .then((r) => setPeople(r.rows))
      .catch((err) => toast.error(getApiErrorMessage(err, "Could not load items.")))
      .finally(() => setLoadingPeople(false));
  }, []);

  useEffect(() => {
    if (!itemId) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    stockSheetReportService
      .itemSummary(itemId)
      .then((s) => !cancelled && setSummary(s))
      .catch((err) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, "Could not load the item summary."));
          setSummary(null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const matches = useMemo(() => {
    const c = code.trim().toLowerCase();
    const n = nameQ.trim().toLowerCase();
    if (!c && !n) return [];
    return people
      .filter(
        (p) =>
          (!c || (p.sku ?? "").toLowerCase().includes(c)) &&
          (!n || (p.name ?? "").toLowerCase().includes(n)),
      )
      .slice(0, 12);
  }, [people, code, nameQ]);

  const pick = (id: number) => {
    onSelectItem(id);
    setCode("");
    setNameQ("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Item code
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SP-1042"
                className="h-9 w-44 rounded-md border border-slate-300 bg-white pl-8 pr-2 font-mono text-[13px] outline-none focus:border-[#1F3A6E]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Description
            </label>
            <input
              value={nameQ}
              onChange={(e) => setNameQ(e.target.value)}
              placeholder="e.g. air filter"
              className="h-9 w-56 rounded-md border border-slate-300 bg-white px-2.5 text-[13px] outline-none focus:border-[#1F3A6E]"
            />
          </div>
          {summary && (
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setShowCost((v) => !v)}
                className={cn(
                  "inline-flex h-9 items-center rounded-md border px-3 text-[12.5px]",
                  showCost
                    ? "border-[#1F3A6E] bg-[#1F3A6E] font-semibold text-white"
                    : "border-slate-300 text-slate-600 hover:border-[#1F3A6E] hover:text-[#1F3A6E]",
                )}
              >
                {showCost ? "Cost data shown" : "Cost data"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/inventory/stocks/${summary.itemId}`)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-[12.5px] text-slate-600 hover:border-[#1F3A6E] hover:text-[#1F3A6E]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open item
              </button>
              <button
                type="button"
                onClick={() => onSelectItem(null)}
                title="Clear"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {(code.trim() || nameQ.trim()) && (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            {loadingPeople ? (
              <p className="flex items-center gap-2 px-3 py-3 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </p>
            ) : matches.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-400">No item matches.</p>
            ) : (
              matches.map((p) => (
                <button
                  key={p.itemId}
                  type="button"
                  onClick={() => pick(p.itemId)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-[#EEF2F9]"
                >
                  <span className="font-mono text-[11.5px] text-slate-400">{p.sku}</span>
                  <span className="text-[13px] font-semibold text-slate-800">{p.name}</span>
                  <span className="text-[12px] text-slate-500">{p.category}</span>
                  <span className="ml-auto font-mono text-[11px] text-slate-400">
                    {qty(p.onHand)} on hand
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading item summary…
        </div>
      ) : summary ? (
        <SummarySheet s={summary} showCost={showCost} currency={currency} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Select an item</p>
          <p className="mt-1 text-xs text-slate-400">
            Search by code or description above, or open one from the{" "}
            <Link
              to="/inventory/reports/stock-summary"
              className="font-medium text-[#1F3A6E] underline-offset-2 hover:underline"
            >
              Stock Summary
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

function SummarySheet({
  s,
  showCost,
  currency,
}: {
  s: Summary;
  showCost: boolean;
  currency: string;
}) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const icon =
    (s.sku || "")
      .split("-")
      .slice(0, 2)
      .join("\n") || "?";
  const maxWh = Math.max(1, ...s.warehouses.map((w) => w.maximum || w.onHand || 0));
  const tags: [string, string][] = [
    [s.status || "Active", "border-white/40 bg-white/10 text-white"],
    [`ABC ${s.abc}`, "border-white/30 text-[#B9C7E2]"],
    [`${s.tracking} tracked`, "border-white/30 text-[#B9C7E2]"],
    ...(s.expiringBatch
      ? ([["Batch expiring", "border-[#F2A9B2]/60 text-[#F2A9B2]"]] as [string, string][])
      : []),
    ...(s.warehouses.some((w) => w.belowReorder)
      ? ([["Below reorder", "border-[#F0C98A]/60 text-[#F0C98A]"]] as [string, string][])
      : []),
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="px-6 pt-5 text-white sm:px-8" style={{ background: NAVY }}>
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9FB4D8]">
          <span>SIMS · Item Summary</span>
          <span>RPT-INV-014</span>
          <span>{s.companyName ?? ""}</span>
          <span>As at {today}</span>
        </div>
        <div className="flex flex-wrap items-end gap-5 pb-5 pt-5">
          <div className="grid h-[72px] w-[72px] shrink-0 place-items-center whitespace-pre-line rounded-md border border-white/25 bg-white/15 text-center font-mono text-[13px] font-semibold leading-tight">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="max-w-[28ch] font-serif text-[26px] font-bold leading-tight tracking-tight">
              {s.name}
            </h2>
            <p className="text-[14px] text-[#C9D7EE]">
              {[s.category, s.brand].filter(Boolean).join(" · ") || "Uncategorized"}
            </p>
            <p className="mt-1.5 font-mono text-[11.5px] tracking-wide text-[#9FB4D8]">
              {[
                s.sku,
                s.unitMeasure,
                `${s.tracking} tracked`,
                `ABC ${s.abc}`,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
          </div>
          <div className="ml-auto flex max-w-xs flex-wrap justify-end gap-1.5">
            {tags.map(([t, cls]) => (
              <span
                key={t}
                className={cn("rounded border px-2 py-0.5 font-mono text-[10px] tracking-wide", cls)}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap text-white" style={{ background: NAVY_DARK }}>
        {[
          ["On hand", `${qty(s.onHand)}`, s.unitMeasure.toLowerCase()],
          ["Stock value", showCost ? `${currency} ${money(s.stockValue)}`.trim() : "·····", ""],
          ["Tracking", s.tracking, ""],
          [
            "Lead time",
            s.leadTimeDays != null ? `${s.leadTimeDays} days` : "—",
            "",
          ],
          [
            "Last issue",
            s.lastIssueDays != null ? `${s.lastIssueDays}d ago` : "—",
            "",
          ],
        ].map(([label, value, unit]) => (
          <div key={label} className="min-w-[132px] flex-1 border-r border-white/10 px-5 py-3">
            <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.13em] text-[#8FA5CC]">
              {label}
            </p>
            <p className="text-[15px] font-semibold">
              {value}
              {unit ? (
                <small className="ml-1 text-[11px] font-normal text-[#B9C7E2]">{unit}</small>
              ) : null}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-7 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Section title="Identification">
            <Dl>
              <Row label="Item code" mono>
                {s.sku}
              </Row>
              <Row label="Item type">{s.type}</Row>
              <Row label="Category">{s.category}</Row>
              <Row label="Sub-category">{s.subCategory}</Row>
              <Row label="Brand">{s.brand}</Row>
              <Row label="Manufacturer part" mono>
                {s.manufacturerPartNumber}
              </Row>
              <Row label="Model" mono>
                {s.model}
              </Row>
              <Row label="Barcode" mono>
                {s.barcode}
              </Row>
              <Row label="Serial no." mono>
                {s.serialNo}
              </Row>
            </Dl>
          </Section>

          <Section title="Units, tax and reorder">
            <Dl>
              <Row label="Base unit">{s.unitMeasure}</Row>
              <Row label="HS / HSN code" mono>
                {s.hsnCode}
              </Row>
              <Row label="VAT applicable">
                {s.vatApplicable == null ? null : s.vatApplicable ? "Yes" : "No"}
              </Row>
              <Row label="Reorder level" mono>
                {s.reorderLevel != null ? qty(s.reorderLevel) : null}
              </Row>
              <Row label="Reorder qty" mono>
                {s.reorderQty != null ? qty(s.reorderQty) : null}
              </Row>
              <Row label="Min / Max" mono>
                {s.minimum != null || s.maximum != null
                  ? `${s.minimum ?? "—"} / ${s.maximum ?? "—"}`
                  : null}
              </Row>
              <Row label="Lead time">
                {s.leadTimeDays != null ? `${s.leadTimeDays} days` : null}
              </Row>
              <Row label="Criticality">{s.criticality}</Row>
            </Dl>
          </Section>
        </div>

        <Section title="Stock by location" note="Red marker shows the reorder point">
          {s.warehouses.length === 0 ? (
            <p className="text-sm text-slate-400">No warehouse stock rows for this item.</p>
          ) : (
            <div className="space-y-3">
              {s.warehouses.map((w) => {
                const max = Math.max(w.maximum || 0, w.onHand, w.reorderLevel || 0, 1);
                const pct = Math.min(100, (w.onHand / maxWh) * 100);
                const roPct =
                  w.reorderLevel != null ? Math.min(100, (w.reorderLevel / max) * 100) : null;
                return (
                  <div key={w.warehouseId ?? w.warehouseName}>
                    <div className="mb-1 flex items-baseline gap-2 text-[12.5px]">
                      <b className="font-medium">{w.warehouseName}</b>
                      <span className="ml-auto font-mono text-[11.5px] text-slate-500">
                        {qty(w.onHand)}
                        {w.reorderLevel != null ? ` · reorder at ${w.reorderLevel}` : ""}
                        {w.belowReorder ? (
                          <span className="ml-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] text-rose-700">
                            below
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded bg-slate-100">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${pct}%`,
                          background: w.belowReorder ? "#B4232F" : NAVY,
                        }}
                      />
                      {roPct != null && (
                        <span
                          className="absolute top-[-2px] bottom-[-2px] w-[1.5px] bg-rose-600"
                          style={{ left: `${roPct}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Cost and valuation" note="Toggle from the filter bar">
          {showCost ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Dl>
                <Row label="Moving average" mono>
                  {`${currency} ${money(s.avgCost)}`.trim()}
                </Row>
                <Row label="Last purchase cost" mono>
                  {`${currency} ${money(s.lastPurchaseCost)}`.trim()}
                </Row>
                <Row label="List price" mono>
                  {s.listPrice != null ? `${currency} ${money(s.listPrice)}`.trim() : null}
                </Row>
                <Row label="Selling price" mono>
                  {s.sellingPrice != null ? `${currency} ${money(s.sellingPrice)}`.trim() : null}
                </Row>
                <Row label="Stock value" mono>
                  <span className="font-semibold">{`${currency} ${money(s.stockValue)}`.trim()}</span>
                </Row>
              </Dl>
              <Dl>
                <Row label="Preferred vendor">{s.preferredVendorName}</Row>
                <Row label="Supplier part" mono>
                  {s.supplierPartNo}
                </Row>
                <Row label="Reserved" mono>
                  {qty(s.reserved)}
                </Row>
                <Row label="Available" mono>
                  {qty(s.available)}
                </Row>
              </Dl>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-[12.5px] text-slate-500">
              <b className="mb-1 block text-slate-700">Cost and valuation withheld</b>
              Toggle cost data above to reveal unit cost and stock value.
            </div>
          )}
        </Section>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Section title="Movement totals — recent">
            <table className="w-full border-collapse text-[12.5px]">
              <tbody>
                {s.movementTotals.map((m, i) => {
                  const last = i === s.movementTotals.length - 1;
                  return (
                    <tr
                      key={m.label}
                      className={cn(
                        "border-b border-slate-100 last:border-0",
                        last && "border-t border-slate-300 bg-slate-50 font-semibold",
                      )}
                    >
                      <td className="px-2 py-2">{m.label}</td>
                      <td
                        className={cn(
                          "px-2 py-2 text-right font-mono text-xs",
                          m.quantity < 0 && "text-rose-700",
                        )}
                      >
                        {qty(m.quantity)}
                      </td>
                      <td className="px-2 py-2 text-[11.5px] text-slate-400">{m.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>

          <Section title="Recent movements">
            {s.recentMovements.length === 0 ? (
              <p className="text-sm text-slate-400">No batch movements recorded yet.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr>
                      {["When", "Type", "Qty", "Batch"].map((h) => (
                        <th
                          key={h}
                          className="border-b border-slate-200 px-2 py-1.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.recentMovements.slice(0, 20).map((m, i) => (
                      <tr key={`${m.at}-${i}`} className="border-b border-slate-100 last:border-0">
                        <td className="px-2 py-1.5 font-mono text-[11px] text-slate-500">
                          {fmtReportDate(m.at)}
                        </td>
                        <td className="px-2 py-1.5">{m.movementType}</td>
                        <td
                          className={cn(
                            "px-2 py-1.5 text-right font-mono text-xs",
                            m.quantity < 0 && "text-rose-700",
                          )}
                        >
                          {qty(m.quantity)}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-[11px] text-slate-500">
                          {m.batchNo || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        <Section title="Batches on hand">
          {s.batches.length === 0 ? (
            <p className="text-sm text-slate-400">No on-hand batch layers for this item.</p>
          ) : (
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  {["Batch", "Received", "Expiry", "Warehouse", "Qty", showCost ? "Unit cost" : null]
                    .filter(Boolean)
                    .map((h) => (
                      <th
                        key={h!}
                        className={cn(
                          "border-b border-slate-200 px-2.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400",
                          h === "Qty" || h === "Unit cost" ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {s.batches.map((b) => (
                  <tr key={`${b.batchNo}-${b.warehouseName}`} className="border-b border-slate-100">
                    <td className="px-2.5 py-2 font-mono text-[12px] font-semibold">{b.batchNo}</td>
                    <td className="px-2.5 py-2 text-slate-500">{fmtReportDate(b.receivedAt)}</td>
                    <td className="px-2.5 py-2">
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 font-mono text-[10px]",
                          b.expiryTone === "danger"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : b.expiryTone === "warn"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800",
                        )}
                      >
                        {b.expiryDate ? fmtReportDate(b.expiryDate) : "No expiry"}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-slate-500">{b.warehouseName}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-xs">
                      {qty(b.quantityOnHand)}
                    </td>
                    {showCost && (
                      <td className="px-2.5 py-2 text-right font-mono text-xs">
                        {money(b.unitCost)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {(s.description || s.remarks) && (
          <Section title="Notes">
            <p className="m-0 max-w-[88ch] text-[13px] leading-relaxed text-slate-700">
              {s.description || s.remarks}
            </p>
          </Section>
        )}

        <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          <span>RPT-INV-014 · SIMS Item Summary</span>
          <span>Internal — Inventory &amp; Finance</span>
          <span className="ml-auto">
            Generated {today} · {showCost ? "Includes cost data" : "Cost data withheld"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-3 flex items-center gap-2 border-b-[1.5px] border-[#1F3A6E] pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1F3A6E]">
        {title}
        {note && (
          <span className="ml-auto font-sans text-[11px] normal-case tracking-normal text-slate-400">
            {note}
          </span>
        )}
      </h3>
      {children}
    </section>
  );
}

function Dl({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-[13px]">{children}</dl>;
}

function Row({ label, mono, children }: { label: string; mono?: boolean; children: ReactNode }) {
  const empty = children == null || children === "" || children === "—";
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={cn(
          "m-0 break-words font-medium",
          mono && "font-mono text-[12.5px] font-normal",
          empty && "text-slate-300",
        )}
      >
        {empty ? "—" : children}
      </dd>
    </>
  );
}
