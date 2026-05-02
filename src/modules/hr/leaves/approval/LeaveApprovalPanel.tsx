import { useCallback, useEffect, useMemo, useState } from "react";
import { leaveService } from "@/service/leaveService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  ThumbsUp,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Employee } from "@/types/hr";

interface PendingLeave {
  id: number;
  leaveId: number;
  employeeId: number;
  employeeName: string;
  leaveCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  dateReported: string;
  totalDays: number;
  leaveStatus: "PENDING" | "APPROVED" | "REJECTED";
  includeWeekends?: boolean;
  supportingDocumentUrl?: string | null;
  employee: Employee;
}

const TYPE_COLORS: Record<string, string> = {
  "Annual Leave": "bg-blue-50 border-blue-200 text-blue-700",
  "Sick Leave": "bg-rose-50 border-rose-200 text-rose-700",
  "Emergency Leave": "bg-orange-50 border-orange-200 text-orange-700",
  "Unpaid Leave": "bg-slate-50 border-slate-200 text-slate-600",
  "Maternity Leave": "bg-pink-50 border-pink-200 text-pink-700",
};

const typeColor = (type: string) =>
  TYPE_COLORS[type] ?? "bg-violet-50 border-violet-200 text-violet-700";

const fmt = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const normalizeStatus = (value: unknown): PendingLeave["leaveStatus"] => {
  const raw = String(value ?? "PENDING").toLowerCase();
  if (raw.includes("approve")) return "APPROVED";
  if (raw.includes("reject")) return "REJECTED";
  return "PENDING";
};

const buildEmployee = (row: any): Employee => {
  const employeeId = Number(
    row.employeeId ??
      row.employee_id ??
      row.employee?.id ??
      row.employee?.employeeId ??
      row.employee?.employee_id ??
      0
  );

  const employeeName =
    row.employeeName ??
    row.employee_name ??
    row.employee?.employeeName ??
    row.employee?.employee_name ??
    row.employee?.fullName ??
    "";

  const parts = String(employeeName).trim().split(/\s+/).filter(Boolean);

  const firstName =
    row.employee?.firstName ??
    row.employee?.first_name ??
    parts[0] ??
    "";

  const lastName =
    row.employee?.lastName ??
    row.employee?.last_name ??
    (parts.length > 1 ? parts.slice(1).join(" ") : "");

  return {
    ...(row.employee ?? {}),
    id: String(employeeId || ""),
    firstName,
    lastName,
  } as Employee;
};

const normalizeLeaves = (payload: any): PendingLeave[] => {
  const rows: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.approvals)
    ? payload.approvals
    : Array.isArray(payload?.leaves)
    ? payload.leaves
    : Array.isArray(payload?.history)
    ? payload.history
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  return rows
    .map((row) => {
      const employee = buildEmployee(row);

      const employeeId = Number(
        row.employeeId ??
          row.employee_id ??
          employee.id ??
          0
      );

      const leaveId = Number(row.leaveId ?? row.id ?? row.leave_id ?? 0);
      const id = Number(row.id ?? row.leaveId ?? row.leave_id ?? 0);

      return {
        id,
        leaveId,
        employeeId,
        employeeName:
          row.employeeName ??
          row.employee_name ??
          `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim(),
        leaveCode: row.leaveCode ?? row.leave_code ?? "—",
        leaveType: row.leaveType ?? row.leave_type ?? "—",
        startDate: row.startDate ?? row.start_date ?? "",
        endDate: row.endDate ?? row.end_date ?? "",
        dateReported: row.dateReported ?? row.date_reported ?? "",
        totalDays: Number(row.totalDays ?? row.total_days ?? 0),
        leaveStatus: normalizeStatus(row.leaveStatus ?? row.leave_status),
        includeWeekends: Boolean(row.includeWeekends ?? row.include_weekends),
        supportingDocumentUrl:
          row.supportingDocumentUrl ?? row.supporting_document_url ?? null,
        employee,
      } satisfies PendingLeave;
    })
    .filter((leave) => leave.employeeId > 0 && leave.leaveId > 0)
    .filter((leave) => leave.leaveStatus === "PENDING");
};

export default function LeaveApprovalPanel() {
  const { user, permissions, permissionsLoading } = useAuth();

  const [pending, setPending] = useState<PendingLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [justApproved, setJustApproved] = useState<Set<number>>(new Set());

const canApprove = useMemo(() => {
    if (!user) return false;

    // Only HR Manager and Department Manager can approve leave requests
    // ADMIN and SUPER_ADMIN are excluded from leave approvals
    const companyRole = String(user.companyRole ?? "").toLowerCase();
    return /hr\s*manager|department\s*manager/.test(companyRole);
  }, [user]);

// Get the manager's employee ID from the logged-in user
  const managerEmployeeId = useMemo(() => {
    if (!user) return 0;
    // Try to get employeeId from user object (set from JWT token)
    const empId = (user as any)?.employeeId;
    if (empId) return Number(empId);
    // Fallback: use user.id if it's numeric
    if (user.id) return Number(user.id);
    return 0;
  }, [user]);

  const loadPendingLeaves = useCallback(async () => {
    setLoading(true);

    try {
      if (!user || !canApprove) {
        setPending([]);
        return;
      }

      if (!managerEmployeeId || managerEmployeeId <= 0) {
        setPending([]);
        toast.error("Cannot load approvals: missing manager employee ID. Please ensure your account is linked to an employee record.");
        return;
      }

      const res = await leaveService.fetchPendingApprovals(managerEmployeeId);

      if (!res.success) {
        setPending([]);
        toast.error(res.message || "Failed to load leave requests");
        return;
      }

      const leaves = normalizeLeaves(res.data).sort(
        (a, b) =>
          new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime()
      );

      setPending(leaves);
    } catch (err: any) {
      console.error("LeaveApprovalPanel: Error loading leaves:", err);
      setPending([]);
      toast.error(err?.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, [user, canApprove, managerEmployeeId]);

useEffect(() => {
    loadPendingLeaves();
  }, [loadPendingLeaves]);

  const handleApprove = async (leave: PendingLeave) => {
    const employeeId = Number(leave.employeeId);
    const leaveId = Number(leave.leaveId);

    if (!Number.isFinite(employeeId) || employeeId <= 0) {
      toast.error("Cannot approve: invalid employee id");
      return;
    }

    if (!Number.isFinite(leaveId) || leaveId <= 0) {
      toast.error("Cannot approve: invalid leave id");
      return;
    }

    setApprovingId(leave.id);

    try {
      const res = await leaveService.approveLeave(employeeId, leaveId);

      if (!res.success) {
        toast.error(res.message || "Failed to approve leave");
        return;
      }

      toast.success(`Leave approved for ${leave.employeeName}`);
      setJustApproved((prev) => new Set(prev).add(leave.id));

      setTimeout(() => {
        setPending((prev) => prev.filter((item) => item.id !== leave.id));
        setJustApproved((prev) => {
          const next = new Set(prev);
          next.delete(leave.id);
          return next;
        });
      }, 900);
    } finally {
      setApprovingId(null);
    }
  };

  const employees = useMemo(() => {
    return Array.from(
      new Map(pending.map((leave) => [String(leave.employeeId), leave.employee])).values()
    );
  }, [pending]);

  const allTypes = useMemo(
    () => ["All", ...Array.from(new Set(pending.map((leave) => leave.leaveType)))],
    [pending]
  );

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();

    return pending.filter((leave) => {
      const matchSearch =
        !q ||
        leave.employeeName.toLowerCase().includes(q) ||
        leave.leaveType.toLowerCase().includes(q) ||
        leave.leaveCode.toLowerCase().includes(q);

      const matchType = typeFilter === "All" || leave.leaveType === typeFilter;

      return matchSearch && matchType;
    });
  }, [pending, search, typeFilter]);

  const stats = useMemo(
    () => [
      {
        label: "Pending Approvals",
        value: pending.length,
        icon: <Clock className="h-4 w-4" />,
        color: "text-amber-600 bg-amber-50 border-amber-100",
        iconBg: "bg-amber-100 text-amber-600",
      },
      {
        label: "Employees Affected",
        value: new Set(pending.map((leave) => leave.employeeId)).size,
        icon: <Users className="h-4 w-4" />,
        color: "text-blue-600 bg-blue-50 border-blue-100",
        iconBg: "bg-blue-100 text-blue-600",
      },
      {
        label: "Total Requested Days",
        value: pending.reduce((sum, leave) => sum + leave.totalDays, 0),
        icon: <Calendar className="h-4 w-4" />,
        color: "text-violet-600 bg-violet-50 border-violet-100",
        iconBg: "bg-violet-100 text-violet-600",
      },
      {
        label: "With Documents",
        value: pending.filter((leave) => leave.supportingDocumentUrl).length,
        icon: <FileText className="h-4 w-4" />,
        color: "text-emerald-600 bg-emerald-50 border-emerald-100",
        iconBg: "bg-emerald-100 text-emerald-600",
      },
    ],
    [pending]
  );

  if (permissionsLoading || permissions === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
          <Loader2 className="h-7 w-7 text-amber-400 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-slate-700">Checking permissions...</p>
          <p className="text-sm text-slate-400 mt-1">
            Please wait while we verify your access rights.
          </p>
        </div>
      </div>
    );
  }

if (!canApprove) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
          <AlertCircle className="h-7 w-7 text-rose-400" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-slate-700">Access Restricted</p>
<p className="text-sm text-slate-400 mt-1">
            Only HR Managers and Department Managers can approve leave requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Leave Approvals</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Review and approve employee leave requests
              </p>
            </div>
          </div>

          <button
            onClick={loadPendingLeaves}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn("flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm", stat.color)}
          >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", stat.iconBg)}>
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                {stat.label}
              </p>
              <p className="text-2xl font-bold tabular-nums leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee or leave type..."
            className="pl-9 h-9 text-sm border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {allTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-all border",
                typeFilter === type
                  ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:text-amber-700"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm font-medium text-slate-500">Loading pending leave approvals...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <Inbox className="h-7 w-7 text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700">
              {search || typeFilter !== "All" ? "No results match your filters" : "All caught up!"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {search || typeFilter !== "All"
                ? "Try adjusting your search or filter"
                : "No pending leave requests at this time."}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {displayed.length} pending request{displayed.length !== 1 ? "s" : ""}
              {typeFilter !== "All" && ` · ${typeFilter}`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Employee", "Leave Type", "Period", "Days", "Reported", "Document", "Action"].map((header) => (
                    <th
                      key={header}
                      className={cn(
                        "px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500",
                        header === "Days" || header === "Document" || header === "Action"
                          ? "text-center"
                          : "text-left"
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {displayed.map((leave, index) => {
                  const isApproving = approvingId === leave.id;
                  const wasApproved = justApproved.has(leave.id);

                  return (
                    <tr
                      key={leave.id}
                      className={cn(
                        "border-b border-slate-100 transition-all duration-500",
                        wasApproved ? "bg-emerald-50" : index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                        "hover:bg-slate-50/60"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-white text-xs font-bold shadow-sm">
                            {(leave.employee.firstName?.[0] ?? leave.employeeName?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {leave.employeeName || `${leave.employee.firstName} ${leave.employee.lastName}`}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 truncate">
                              {leave.employee.employeeNo ?? `EMP-${leave.employeeId}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            typeColor(leave.leaveType)
                          )}
                        >
                          {leave.leaveType}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{fmt(leave.startDate)}</span>
                          <span className="text-slate-300">→</span>
                          <span>{fmt(leave.endDate)}</span>
                        </div>
                        {leave.includeWeekends && (
                          <span className="mt-1 inline-block text-[10px] text-violet-500 font-medium">
                            incl. weekends
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {leave.totalDays}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500">
                        {fmt(leave.dateReported)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {leave.supportingDocumentUrl ? (
                          <a
                            href={leave.supportingDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="View document"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {wasApproved ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApprove(leave)}
                            disabled={isApproving}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                              "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 shadow-sm",
                              isApproving && "opacity-60 cursor-wait"
                            )}
                          >
                            {isApproving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ThumbsUp className="h-3.5 w-3.5" />
                            )}
                            {isApproving ? "Approving..." : "Approve"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-2.5 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{displayed.length}</span> of{" "}
              <span className="font-semibold text-slate-600">{pending.length}</span> pending requests across{" "}
              <span className="font-semibold text-slate-600">{employees.length}</span> employees
            </p>
            <p className="text-[10px] text-slate-300 italic">
              Only HR Managers and Department Managers can approve
            </p>
          </div>
        </div>
      )}
    </div>
  );
}