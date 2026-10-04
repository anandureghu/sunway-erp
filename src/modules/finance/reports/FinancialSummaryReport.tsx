/**
 * FIN_SHEET_REPORTS — Financial Summary sheet (HR / Stock Summary style).
 * Delete with Account Summary page, sidebar entries, and backend FinanceSheetReportService.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import {
  financeSheetReportService,
  money,
  type FinancialSummaryReport,
} from "@/service/financeSheetReportService";

const FIN = "#1E6B4F";
const FIN_DARK = "#14503B";

type SortKey = "accountCode" | "accountClass" | "opening" | "debits" | "credits" | "closing";

export default function FinancialSummaryReportView({
  onOpenAccount,
}: {
  onOpenAccount: (id: number) => void;
}) {
  const { company } = useAuth();
  const currency = company?.currency?.currencyCode ?? "";

  const [data, setData] = useState<FinancialSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cls, setCls] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("accountCode");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  useEffect(() => {
    let cancelled = false;
    financeSheetReportService
      .financialSummary()
      .then((r) => !cancelled && setData(r))
      .catch((err) =>
        toast.error(getApiErrorMessage(err, "Could not load the financial summary.")),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = data?.trialBalance ?? [];
  const classes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.accountClass))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (cls && r.accountClass !== cls) return false;
      if (q) {
        const hay = `${r.accountCode} ${r.accountName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      const x = a[sortKey] ?? "";
      const y = b[sortKey] ?? "";
      if (typeof x === "number" && typeof y === "number") return (x - y) * sortDir;
      return String(x).localeCompare(String(y)) * sortDir;
    });
  }, [rows, query, cls, sortKey, sortDir]);

  const {
    pageItems,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageCount,
    total,
  } = usePagination(filtered, 10);

  const exportCsv = () => {
    const header = [
      "Code",
      "Name",
      "Class",
      "Opening",
      "Debits",
      "Credits",
      "Closing",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = filtered.map((r) =>
      [r.accountCode, r.accountName, r.accountClass, r.opening, r.debits, r.credits, r.closing]
        .map(esc)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-summary-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <Loader2 className="h-5 w-5 animate-spin" /> Loading financial summary…
      </div>
    );
  }

  const maxRev = Math.max(1, ...(data?.revenueTrend.map((t) => t.value) ?? [1]));
  const sumDr = filtered.reduce((a, r) => a + r.debits, 0);
  const sumCr = filtered.reduce((a, r) => a + r.credits, 0);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(1);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="px-6 pb-5 pt-5 text-white sm:px-8" style={{ background: FIN }}>
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#A6D2BC]">
          <span>SFS · Financial Summary</span>
          <span>RPT-FIN-001</span>
          <span>{data?.companyName || company?.companyName || ""}</span>
          <span>{data?.periodLabel || `As at ${today}`}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">Financial Summary</h2>
            <p className="mt-1 max-w-3xl text-[13px] text-[#CBE7D9]">
              Trading result, financial position and working capital for the period, with ageing
              exceptions and the trial balance.
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
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

      <div className="flex flex-wrap text-white" style={{ background: FIN_DARK }}>
        {[
          ["Revenue", money(data?.revenue), currency],
          ["Gross margin", `${data?.grossMarginPercent ?? 0}`, "%"],
          ["Net profit", money(data?.netProfit), currency],
          ["Cash", money(data?.cashBalance), currency],
          ["Receivables", money(data?.totalReceivables), ""],
          [
            "Overdue AR",
            money(data?.overdueReceivables),
            ">60d",
            (data?.overdueReceivables ?? 0) > 0 ? "text-[#F0C98A]" : "",
          ],
          ["Payables", money(data?.totalPayables), ""],
        ].map(([label, value, unit, clsTone]) => (
          <div key={String(label)} className="min-w-[120px] flex-1 border-r border-white/10 px-5 py-3">
            <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.13em] text-[#8CC4A8]">
              {label}
            </p>
            <p className={cn("font-mono text-lg font-semibold", clsTone)}>
              {value}
              {unit ? (
                <small className="ml-1 font-sans text-[11px] font-normal text-[#BEDDCD]">{unit}</small>
              ) : null}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-7 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.3fr_0.7fr]">
          <section>
            <SectionTitle title="Profit and loss" note={currency || "Amount"} />
            <StatementTable lines={data?.profitAndLoss ?? []} />
          </section>
          <section>
            <SectionTitle title="Revenue trend" note="Period series" />
            <div className="flex h-[110px] items-end gap-1.5 pt-1.5">
              {(data?.revenueTrend ?? []).map((t, i, arr) => (
                <div key={t.yearMonth} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="font-mono text-[8.5px] font-semibold text-[#1E6B4F]">
                    {Math.round(t.value / 1000) || ""}
                  </span>
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${(t.value / maxRev) * 66}px`,
                      background: i === arr.length - 1 ? "#A9631A" : FIN,
                      opacity: 0.85,
                    }}
                  />
                  <span className="font-mono text-[8.5px] text-slate-400">{t.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <section>
            <SectionTitle title="Financial position" note={currency || "Amount"} />
            <StatementTable lines={data?.balanceSheet ?? []} />
          </section>
          <section>
            <SectionTitle title="Working capital" />
            <AgingBlock title={`Receivables — ${money(data?.arAging?.total)}`} aging={data?.arAging} />
            <div className="mt-5">
              <AgingBlock title={`Payables — ${money(data?.apAging?.total)}`} aging={data?.apAging} />
            </div>
          </section>
        </div>

        <section>
          <SectionTitle title="Exceptions requiring action" note="Ageing and control signals" />
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {["Exception", "Count", "Value", "Detail", "Owner"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "border-b border-slate-300 bg-slate-50 px-2.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400",
                      h === "Value" || h === "Count" ? "text-right" : "text-left",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.exceptions ?? []).map((e) => (
                <tr key={e.label} className="border-b border-slate-100">
                  <td className="px-2.5 py-2 font-semibold">{e.label}</td>
                  <td className="px-2.5 py-2 text-right">
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 font-mono text-[10px]",
                        e.tone === "danger"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : e.tone === "warn"
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : e.tone === "ok"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-slate-50 text-slate-500",
                      )}
                    >
                      {e.count}
                    </span>
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono text-xs">
                    {e.value ? money(e.value) : "—"}
                  </td>
                  <td className="px-2.5 py-2 font-mono text-[11.5px] text-slate-500">{e.detail}</td>
                  <td className="px-2.5 py-2 text-slate-500">{e.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <SectionTitle title="Trial balance" />
          <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search account code or name"
                className="h-8 w-56 rounded-md border border-slate-300 bg-white pl-8 pr-2 text-[13px] outline-none focus:border-[#1E6B4F]"
              />
            </div>
            <select
              value={cls}
              onChange={(e) => setCls(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[13px]"
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="ml-auto font-mono text-[11.5px] text-slate-400">
              {filtered.length} of {rows.length} accounts
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <th className="border-b border-slate-300 bg-slate-50 px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    SL. No.
                  </th>
                  {(
                    [
                      ["accountCode", "Account"],
                      ["accountClass", "Class"],
                      ["opening", "Opening"],
                      ["debits", "Debits"],
                      ["credits", "Credits"],
                      ["closing", "Closing"],
                    ] as [SortKey, string][]
                  ).map(([k, label]) => (
                    <th
                      key={k}
                      onClick={() => toggleSort(k)}
                      className={cn(
                        "cursor-pointer select-none border-b border-slate-300 bg-slate-50 px-2.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider",
                        sortKey === k ? "text-[#1E6B4F]" : "text-slate-400 hover:text-[#1E6B4F]",
                        ["opening", "debits", "credits", "closing"].includes(k)
                          ? "text-right"
                          : "text-left",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {sortKey === k &&
                          (sortDir > 0 ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r, i) => (
                  <tr
                    key={r.accountId}
                    onClick={() => onOpenAccount(r.accountId)}
                    className="cursor-pointer border-b border-slate-100 hover:bg-[#EDF6F1]"
                  >
                    <td className="px-2.5 py-2 font-mono text-xs tabular-nums text-slate-500">
                      {pageIndex * pageSize + i + 1}
                    </td>
                    <td className="px-2.5 py-2">
                      <b className="text-[#1E6B4F]">{r.accountCode}</b>
                      <div className="font-mono text-[11px] text-slate-400">{r.accountName}</div>
                    </td>
                    <td className="px-2.5 py-2">{r.accountClass}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-xs text-slate-500">
                      {money(r.opening)}
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-xs text-[#1F3A6E]">
                      {r.debits ? money(r.debits) : "—"}
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-xs text-[#8A1C36]">
                      {r.credits ? money(r.credits) : "—"}
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-xs font-semibold">
                      {money(r.closing)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-300 bg-slate-50 font-semibold">
                  <td className="px-2.5 py-2" colSpan={4}>
                    Total — {filtered.length} accounts
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono text-xs">{money(sumDr)}</td>
                  <td className="px-2.5 py-2 text-right font-mono text-xs">{money(sumCr)}</td>
                  <td className="px-2.5 py-2 text-right font-mono text-xs">
                    {Math.abs(sumDr - sumCr) < 0.01 ? "Balanced" : money(sumDr - sumCr)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="print:hidden">
              <TablePagination
                total={total}
                pageIndex={pageIndex}
                pageSize={pageSize}
                pageCount={pageCount}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          <span>RPT-FIN-001 · SFS Financial Summary</span>
          <span>Confidential — Finance &amp; Management</span>
          <span className="ml-auto">Generated {today}</span>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 border-b-[1.5px] border-[#1E6B4F] pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1E6B4F]">
      {title}
      {note && (
        <span className="ml-auto font-sans text-[11px] normal-case tracking-normal text-slate-400">
          {note}
        </span>
      )}
    </h3>
  );
}

function StatementTable({
  lines,
}: {
  lines: FinancialSummaryReport["profitAndLoss"];
}) {
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <tbody>
        {lines.map((l, i) =>
          l.header ? (
            <tr key={`${l.label}-${i}`}>
              <td
                colSpan={2}
                className="px-2 py-2 pt-3 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#1E6B4F]"
              >
                {l.label}
              </td>
            </tr>
          ) : (
            <tr
              key={`${l.label}-${i}`}
              className={cn(
                "border-b border-slate-100",
                l.total && "border-t border-slate-300 bg-slate-50 font-semibold",
              )}
            >
              <td className={cn("px-2 py-2", l.indented && "pl-6")}>{l.label}</td>
              <td className="px-2 py-2 text-right font-mono text-xs">
                {l.amount == null ? "" : money(l.amount)}
              </td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
}

function AgingBlock({
  title,
  aging,
}: {
  title: string;
  aging?: FinancialSummaryReport["arAging"] | null;
}) {
  const groups: [string, number, string][] = [
    ["Current", aging?.current ?? 0, "#1E6B4F"],
    ["1–30d", aging?.d1To30 ?? 0, "#1E6E8C"],
    ["31–60d", aging?.d31To60 ?? 0, "#A9631A"],
    ["61–90d", aging?.d61To90 ?? 0, "#C2410C"],
    ["90d+", aging?.d90Plus ?? 0, "#B4232F"],
  ];
  const total = groups.reduce((a, g) => a + g[1], 0) || 1;
  return (
    <>
      <p className="mb-1.5 text-xs text-slate-500">{title}</p>
      <div className="mb-2 flex h-6 overflow-hidden rounded">
        {groups.map(([label, n, color]) => (
          <i
            key={label}
            className="block h-full"
            style={{ width: `${(n / total) * 100}%`, background: color }}
            title={`${label}: ${money(n)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {groups.map(([label, n, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
            {label}{" "}
            <b className="font-mono text-[11.5px] text-slate-800">
              {Math.round(n / 1000)}k
            </b>
          </span>
        ))}
      </div>
    </>
  );
}
