import type { ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { formatTime } from "./dashboard-utils";

export function DashboardPageHeader({
  title,
  description,
  icon,
  variant = "darkBlue",
  generatedAt,
  loading,
  onRefresh,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  variant?: PageHeaderProps["variant"];
  generatedAt?: string | null;
  loading?: boolean;
  onRefresh: () => void;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      variant={variant}
      icon={icon}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {generatedAt ? (
            <span className="text-xs text-white/80">
              Last updated: {formatTime(generatedAt)}
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="border border-white/25 bg-white/15 text-white hover:bg-white/25 hover:text-white"
          >
            <RefreshCw
              className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Refresh
          </Button>
        </div>
      }
    />
  );
}
