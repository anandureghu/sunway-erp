"use client";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import type { Employee } from "../../../types/hr";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * LOCKED UI — Employee Register column layout & typography
 * Do not restyle headers, cell hierarchy, or badge treatment without asking the user first.
 * Reference: name + code stacked; status badge; dept/division two-line; designation + job code;
 * headers = uppercase tracking (align with HR Policies label scale: ~11–12px).
 */

const StatusCell = ({ value }: { value?: string }) => {
  const key = String(value ?? "")
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: {
      label: "ACTIVE",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    UNDER_PROBATION: {
      label: "PROBATION",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    INACTIVE: {
      label: "INACTIVE",
      className: "bg-slate-50 text-slate-600 border-slate-200",
    },
    ON_LEAVE: {
      label: "ON LEAVE",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    RESIGNED: {
      label: "EXITING",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    },
    TERMINATED: {
      label: "TERMINATED",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    },
  };

  const humanized = String(value ?? "")
    .replace(/_/g, " ")
    .toUpperCase();

  const { label, className } = map[key] ?? {
    label: humanized || "—",
    className: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        className,
      )}
    >
      {label}
    </Badge>
  );
};

type Cell<T> = CellContext<T, unknown>;

const fmtJoinDate = (iso?: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const headerClass =
  "text-[11px] font-semibold uppercase tracking-wider text-slate-500";

export const EMPLOYEE_COLUMNS: ColumnDef<Employee>[] = [
  {
    id: "employee",
    header: () => <span className={headerClass}>Employee</span>,
    enableSorting: false,
    cell: ({ row }: Cell<Employee>) => {
      const { firstName, lastName, employeeNo } = row.original;
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
      return (
        <div className="min-w-0 py-0.5">
          <p className="truncate text-sm font-semibold text-slate-900 leading-tight">
            {fullName}
          </p>
          <p className="mt-0.5 text-[11px] tabular-nums text-slate-400">
            {employeeNo || "—"}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <span className={headerClass}>Status</span>,
    enableSorting: true,
    cell: ({ getValue }: Cell<Employee>) => (
      <StatusCell value={getValue() as string} />
    ),
  },
  {
    accessorKey: "nationality",
    header: () => <span className={headerClass}>Nationality</span>,
    enableSorting: true,
    cell: ({ getValue }: Cell<Employee>) => (
      <span className="text-sm text-slate-700">
        {(getValue() as string) || "—"}
      </span>
    ),
  },
  {
    id: "department",
    header: () => (
      <span className={headerClass}>Department / Division</span>
    ),
    enableSorting: true,
    accessorFn: (e) => e.departmentName ?? e.department ?? "",
    cell: ({ row }: Cell<Employee>) => {
      const dept =
        row.original.departmentName ?? row.original.department ?? "";
      const division = row.original.divisionName ?? "";
      if (!dept && !division) {
        return <span className="text-xs text-slate-400">—</span>;
      }
      return (
        <div className="min-w-0">
          {dept ? (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 leading-tight">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" />
              <span className="truncate">{dept}</span>
            </p>
          ) : null}
          {division ? (
            <p className="mt-0.5 pl-3 text-[11px] text-slate-400 truncate">
              {division}
            </p>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "designation",
    header: () => <span className={headerClass}>Designation</span>,
    enableSorting: true,
    cell: ({ row }: Cell<Employee>) => {
      const title = row.original.designation || "";
      const code = row.original.jobCode || "";
      if (!title && !code) {
        return <span className="text-xs text-slate-400">—</span>;
      }
      return (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 leading-tight">
            {title || "—"}
          </p>
          {code ? (
            <p className="mt-0.5 text-[11px] text-slate-400">{code}</p>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "joinDate",
    header: () => <span className={headerClass}>Joined</span>,
    enableSorting: true,
    cell: ({ getValue }: Cell<Employee>) => (
      <span className="text-sm tabular-nums text-slate-600">
        {fmtJoinDate(getValue() as string)}
      </span>
    ),
  },
];
