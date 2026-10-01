import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { Inbox, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { listEnquiries } from "@/service/enquiryService";
import type { Enquiry, EnquiryStatus } from "@/types/enquiry";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZES = [10, 20, 50] as const;

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed",
};

function statusBadgeClass(status: EnquiryStatus): string {
  switch (status) {
    case "NEW":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

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

export default function EnquiriesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<EnquiryStatus | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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
      const data = await listEnquiries({ page, size: pageSize, status, search });
      setRows(data.content ?? []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch {
      toast.error("Could not load enquiries");
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, search]);

  useEffect(() => {
    if (isSuperAdmin) {
      void load();
    }
  }, [isSuperAdmin, load]);

  const pageNumbers = useMemo(() => paginationRange(page, totalPages), [page, totalPages]);
  const showingFrom = totalElements === 0 ? 0 : page * pageSize + 1;
  const showingTo = Math.min((page + 1) * pageSize, totalElements);

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-6 bg-slate-50/60 min-h-screen space-y-4">
      <PageHeader
        title="Enquiries"
        description="Leads from sunway-connect contact form"
        icon={<Inbox className="h-5 w-5" />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name, email, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as EnquiryStatus | "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No enquiries found.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  to={`/admin/enquiries/${row.id}`}
                  className="flex flex-col gap-1 px-4 py-3.5 hover:bg-slate-50 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">{row.name}</span>
                      <Badge variant="outline" className={statusBadgeClass(row.status)}>
                        {STATUS_LABEL[row.status]}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-normal">
                        {row.channel === "WHATSAPP" ? "WhatsApp" : "Email"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {row.email}
                      {row.interest ? ` · ${row.interest}` : ""}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {row.createdAt ? format(new Date(row.createdAt), "dd MMM yyyy HH:mm") : "—"}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
        <p>
          {totalElements === 0
            ? "0 results"
            : `Showing ${showingFrom}–${showingTo} of ${totalElements}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </Button>
            {pageNumbers.map((n, i) => {
              const prev = pageNumbers[i - 1];
              const showEllipsis = prev != null && n - prev > 1;
              return (
                <span key={n} className="inline-flex items-center gap-1">
                  {showEllipsis ? <span className="px-1">…</span> : null}
                  <Button
                    type="button"
                    variant={n === page ? "default" : "outline"}
                    size="sm"
                    className="min-w-8"
                    onClick={() => setPage(n)}
                  >
                    {n + 1}
                  </Button>
                </span>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1 || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
