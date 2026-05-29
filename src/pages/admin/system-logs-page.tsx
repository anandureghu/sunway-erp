import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import { useAuth } from "@/context/AuthContext";
import type { AdminSystemLog, AdminSystemLogPage } from "@/types/admin-system-log";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, AlertTriangle, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const MODULES = [
  "All",
  "Finance",
  "Purchase",
  "Sales",
  "Inventory",
  "HR",
  "Auth",
  "Admin",
  "Master data",
  "System",
] as const;

export default function AdminSystemLogsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminSystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string>("all");
  const [module, setModule] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: 0,
        size: 100,
        sort: "createdAt,desc",
      };
      if (level !== "all") {
        params.level = level;
      }
      if (module !== "All") {
        params.module = module;
      }
      const res = await apiClient.get<AdminSystemLogPage>("/admin/system-logs", {
        params,
      });
      setRows(res.data.content ?? []);
    } catch {
      toast.error("Could not load system logs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [level, module]);

  useEffect(() => {
    if (isSuperAdmin) {
      void load();
    }
  }, [isSuperAdmin, load]);

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
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/company">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Admin
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="WARN">Warning</SelectItem>
          </SelectContent>
        </Select>
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            {MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-muted-foreground">Loading logs…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            No warnings or errors logged yet.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.id} className="p-4 hover:bg-muted/30">
                <div className="flex flex-wrap items-start gap-2 justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        row.level === "ERROR"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-900"
                      }
                    >
                      {row.level}
                    </Badge>
                    <Badge variant="outline">{row.module}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {row.createdAt
                        ? format(new Date(row.createdAt), "MMM d, yyyy HH:mm:ss")
                        : "—"}
                    </span>
                  </div>
                  {row.stackTrace && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        setExpandedId(expandedId === row.id ? null : row.id)
                      }
                    >
                      {expandedId === row.id ? "Hide stack" : "Stack trace"}
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">{row.message}</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <span>
                    User:{" "}
                    <strong className="text-slate-700">
                      {row.userUsername || row.userEmail || row.userId || "—"}
                    </strong>
                  </span>
                  {row.userEmail && row.userUsername && (
                    <span>
                      Email: <strong className="text-slate-700">{row.userEmail}</strong>
                    </span>
                  )}
                  {row.userId != null && (
                    <span>
                      User ID: <strong className="text-slate-700">{row.userId}</strong>
                    </span>
                  )}
                  {row.requestUri && (
                    <span className="sm:col-span-2 truncate" title={row.requestUri}>
                      {row.requestMethod} {row.requestUri}
                    </span>
                  )}
                </div>
                {expandedId === row.id && row.stackTrace && (
                  <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
                    {row.stackTrace}
                  </pre>
                )}
              </li>
            ))}
          </ul>
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
