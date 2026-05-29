import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminSystemLog } from "@/types/admin-system-log";

type SystemLogListItemProps = {
  log: AdminSystemLog;
};

export function SystemLogListItem({ log }: SystemLogListItemProps) {
  const userLabel =
    log.userUsername || log.userEmail || (log.userId != null ? `User #${log.userId}` : null);

  return (
    <li className="px-4 py-3 hover:bg-muted/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge
              className={
                log.level === "ERROR"
                  ? "bg-red-100 text-red-800 text-[11px]"
                  : "bg-amber-100 text-amber-900 text-[11px]"
              }
            >
              {log.level}
            </Badge>
            <Badge variant="outline" className="text-[11px] font-normal">
              {log.module}
            </Badge>
            <span>
              {log.createdAt
                ? format(new Date(log.createdAt), "MMM d, yyyy HH:mm")
                : "—"}
            </span>
            {userLabel && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate max-w-[180px]" title={userLabel}>
                  {userLabel}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-slate-900 line-clamp-2">{log.message}</p>
        </div>
        <Link
          to={`/admin/system-logs/${log.id}`}
          className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          More
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </li>
  );
}
