import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import { useAuth } from "@/context/AuthContext";
import type { AdminSystemLog } from "@/types/admin-system-log";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  if (value == null || value === "" || value === "—") {
    return null;
  }
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-4 py-2 border-b border-slate-100 last:border-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className={`text-sm text-slate-900 break-words ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

export default function AdminSystemLogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [log, setLog] = useState<AdminSystemLog | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!isSuperAdmin || !id) {
      return;
    }
    setLoading(true);
    apiClient
      .get<AdminSystemLog>(`/admin/system-logs/${id}`)
      .then((res) => setLog(res.data))
      .catch(() => {
        toast.error("Could not load log entry");
        setLog(null);
      })
      .finally(() => setLoading(false));
  }, [isSuperAdmin, id]);

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const logsListPath = "/admin/system-logs";

  if (loading) {
    return (
      <div className="p-6 bg-slate-50/60 min-h-screen space-y-4">
        <Link
          to={logsListPath}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 [&_svg]:stroke-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="text-muted-foreground">Loading log entry…</p>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-muted-foreground">Log entry not found.</p>
        <Link
          to={logsListPath}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 [&_svg]:stroke-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50/60 min-h-screen space-y-6">
      <PageHeader
        title="Log detail"
        description={`#${log.id}`}
        variant="darkBlue"
        icon={<ScrollText className="w-6 h-6" />}
        backHref={logsListPath}
      />

      <div className="rounded-xl border bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              log.level === "ERROR"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-900"
            }
          >
            {log.level}
          </Badge>
          <Badge variant="outline">{log.module}</Badge>
          <span className="text-sm text-muted-foreground">
            {log.createdAt
              ? format(new Date(log.createdAt), "MMMM d, yyyy 'at' HH:mm:ss")
              : "—"}
          </span>
        </div>

        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Message</h2>
          <p className="text-sm text-slate-900 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 border">
            {log.message}
          </p>
        </div>

        <dl className="rounded-lg border p-4">
          <DetailRow label="User" value={log.userUsername || log.userEmail} />
          <DetailRow label="Email" value={log.userEmail} />
          <DetailRow label="User ID" value={log.userId} />
          <DetailRow label="Company ID" value={log.companyId} />
          <DetailRow
            label="Request"
            value={
              log.requestUri
                ? `${log.requestMethod ?? "GET"} ${log.requestUri}`
                : null
            }
            mono
          />
          <DetailRow label="Logger" value={log.loggerName} mono />
        </dl>

        {log.stackTrace && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Stack trace</h2>
            <pre className="max-h-[min(60vh,480px)] overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
              {log.stackTrace}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
