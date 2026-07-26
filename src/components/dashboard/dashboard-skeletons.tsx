import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashboardKpiSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[104px] rounded-xl" />
      ))}
    </div>
  );
}

export function DashboardCardSkeletonGrid({
  count,
  className,
  cardClassName = "h-[280px] rounded-xl",
}: {
  count: number;
  className?: string;
  cardClassName?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cardClassName} />
      ))}
    </div>
  );
}
