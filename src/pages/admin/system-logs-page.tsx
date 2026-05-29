import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import { useAuth } from "@/context/AuthContext";
import type { AdminSystemLog, AdminSystemLogPage } from "@/types/admin-system-log";
import { PageHeader, PAGE_HEADER_ACTION_LINK_CLASS } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  AlertTriangle,
  ListFilter,
  ScrollText,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  countActiveSystemLogFilters,
  DEFAULT_SYSTEM_LOG_FILTERS,
  SystemLogsFilterDialog,
  type SystemLogFilters,
} from "@/pages/admin/components/system-logs-filter-dialog";
import { SystemLogsAppliedFilters } from "@/pages/admin/components/system-logs-applied-filters";
import { SystemLogListItem } from "@/pages/admin/components/system-log-list-item";

const PAGE_SIZES = [10, 20, 50, 100] as const;

function paginationRange(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const pages = new Set<number>([0, total - 1, current]);
  if (current > 0) pages.add(current - 1);
  if (current < total - 1) pages.add(current + 1);
  if (current <= 2) {
    pages.add(1);
    pages.add(2);
  }
  if (current >= total - 3) {
    pages.add(total - 2);
    pages.add(total - 3);
  }
  return [...pages].sort((a, b) => a - b);
}

export default function AdminSystemLogsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminSystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SystemLogFilters>(DEFAULT_SYSTEM_LOG_FILTERS);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const activeFilterCount = countActiveSystemLogFilters(filters);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        size: pageSize,
        sort: "createdAt,desc",
      };
      if (filters.level !== "all") {
        params.level = filters.level;
      }
      if (filters.module !== "All") {
        params.module = filters.module;
      }
      if (search) {
        params.search = search;
      }
      if (filters.fromDate) {
        params.from = filters.fromDate;
      }
      if (filters.toDate) {
        params.to = filters.toDate;
      }
      const parsedUserId = filters.userIdFilter.trim();
      if (parsedUserId && /^\d+$/.test(parsedUserId)) {
        params.userId = Number(parsedUserId);
      }
      const res = await apiClient.get<AdminSystemLogPage>("/admin/system-logs", {
        params,
      });
      setRows(res.data.content ?? []);
      setTotalElements(res.data.totalElements ?? 0);
      setTotalPages(res.data.totalPages ?? 0);
    } catch {
      toast.error("Could not load system logs");
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, search]);

  useEffect(() => {
    if (isSuperAdmin) {
      void load();
    }
  }, [isSuperAdmin, load]);

  const pageNumbers = useMemo(
    () => paginationRange(page, totalPages),
    [page, totalPages],
  );

  const showingFrom = totalElements === 0 ? 0 : page * pageSize + 1;
  const showingTo = Math.min((page + 1) * pageSize, totalElements);

  const applyFilters = (next: SystemLogFilters) => {
    setFilters(next);
    setPage(0);
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_SYSTEM_LOG_FILTERS);
    setSearchInput("");
    setSearch("");
    setPage(0);
  };

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-6 bg-slate-50/60 min-h-screen space-y-6">
      <PageHeader
        title="System logs"
        description="Warnings and errors captured from the application (database audit trail)."
        variant="darkBlue"
        icon={<ScrollText className="w-6 h-6" />}
        actions={
          <Link to="/admin/company" className={PAGE_HEADER_ACTION_LINK_CLASS}>
            <ArrowLeft className="h-4 w-4" />
            Admin
          </Link>
        }
      />

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search message, user, email, or request URI…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setFilterDialogOpen(true)}
            >
              <ListFilter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="h-5 min-w-5 rounded-full border-0 bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void load()}>
              Refresh
            </Button>
          </div>
        </div>

        <SystemLogsAppliedFilters
          filters={filters}
          search={search}
          onClearSearch={() => {
            setSearchInput("");
            setSearch("");
            setPage(0);
          }}
          onUpdateFilters={(next) => applyFilters(next)}
          onClearAll={clearAllFilters}
        />
      </div>

      <SystemLogsFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        applied={filters}
        onApply={applyFilters}
      />

      <div className="rounded-xl border bg-white overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-muted-foreground">Loading logs…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            No logs match your filters.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => (
              <SystemLogListItem key={row.id} log={row} />
            ))}
          </ul>
        )}

        {!loading && totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {showingFrom}–{showingTo} of {totalElements} log
                {totalElements === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">
                  Per page
                </Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-8 w-[88px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              {pageNumbers.map((p, idx) => {
                const prev = pageNumbers[idx - 1];
                const showEllipsis = prev !== undefined && p - prev > 1;
                return (
                  <span key={p} className="flex items-center gap-2">
                    {showEllipsis && (
                      <span className="text-sm text-muted-foreground">…</span>
                    )}
                    <Button
                      variant={page === p ? "default" : "outline"}
                      size="sm"
                      className={
                        page === p
                          ? "min-w-[36px] bg-blue-600 hover:bg-blue-700 text-white"
                          : "min-w-[36px]"
                      }
                      onClick={() => setPage(p)}
                    >
                      {p + 1}
                    </Button>
                  </span>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-start rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Application WARN/ERROR during API requests are stored here (with user and
          module context). Framework startup messages are not recorded. Console
          output remains in development; nothing is written to{" "}
          <code className="text-xs">app.log</code> on disk.
        </p>
      </div>
    </div>
  );
}
