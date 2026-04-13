import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { leaveService } from "@/service/leaveService";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText, TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  leaveCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  dateReported: string;
  leaveBalance: string | number;
  leaveStatus: string;
  totalDays: number;
};

/** Safely extract an array from any API response shape.
 *  Handles all shapes the EmployeeLeaveController can return:
 *    { leaves: [...] }     ← GET /employees/{id}/leaves
 *    { history: [...] }    ← GET /employees/{id}/leaves/history
 *    [...]                 ← plain array
 *    { content: [...] }    ← Spring Page
 *    { data: [...] }       ← generic wrapper
 */
function normalizeToArray(data: unknown): Row[] {
  if (!data) return [];
  const d = data as any;

  let list: any[] =
    Array.isArray(d)           ? d           :
    Array.isArray(d.leaves)    ? d.leaves    :  // controller key
    Array.isArray(d.history)   ? d.history   :  // /history endpoint key
    Array.isArray(d.content)   ? d.content   :  // Spring Page
    Array.isArray(d.data)      ? d.data      :  // generic wrapper
    [];

  return list.map((r: any) => {
    const startDate = r.startDate || r.start_date || "";
    const endDate   = r.endDate   || r.end_date   || "";
    return {
      leaveCode:    r.leaveCode    || r.leave_code    || "—",
      leaveType:    r.leaveType    || r.leave_type    || "—",
      startDate,
      endDate,
      dateReported: r.dateReported || r.date_reported || "",
      leaveBalance: r.leaveBalance ?? r.leave_balance ?? "",
      leaveStatus:  r.leaveStatus  || r.leave_status  || "Pending",
      totalDays:
        r.totalDays != null
          ? Number(r.totalDays)
          : startDate && endDate
            ? Math.max(
                Math.floor(
                  (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
                ) + 1,
                1
              )
            : 0,
    } as Row;
  });
}

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
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
};

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function LeavesHistory() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    setError(null);

    leaveService
      .fetchLeaveHistory(Number(id))
      .then((res) => {
        if (!mounted) return;
        if (!res.success) {
          setError(res.message || "Failed to load leave history");
          return;
        }
        setRows(normalizeToArray(res.data));
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load leave history", err);
        setError("Failed to load leave history");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [id]);

  // Client-side filter
  const filtered = search.trim()
    ? rows.filter((r) =>
        [r.leaveCode, r.leaveType, r.leaveStatus]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : rows;

  /* ── Derived stats ── */
  const totalApproved = rows.filter((r) => r.leaveStatus === "Approved").length;
  const totalPending  = rows.filter((r) => r.leaveStatus === "Pending").length;
  const totalDays     = rows.reduce((s, r) => s + (Number(r.totalDays) || 0), 0);

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600" />
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Leave History</h2>
            <p className="text-xs text-slate-400 mt-0.5">All submitted leave requests for this employee</p>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Calendar className="h-4 w-4" />} label="Total Requests" value={rows.length} color="text-blue-600 bg-blue-50 border-blue-100" iconBg="bg-blue-100 text-blue-600" />
        <StatCard icon={<CheckCircle className="h-4 w-4" />} label="Approved" value={totalApproved} color="text-emerald-600 bg-emerald-50 border-emerald-100" iconBg="bg-emerald-100 text-emerald-600" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total Days Used" value={totalDays} color="text-violet-600 bg-violet-50 border-violet-100" iconBg="bg-violet-100 text-violet-600" />
      </div>

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
                <Th>Date Reported</Th>
                <Th center>Days</Th>
                <Th>Status</Th>
                <Th center>Balance</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-3 text-slate-400">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                      <span className="text-xs font-medium">Loading leave history…</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-rose-500">
                      <AlertCircle className="h-8 w-8" />
                      <span className="text-sm font-medium">{error}</span>
                      <span className="text-xs text-slate-400">Check your connection and try again</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <Calendar className="h-8 w-8" />
                      <span className="text-sm font-medium">
                        {search ? "No results match your search" : "No leave history yet"}
                      </span>
                      <span className="text-xs">
                        {!search && "Apply a leave in the \"Employee Leaves\" tab to see it here."}
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.map((r, idx) => {
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
                      <span className="font-medium text-slate-800">{r.leaveType || "—"}</span>
                    </Td>
                    <Td>{fmt(r.startDate)}</Td>
                    <Td>{fmt(r.endDate)}</Td>
                    <Td className="text-slate-500">{fmt(r.dateReported)}</Td>
                    <Td center>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {r.totalDays ?? 0}
                      </span>
                    </Td>
                    <Td>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                        statusMeta.cls,
                      )}>
                        {statusMeta.icon}
                        {statusMeta.label}
                      </span>
                    </Td>
                    <Td center>
                      <span className="text-sm font-semibold text-slate-700">
                        {r.leaveBalance !== undefined && r.leaveBalance !== "" && r.leaveBalance !== null
                          ? r.leaveBalance
                          : "—"}
                      </span>
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
              Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of{" "}
              <span className="font-semibold text-slate-600">{rows.length}</span> records
              {totalPending > 0 && (
                <span className="ml-2 text-amber-600">
                  · {totalPending} pending approval
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Small helpers ── */

function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <th className={cn(
      "px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500",
      center ? "text-center" : "text-left",
    )}>
      {children}
    </th>
  );
}

function Td({ children, center, className }: { children: React.ReactNode; center?: boolean; className?: string }) {
  return (
    <td className={cn("px-4 py-3", center ? "text-center" : "text-left", className)}>
      {children}
    </td>
  );
}

function StatCard({
  icon, label, value, color, iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  iconBg: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm", color)}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconBg)}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
}
