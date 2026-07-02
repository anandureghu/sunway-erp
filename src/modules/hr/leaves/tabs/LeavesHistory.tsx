import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { leaveService } from "@/service/leaveService";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Search,
  Wallet,
  Download,
  Pencil,
  LogIn,
  CalendarCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

type Row = {
  id: number;
  leaveCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  dateReported: string;
  returnDate: string;
  leaveBalance: string | number;
  leaveStatus: string;
  totalDays: number;
  includeWeekends: boolean;
  supportingDocumentUrl: string;
};

/** Safely extract an array from any API response shape.
 *  Handles all shapes the EmployeeLeaveController can return:
 *    { leaves: [...] }     ← GET /employees/{id}/leaves
 *    { history: [...] }    ← GET /employees/{id}/leaves/history
 *    [...]                 ← plain array
 *    { content: [...] }    ← Spring Page
 *    { data: [...] }       ← generic wrapper
 */
/** Normalize a backend leave status (e.g. "PENDING") to title case so it
 *  matches STATUS_META keys and the Pending/Approved/Rejected comparisons. */
function normalizeStatus(s: unknown): string {
  const v = String(s ?? "")
    .trim()
    .toUpperCase();
  if (v === "APPROVED") return "Approved";
  if (v === "REJECTED") return "Rejected";
  if (v === "CANCELLED") return "Cancelled";
  if (v === "COMPLETED") return "Completed";
  if (v === "PENDING") return "Pending";
  return s ? String(s) : "Pending";
}

function normalizeToArray(data: unknown): Row[] {
  if (!data) return [];
  const d = data as any;

  const list: any[] = Array.isArray(d)
    ? d
    : Array.isArray(d.leaves)
      ? d.leaves // controller key
      : Array.isArray(d.history)
        ? d.history // /history endpoint key
        : Array.isArray(d.content)
          ? d.content // Spring Page
          : Array.isArray(d.data)
            ? d.data // generic wrapper
            : [];

  return list.map((r: any) => {
    const startDate = r.startDate || r.start_date || "";
    const endDate = r.endDate || r.end_date || "";
    return {
      id: Number(r.id ?? r.leaveId ?? r.leave_id ?? 0),
      leaveCode: r.leaveCode || r.leave_code || "—",
      leaveType: r.leaveType || r.leave_type || "—",
      startDate,
      endDate,
      includeWeekends: Boolean(r.includeWeekends ?? r.include_weekends),
      dateReported: r.dateReported || r.date_reported || "",
      returnDate: r.returnDate || r.return_date || "",
      leaveBalance: r.leaveBalance ?? r.leave_balance ?? "",
      leaveStatus: normalizeStatus(r.leaveStatus || r.leave_status),
      totalDays:
        r.totalDays != null
          ? Number(r.totalDays)
          : startDate && endDate
            ? Math.max(
                Math.floor(
                  (new Date(endDate).getTime() -
                    new Date(startDate).getTime()) /
                    86_400_000,
                ) + 1,
                1,
              )
            : 0,
      supportingDocumentUrl:
        r.supportingDocumentUrl ??
        r.supporting_document_url ??
        r.documentUrl ??
        "",
    } as Row;
  });
}

const STATUS_META: Record<
  string,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  Approved: {
    label: "Approved",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  Rejected: {
    label: "Rejected",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  Pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  Completed: {
    label: "Completed",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: <CalendarCheck className="h-3 w-3" />,
  },
  Cancelled: {
    label: "Cancelled",
    cls: "bg-slate-50 text-slate-600 border-slate-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

/** Add `n` days to an ISO date string, returning yyyy-MM-dd (for input min). */
const addDays = (iso: string, n: number): string | undefined => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

type BalanceEntry = {
  type: string;
  balance: number;
  used: number;
  loading: boolean;
};

const BALANCE_COLORS = [
  {
    bar: "bg-blue-500",
    badge: "bg-blue-50 border-blue-200 text-blue-700",
    pill: "bg-blue-100 text-blue-700",
  },
  {
    bar: "bg-violet-500",
    badge: "bg-violet-50 border-violet-200 text-violet-700",
    pill: "bg-violet-100 text-violet-700",
  },
  {
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
    pill: "bg-emerald-100 text-emerald-700",
  },
  {
    bar: "bg-amber-500",
    badge: "bg-amber-50 border-amber-200 text-amber-700",
    pill: "bg-amber-100 text-amber-700",
  },
  {
    bar: "bg-rose-500",
    badge: "bg-rose-50 border-rose-200 text-rose-700",
    pill: "bg-rose-100 text-rose-700",
  },
  {
    bar: "bg-teal-500",
    badge: "bg-teal-50 border-teal-200 text-teal-700",
    pill: "bg-teal-100 text-teal-700",
  },
];

export default function LeavesHistory() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
  // Bump to refetch history + balances (e.g. after confirming a return).
  const [refreshKey, setRefreshKey] = useState(0);
  // Return-confirmation modal: the approved leave being closed out, plus the
  // single editable field (the date the employee resumed duties).
  const [returnFor, setReturnFor] = useState<Row | null>(null);
  const [reportedDate, setReportedDate] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Open the return-confirmation modal for an approved leave.
  const openReturn = (row: Row) => {
    setReturnFor(row);
    setReportedDate("");
  };

  // Earliest valid return is the day after the leave started.
  const minReturnDate = returnFor ? addDays(returnFor.startDate, 1) : undefined;

  const submitReturn = async () => {
    if (!returnFor || !id) return;
    if (!reportedDate) {
      toast.error("Please select the reported-to-office date");
      return;
    }
    setReturnSubmitting(true);
    const res = await leaveService.confirmReturn(
      Number(id),
      returnFor.id,
      reportedDate,
    );
    setReturnSubmitting(false);
    if (!res.success) {
      toast.error(res.message || "Failed to confirm return");
      return;
    }
    toast.success("Return confirmed — leave balance updated");
    setReturnFor(null);
    setRefreshKey((k) => k + 1);
  };

  // Edit a pending leave: jump to the leave form (the index tab) in edit mode,
  // pre-filled with this row's values (handed over via router state).
  const openEdit = (row: Row) => {
    const formPath = location.pathname.replace(/\/history$/, "");
    navigate(`${formPath}?edit=1&leaveId=${row.id}`, { state: { leave: row } });
  };

  // Fetch leave balance per type via the preview endpoint (today → today)
  const fetchBalances = async (
    empId: number,
    leaveTypes: string[],
    rows: Row[],
  ) => {
    const today = new Date().toISOString().slice(0, 10);

    // Days actually consumed per type. The balance is deducted only once the
    // employee returns to office (status COMPLETED), so an approved-but-not-yet-
    // returned leave is intentionally not counted as used here.
    const usedByType: Record<string, number> = {};
    rows.forEach((r) => {
      if (r.leaveStatus === "Completed") {
        usedByType[r.leaveType] =
          (usedByType[r.leaveType] || 0) + (Number(r.totalDays) || 0);
      }
    });

    // Seed UI immediately so cards appear with spinners
    setBalances(
      leaveTypes.map((t) => ({
        type: t,
        balance: 0,
        used: usedByType[t] || 0,
        loading: true,
      })),
    );

    // Resolve each type's balance in parallel
    const results = await Promise.allSettled(
      leaveTypes.map((t) => leaveService.previewLeave(empId, t, today, today)),
    );

    setBalances(
      leaveTypes.map((t, i) => {
        const res = results[i];
        let balance = 0;
        if (res.status === "fulfilled" && res.value.success) {
          balance = res.value.data?.availableBalance ?? 0;
        } else {
          // Fall back to most recent leaveBalance from history for this type
          const recent = [...rows]
            .filter(
              (r) =>
                r.leaveType === t &&
                r.leaveBalance !== "" &&
                r.leaveBalance != null,
            )
            .sort(
              (a, b) =>
                new Date(b.startDate).getTime() -
                new Date(a.startDate).getTime(),
            )[0];
          balance = recent ? Number(recent.leaveBalance) : 0;
        }
        return { type: t, balance, used: usedByType[t] || 0, loading: false };
      }),
    );
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);

    leaveService
      .fetchLeaveHistory(Number(id))
      .then(async (res) => {
        if (!mounted) return;
        if (!res.success) {
          setError(res.message || "Failed to load leave history");
          return;
        }
        const data = normalizeToArray(res.data);
        setRows(data);

        // Collect unique leave types from history, then fetch balances
        const types = [
          ...new Set(
            data.map((r) => r.leaveType).filter((t) => t && t !== "—"),
          ),
        ];
        if (types.length > 0 && mounted) {
          fetchBalances(Number(id), types, data);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load leave history", err);
        setError("Failed to load leave history");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, refreshKey]);

  // Client-side filter
  const filtered = search.trim()
    ? rows.filter((r) =>
        [r.leaveCode, r.leaveType, r.leaveStatus]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : rows;

  /* ── Derived stats ── */
  const totalApproved = rows.filter((r) => r.leaveStatus === "Approved").length;
  const totalPending = rows.filter((r) => r.leaveStatus === "Pending").length;
  // Days "used" = actually consumed = completed leaves only.
  const totalDaysUsed = rows
    .filter((r) => r.leaveStatus === "Completed")
    .reduce((s, r) => s + (Number(r.totalDays) || 0), 0);

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <SecondaryPageHeader
        title="Leave History"
        description="All submitted leave requests for this employee"
        icon={<FileText className="h-5 w-5 text-white" />}
      />

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Total Requests"
          value={rows.length}
          color="text-blue-600 bg-blue-50 border-blue-100"
          iconBg="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4" />}
          label="Approved"
          value={totalApproved}
          color="text-emerald-600 bg-emerald-50 border-emerald-100"
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total Days Used"
          value={totalDaysUsed}
          color="text-violet-600 bg-violet-50 border-violet-100"
          iconBg="bg-violet-100 text-violet-600"
        />
      </div>

      {/* ── Leave Balance Summary ── */}
      {balances.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Wallet className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Leave Balance</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">
              · current remaining days
            </span>
          </div>

          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {balances.map((b, i) => {
              const col = BALANCE_COLORS[i % BALANCE_COLORS.length];
              const totalEntitlement = b.used + b.balance;
              const pct =
                totalEntitlement > 0
                  ? Math.round((b.balance / totalEntitlement) * 100)
                  : 0;

              return (
                <div
                  key={b.type}
                  className={cn(
                    "rounded-xl border p-4 flex flex-col gap-2.5",
                    col.badge,
                  )}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide leading-tight truncate">
                    {b.type}
                  </p>

                  {b.loading ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50" />
                      <span className="text-xs opacity-60">Loading…</span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-2xl font-bold tabular-nums leading-tight">
                          {b.balance}
                        </p>
                        <p className="text-[10px] font-medium opacity-70">
                          days remaining
                        </p>
                      </div>

                      {/* Mini progress bar */}
                      <div className="space-y-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              col.bar,
                            )}
                            style={{ width: `${pct}%`, opacity: 0.7 }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] opacity-60 font-medium">
                          <span>{b.used} used</span>
                          <span>{pct}% left</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Table card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Search bar */}
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by type or status…"
              className="h-8 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <Th>Leave Code</Th>
                <Th>Leave Type</Th>
                <Th>Start Date</Th>
                <Th>End Date</Th>
                <Th>Reporting to Office</Th>
                <Th>Applied On</Th>
                <Th center>Days</Th>
                <Th>Status</Th>
                <Th center>Document</Th>
                <Th center>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-3 text-slate-400">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                      <span className="text-xs font-medium">
                        Loading leave history…
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-rose-500">
                      <AlertCircle className="h-8 w-8" />
                      <span className="text-sm font-medium">{error}</span>
                      <span className="text-xs text-slate-400">
                        Check your connection and try again
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <Calendar className="h-8 w-8" />
                      <span className="text-sm font-medium">
                        {search
                          ? "No results match your search"
                          : "No leave history yet"}
                      </span>
                      <span className="text-xs">
                        {!search &&
                          'Apply a leave in the "Employee Leaves" tab to see it here.'}
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filtered.map((r, idx) => {
                  const statusMeta = STATUS_META[r.leaveStatus] ?? {
                    label: r.leaveStatus,
                    cls: "bg-slate-50 text-slate-600 border-slate-200",
                    icon: <Clock className="h-3 w-3" />,
                  };
                  return (
                    <tr
                      key={r.leaveCode ?? idx}
                      className={cn(
                        "border-b border-slate-100 transition-colors hover:bg-slate-50/60",
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                      )}
                    >
                      <Td>
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {r.leaveCode || "—"}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-medium text-slate-800">
                          {r.leaveType || "—"}
                        </span>
                      </Td>
                      <Td>{fmt(r.startDate)}</Td>
                      <Td>{fmt(r.endDate)}</Td>
                      <Td className="text-slate-500">{fmt(r.returnDate)}</Td>
                      <Td className="text-slate-500">{fmt(r.dateReported)}</Td>
                      <Td center>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {r.totalDays ?? 0}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                            statusMeta.cls,
                          )}
                        >
                          {statusMeta.icon}
                          {statusMeta.label}
                        </span>
                      </Td>
                      <Td center>
                        {r.supportingDocumentUrl ? (
                          <a
                            href={r.supportingDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View / download supporting document"
                            className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                          >
                            <Download className="h-3.5 w-3.5" />
                            View
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </Td>
                      <Td center>
                        {/* Pending → editable; Approved → confirm the return
                            (records the reported-to-office date and deducts the
                            actual days). Other states have no action. */}
                        {r.leaveStatus === "Pending" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(r)}
                            className="h-7 gap-1 rounded-lg text-xs"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        ) : r.leaveStatus === "Approved" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReturn(r)}
                            className="h-7 gap-1 rounded-lg text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            Confirm Return
                          </Button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && !error && rows.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-2.5">
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-600">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-600">
                {rows.length}
              </span>{" "}
              records
              {totalPending > 0 && (
                <span className="ml-2 text-amber-600">
                  · {totalPending} pending approval
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Confirm-return modal ── */}
      {returnFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !returnSubmitting && setReturnFor(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <CalendarCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirm Return
                  </h3>
                  <p className="text-xs text-slate-500">
                    {returnFor.leaveCode} · {returnFor.leaveType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReturnFor(null)}
                disabled={returnSubmitting}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {/* Read-only leave details — only the return date is editable. */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <ReadOnlyField
                  label="Start Date"
                  value={fmt(returnFor.startDate)}
                />
                <ReadOnlyField label="End Date" value={fmt(returnFor.endDate)} />
                <ReadOnlyField
                  label="Planned Days"
                  value={String(returnFor.totalDays ?? 0)}
                />
                <ReadOnlyField
                  label="Weekends"
                  value={returnFor.includeWeekends ? "Included" : "Excluded"}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Reported to Office <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={reportedDate}
                  min={minReturnDate}
                  onChange={(e) => setReportedDate(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                />
                <p className="text-[11px] text-slate-500">
                  The day the employee resumed duties. The actual days taken are
                  deducted from the balance — returning earlier or later than
                  planned is fine.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturnFor(null)}
                disabled={returnSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void submitReturn()}
                disabled={returnSubmitting || !reportedDate}
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {returnSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Confirming…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Confirm Return
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small helpers ── */

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function Th({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500",
        center ? "text-center" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  center,
  className,
}: {
  children: React.ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3",
        center ? "text-center" : "text-left",
        className,
      )}
    >
      {children}
    </td>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  iconBg: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm",
        color,
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          iconBg,
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
}
