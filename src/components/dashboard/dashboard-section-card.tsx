import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DashboardViewAllLink } from "./dashboard-view-all-link";

export function DashboardSectionCard({
  title,
  description,
  viewAllTo,
  className,
  contentClassName,
  children,
}: {
  title: string;
  description?: string;
  viewAllTo?: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader
        className={cn(
          "pb-2",
          viewAllTo && "flex flex-row items-center justify-between space-y-0",
        )}
      >
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {viewAllTo ? <DashboardViewAllLink to={viewAllTo} /> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
