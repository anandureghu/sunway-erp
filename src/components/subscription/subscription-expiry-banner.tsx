import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function SubscriptionExpiryBanner() {
  const { subscriptionStatus, user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  if (!subscriptionStatus) return null;

  if (subscriptionStatus.locked && isSuperAdmin) {
    return (
      <div className="flex items-center gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950">
        <img
          src="/assets/logo-dark.svg"
          alt=""
          width={16}
          height={16}
          className="shrink-0 opacity-80"
        />
        <span>
          <span className="font-semibold">Sunway</span>
          {" · "}
          This company&apos;s subscription is locked ({subscriptionStatus.status}
          {subscriptionStatus.endsAt
            ? ` · ended ${subscriptionStatus.endsAt}`
            : ""}
          ).{" "}
          <Link
            to="/admin/subscriptions"
            className="font-medium underline underline-offset-2"
          >
            Manage subscription
          </Link>
        </span>
      </div>
    );
  }

  if (!subscriptionStatus.showWarningBanner) return null;

  const days = subscriptionStatus.daysRemaining ?? 0;
  const dayLabel =
    days <= 0 ? "today" : days === 1 ? "in 1 day" : `in ${days} days`;

  return (
    <div className="flex items-center gap-2 border-b border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-950">
      <AlertTriangle className="h-4 w-4 shrink-0 text-orange-600" />
      <span>
        <span className="font-semibold">Sunway</span>
        {" · "}
        Subscription expires {dayLabel}
        {subscriptionStatus.endsAt ? ` (${subscriptionStatus.endsAt})` : ""}.
        Contact your platform administrator to renew.
      </span>
    </div>
  );
}
