import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardEmpty } from "./dashboard-empty";
import { DashboardSectionCard } from "./dashboard-section-card";

export type DashboardCountListItem = {
  key: string;
  label: string;
  count: number;
  icon: LucideIcon;
  color: string;
  to?: string;
};

export function DashboardCountListCard({
  title,
  description,
  viewAllTo,
  items,
  emptyMessage = "Nothing pending.",
}: {
  title: string;
  description?: string;
  viewAllTo?: string;
  items: DashboardCountListItem[];
  emptyMessage?: string;
}) {
  return (
    <DashboardSectionCard
      title={title}
      description={description}
      viewAllTo={viewAllTo}
    >
      {items.length === 0 ? (
        <DashboardEmpty message={emptyMessage} />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const body = (
              <>
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    item.color,
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {item.label}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums">
                  {item.count}
                </span>
              </>
            );

            const className =
              "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors";

            return item.to ? (
              <Link
                key={item.key}
                to={item.to}
                className={cn(className, "hover:bg-muted/50")}
              >
                {body}
              </Link>
            ) : (
              <div key={item.key} className={className}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}
