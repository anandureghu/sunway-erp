/**
 * FIN_SHEET_REPORTS — Account Summary sheet (HR / Item Summary style).
 * Delete with Financial Summary page, sidebar entries, and backend FinanceSheetReportService.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ExternalLink, Loader2, Landmark, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import {
  financeSheetReportService,
  fmtReportDate,
  money,
  type AccountSummaryReport as Summary,
  type FinancialSummaryReport,
} from "@/service/financeSheetReportService";

const FIN = "#1E6B4F";
const FIN_DARK = "#14503B";

export default function AccountSummaryReport({
  accountId,
  onSelectAccount,
}: {
  accountId: number | null;
  onSelectAccount: (id: number | null) => void;
}) {
  const navigate = useNavigate();
  const { company } = useAuth();
  const currency = company?.currency?.currencyCode ?? "";

  const [accounts, setAccounts] = useState<FinancialSummaryReport["trialBalance"]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [code, setCode] = useState("");
  const [nameQ, setNameQ] = useState("");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDet, setShowDet] = useState(false);

  useEffect(() => {
    financeSheetReportService
      .financialSummary()
      .then((r) => setAccounts(r.trialBalance))
      .catch((err) => toast.error(getApiErrorMessage(err, "Could not load accounts.")))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!accountId) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    financeSheetReportService
      .accountSummary(accountId)
      .then((s) => !cancelled && setSummary(s))
      .catch((err) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, "Could not load the account summary."));
          setSummary(null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const matches = useMemo(() => {
    const c = code.trim().toLowerCase();
    const n = nameQ.trim().toLowerCase();
    if (!c && !n) return [];
    return accounts
      .filter(
        (a) =>
          (!c || a.accountCode.toLowerCase().includes(c)) &&
          (!n || a.accountName.toLowerCase().includes(n)),
      )
      .slice(0, 12);
  }, [accounts, code, nameQ]);

  const pick = (id: number) => {
    onSelectAccount(id);
    setCode("");
    setNameQ("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Account code
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 1210"
                className="h-9 w-44 rounded-md border border-slate-300 bg-white pl-8 pr-2 font-mono text-[13px] outline-none focus:border-[#1E6B4F]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Account name
            </label>
            <input
              value={nameQ}
              onChange={(e) => setNameQ(e.target.value)}
              placeholder="e.g. receivables"
              className="h-9 w-56 rounded-md border border-slate-300 bg-white px-2.5 text-[13px] outline-none focus:border-[#1E6B4F]"
            />
          </div>
          {summary && (
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setShowDet((v) => !v)}
                className={cn(
                  "inline-flex h-9 items-center rounded-md border px-3 text-[12.5px]",
                  showDet
                    ? "border-[#1E6B4F] bg-[#1E6B4F] font-semibold text-white"
                    : "border-slate-300 text-slate-600 hover:border-[#1E6B4F] hover:text-[#1E6B4F]",
                )}
              >
                {showDet ? "Detail shown" : "Transaction detail"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/finance/ledger")}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-[12.5px] text-slate-600 hover:border-[#1E6B4F] hover:text-[#1E6B4F]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open ledger
              </button>
              <button
                type="button"
                onClick={() => onSelectAccount(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {(code.trim() || nameQ.trim()) && (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            {loadingList ? (
              <p className="flex items-center gap-2 px-3 py-3 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </p>
            ) : matches.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-400">No account matches.</p>
            ) : (
              matches.map((a) => (
                <button
                  key={a.accountId}
                  type="button"
                  onClick={() => pick(a.accountId)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-[#EDF6F1]"
                >
                  <span className="font-mono text-[11.5px] text-slate-400">{a.accountCode}</span>
                  <span className="text-[13px] font-semibold text-slate-800">{a.accountName}</span>
                  <span className="text-[12px] text-slate-500">{a.accountClass}</span>
                  <span className="ml-auto font-mono text-[11px] text-slate-400">
                    {money(a.closing)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading account summary…
        </div>
      ) : summary ? (
        <SummarySheet s={summary} showDet={showDet} currency={currency} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Landmark className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Select an account</p>
          <p className="mt-1 text-xs text-slate-400">
            Search above, or open one from the{" "}
            <Link
              to="/finance/reports/financial-summary"
              className="font-medium text-[#1E6B4F] underline-offset-2 hover:underline"
            >
              Financial Summary
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
  showDet,
  currency,
}: {
  s: Summary;
  showDet: boolean;
  currency: string;
}) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const codeShort = (s.accountCode || "").slice(-4) || "?";
  const maxT = Math.max(1, ...s.trend.map((t) => Math.abs(t.value)));
  const tags: [string, string][] = [
    [s.active === false ? "Inactive" : "Active", "border-white/40 bg-white/10 text-white"],
    [s.accountType, "border-white/30 text-[#BEDDCD]"],
    [s.statement, "border-white/30 text-[#BEDDCD]"],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="px-6 pt-5 text-white sm:px-8" style={{ background: FIN }}>
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#A6D2BC]">
          <span>SFS · Account Summary</span>
          <span>RPT-FIN-014</span>
          <span>{s.companyName ?? ""}</span>
          <span>
            {fmtReportDate(s.from)} → {fmtReportDate(s.to)}
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-5 pb-5 pt-5">
          <div className="grid h-[72px] w-24 shrink-0 place-items-center rounded-md border border-white/25 bg-white/15 font-mono text-[22px] font-semibold">
            {codeShort}
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-[26px] font-bold leading-tight tracking-tight">
              {s.accountName}
            </h2>
            <p className="text-[14px] text-[#CBE7D9]">
              {s.accountClass} · {s.statement}
            </p>
            <p className="mt-1.5 font-mono text-[11.5px] tracking-wide text-[#A6D2BC]">
              {[
                s.accountType,
                `Normal ${s.normalBalance}`,
                currency || null,
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

      <div className="flex flex-wrap text-white" style={{ background: FIN_DARK }}>
        {[
          ["Closing balance", money(s.closing), currency],
          ["Movement this period", money(s.periodMovement), ""],
          ["Department", s.departmentName || "—", ""],
          ["Last posting", s.lastPostingLabel || "—", ""],
        ].map(([label, value, unit]) => (
          <div key={label} className="min-w-[140px] flex-1 border-r border-white/10 px-5 py-3">
            <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.13em] text-[#8CC4A8]">
              {label}
            </p>
            <p className="font-mono text-[15px] font-semibold">
              {value}
              {unit ? (
                <small className="ml-1 font-sans text-[11px] font-normal text-[#BEDDCD]">{unit}</small>
              ) : null}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-7 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Section title="Account definition">
            <Dl>
              <Row label="Account code" mono>
                {s.accountCode}
              </Row>
              <Row label="Class">{s.accountClass}</Row>
              <Row label="Type">{s.accountType}</Row>
              <Row label="Statement">{s.statement}</Row>
              <Row label="Normal balance">
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 font-mono text-[10px]",
                    s.normalBalance === "Debit"
                      ? "border-blue-200 bg-blue-50 text-[#1F3A6E]"
                      : "border-rose-200 bg-rose-50 text-[#8A1C36]",
                  )}
                >
                  {s.normalBalance}
                </span>
              </Row>
              <Row label="Currency" mono>
                {currency || "—"}
              </Row>
            </Dl>
          </Section>
          <Section title="Posting context">
            <Dl>
              <Row label="Department">{s.departmentName}</Row>
              <Row label="Project code" mono>
                {s.projectCode}
              </Row>
              <Row label="Last posting" mono>
                {s.lastPostingLabel}
              </Row>
              <Row label="Description">{s.description}</Row>
            </Dl>
          </Section>
        </div>

        <Section title="Balance trend" note="Net debit − credit by month">
          <div className="flex h-[100px] items-end gap-1.5 pt-1.5">
            {s.trend.map((t) => (
              <div key={t.yearMonth} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="font-mono text-[8.5px] font-semibold text-[#1E6B4F]">
                  {t.value ? Math.round(t.value / 1000) : ""}
                </span>
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${(Math.abs(t.value) / maxT) * 62}px`,
                    background: FIN,
                    opacity: 0.85,
                  }}
                />
                <span className="font-mono text-[8.5px] text-slate-400">{t.label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Movement — selected period">
          <table className="w-full border-collapse text-[12.5px]">
            <tbody>
              {s.movement.map((m) => (
                <tr
                  key={m.label}
                  className={cn(
                    "border-b border-slate-100",
                    m.total && "border-t border-slate-300 bg-slate-50 font-semibold",
                  )}
                >
                  <td className="px-2 py-2">{m.label}</td>
                  <td
                    className={cn(
                      "px-2 py-2 text-right font-mono text-xs",
                      m.amount < 0 && "text-[#8A1C36]",
                    )}
                  >
                    {money(m.amount)}
                  </td>
                  <td className="px-2 py-2 text-[11.5px] text-slate-400">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {s.byCostCentre.length > 0 && (
          <Section title="By cost centre">
            {s.byCostCentre.map((c) => (
              <div key={c.name} className="mb-2.5">
                <div className="mb-1 flex text-[12.5px]">
                  <b className="font-medium">{c.name}</b>
                  <span className="ml-auto font-mono text-[11.5px] text-slate-500">
                    {money(c.amount)} · {(c.share * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-slate-100">
                  <div
                    className="h-full rounded"
                    style={{ width: `${c.share * 100}%`, background: FIN }}
                  />
                </div>
              </div>
            ))}
          </Section>
        )}

        <Section title="Transaction detail" note="Toggle from the filter bar">
          {showDet ? (
            s.recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-400">No postings in this period.</p>
            ) : (
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    {["Date", "Document", "Narrative", "Debit", "Credit"].map((h) => (
                      <th
                        key={h}
                        className={cn(
                          "border-b border-slate-200 px-2 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400",
                          h === "Debit" || h === "Credit" ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.recentTransactions.map((t, i) => (
                    <tr key={`${t.code}-${i}`} className="border-b border-slate-100">
                      <td className="px-2 py-1.5 font-mono text-[11px] text-slate-500">
                        {fmtReportDate(t.date)}
                      </td>
                      <td className="px-2 py-1.5">
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 font-mono text-[10px]",
                            t.side === "Dr"
                              ? "border-blue-200 bg-blue-50 text-[#1F3A6E]"
                              : "border-rose-200 bg-rose-50 text-[#8A1C36]",
                          )}
                        >
                          {t.code || t.side}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">{t.narrative || "—"}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs text-[#1F3A6E]">
                        {t.debit ? money(t.debit) : ""}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs text-[#8A1C36]">
                        {t.credit ? money(t.credit) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-[12.5px] text-slate-500">
              <b className="mb-1 block text-slate-700">Transaction detail withheld</b>
              Toggle transaction detail above to show recent journal lines.
            </div>
          )}
        </Section>

        <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          <span>RPT-FIN-014 · SFS Account Summary</span>
          <span>Confidential — Finance</span>
          <span className="ml-auto">
            Generated {today} · {showDet ? "Includes transaction detail" : "Summary only"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-3 flex items-center gap-2 border-b-[1.5px] border-[#1E6B4F] pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1E6B4F]">
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
