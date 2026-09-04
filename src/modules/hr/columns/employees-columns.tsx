"use client";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import type { Employee } from "../../../types/hr";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────
const getInitials = (first?: string, last?: string) => {
  const f = (first ?? "").trim()[0] ?? "";
  const l = (last  ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "?";
};

const avatarColor = (status?: string) => {
  const key = String(status ?? "").toUpperCase().replace(/[\s-]/g, "_");
  switch (key) {
    case "ACTIVE":   return "from-emerald-400 to-teal-500";
    case "ON_LEAVE": return "from-amber-400 to-orange-500";
    case "INACTIVE": return "from-slate-400 to-gray-500";
    default:         return "from-violet-400 to-blue-500";
  }
};

// ── status badge ──────────────────────────────────────────────────────────────
const StatusCell = ({ value }: { value?: string }) => {
  const key = String(value ?? "").toUpperCase().replace(/[\s-]/g, "_");

  const map: Record<string, { label: string; className: string }> = {
    ACTIVE:          { label: "Active",          className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    UNDER_PROBATION: { label: "Under Probation", className: "bg-indigo-50  text-indigo-700  border-indigo-200"  },
    INACTIVE:        { label: "Inactive",        className: "bg-rose-50    text-rose-700    border-rose-200"    },
    ON_LEAVE:        { label: "On Leave",        className: "bg-amber-50   text-amber-700   border-amber-200"   },
  };

  // Fallback: never show a raw enum — turn e.g. "UNDER_PROBATION" into "Under Probation".
  const humanized = String(value ?? "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const { label, className } = map[key] ?? {
    label: humanized || "—",
    className: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", className)}>
      <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full inline-block", {
        "bg-emerald-500": key === "ACTIVE",
        "bg-indigo-500":  key === "UNDER_PROBATION",
        "bg-rose-500":    key === "INACTIVE",
        "bg-amber-500":   key === "ON_LEAVE",
        "bg-gray-400":    !["ACTIVE","UNDER_PROBATION","INACTIVE","ON_LEAVE"].includes(key),
      })} />
      {label}
    </Badge>
  );
};

type Cell<T> = CellContext<T, unknown>;

// ── field formatters ───────────────────────────────────────────────────────────
const fmtJoinDate = (iso?: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** PERMANENT → "Permanent", FULL_TIME → "Full Time". */
const fmtEmployment = (v?: string): string => {
  if (!v) return "—";
  return v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// ── column definitions ────────────────────────────────────────────────────────
export const EMPLOYEE_COLUMNS: ColumnDef<Employee>[] = [
  {
    id: "slNo",
    header: "SL. No.",
    enableSorting: false,
    cell: ({ row }: Cell<Employee>) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {row.index + 1}
      </span>
    ),
  },
  {
    accessorKey: "employeeNo",
    header: "Emp. Code",
    enableSorting: true,
    cell: ({ getValue }: Cell<Employee>) => (
      <span className="font-mono text-xs text-muted-foreground">
        {(getValue() as string) ?? "—"}
      </span>
    ),
  },
  {
    id: "name",
    header: "Name",
    enableSorting: false,
    cell: ({ row }: Cell<Employee>) => {
      const { firstName, lastName, status, imageUrl } = row.original;
      const initials = getInitials(firstName, lastName);
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
      const gradColors = avatarColor(status);

      return (
        <div className="flex items-center gap-3 min-w-0 py-0.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={imageUrl ?? undefined} alt={fullName} className="object-cover" />
            <AvatarFallback
              className={cn(
                "bg-gradient-to-br text-white text-xs font-semibold",
                gradColors,
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <p className="truncate text-sm font-semibold text-foreground leading-tight">
            {fullName}
          </p>
        </div>
      );
    },
  },
  {
    id: "department",
    header: "Department",
    enableSorting: true,
    accessorFn: (e) => e.departmentName ?? e.department ?? "",
    cell: ({ getValue }: Cell<Employee>) => {
      const val = getValue() as string;
      return val ? (
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
          {val}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "designation",
    header: "Position",
    enableSorting: true,
    cell: ({ getValue }: Cell<Employee>) => (
      <span className="text-sm text-foreground">
        {(getValue() as string) || "—"}
      </span>
    ),
  },
  {
    accessorKey: "employmentCategory",
    header: "Employment Type",
    enableSorting: true,
    cell: ({ getValue }: Cell<Employee>) => {
      const val = getValue() as string | undefined;
      return val ? (
        <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
          {fmtEmployment(val)}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "joinDate",
    header: "Joined Date",
    enableSorting: true,
    cell: ({ getValue }: Cell<Employee>) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {fmtJoinDate(getValue() as string)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ getValue }: Cell<Employee>) => (
      <StatusCell value={getValue() as string} />
    ),
  },
];
