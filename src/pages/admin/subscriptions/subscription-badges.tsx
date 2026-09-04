import { Badge } from "@/components/ui/badge";
import type {
  SubscriptionPaymentStatus,
  SubscriptionStatus,
} from "@/types/subscription";

export function subscriptionStatusBadge(status: SubscriptionStatus) {
  const variant =
    status === "ACTIVE"
      ? "default"
      : status === "EXPIRING"
        ? "secondary"
        : status === "EXPIRED" ||
            status === "CANCELLED" ||
            status === "SUSPENDED"
          ? "destructive"
          : "outline";
  return <Badge variant={variant}>{status}</Badge>;
}

export function paymentStatusBadge(status?: SubscriptionPaymentStatus | null) {
  if (status === "PAID") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        Period paid
      </Badge>
    );
  }
  if (status === "UNPAID") {
    return (
      <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
        Period unpaid
      </Badge>
    );
  }
  if (status === "NOT_REQUIRED") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        N/A
      </Badge>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}
