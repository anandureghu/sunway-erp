import { cn } from "@/lib/utils";

export function DashboardEmpty({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-8 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {message}
    </div>
  );
}
