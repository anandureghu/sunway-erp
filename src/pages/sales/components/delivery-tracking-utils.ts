import { format } from "date-fns";
import type { Dispatch } from "@/types/sales";

export type TrackingEvent = {
  event: string;
  location: string;
  dateTime?: string;
  status: "completed" | "current" | "pending";
};

export function getDestination(dispatch: Dispatch): string {
  const destination =
    dispatch.deliveryAddress?.trim() || dispatch.order?.shippingAddress?.trim();
  return destination || "Unknown";
}

export function getStatusDisplay(
  status: string,
): { label: string; color: string } {
  switch (status) {
    case "delivered":
      return { label: "DELIVERED", color: "bg-green-500 text-white" };
    case "in_transit":
    case "dispatched":
      return { label: "IN TRANSIT", color: "bg-blue-500 text-white" };
    case "out_for_delivery":
      return { label: "OUT FOR DELIVERY", color: "bg-indigo-500 text-white" };
    case "created":
      return { label: "PENDING PICKUP", color: "bg-orange-500 text-white" };
    case "failed_delivery":
      return { label: "FAILED DELIVERY", color: "bg-red-500 text-white" };
    default:
      return {
        label: status.toUpperCase().replace("_", " "),
        color: "bg-gray-500 text-white",
      };
  }
}

export function getTrackingHistory(dispatch: Dispatch): TrackingEvent[] {
  const backendEvents = dispatch.trackingEvents || [];
  if (backendEvents.length > 0) {
    const normalizedCurrentStatus = dispatch.status.toUpperCase();
    const statusCounts = backendEvents.reduce<Record<string, number>>((acc, event) => {
      const key = event.status.toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const statusSeen: Record<string, number> = {};
    const currentIndex = backendEvents.findIndex(
      (event) => event.status.toUpperCase() === normalizedCurrentStatus,
    );
    const activeIndex = currentIndex >= 0 ? currentIndex : backendEvents.length - 1;
    return backendEvents.map((event, index) => ({
      event: (() => {
        const statusKey = event.status.toUpperCase();
        const seen = (statusSeen[statusKey] || 0) + 1;
        statusSeen[statusKey] = seen;
        const normalized = statusKey.replace(/_/g, " ");

        if (statusKey === "DISPATCHED" && (statusCounts[statusKey] || 0) > 1) {
          return seen === 1 ? "DISPATCH IN PROGRESS" : "DISPATCHED";
        }
        return normalized;
      })(),
      location: event.location || "Unknown",
      dateTime: event.eventAt
        ? format(new Date(event.eventAt), "MMM dd, yyyy - h:mm a")
        : undefined,
      status:
        dispatch.status === "delivered" || dispatch.status === "cancelled"
          ? "completed"
          : index < activeIndex
            ? "completed"
            : index === activeIndex
              ? "current"
              : "pending",
    }));
  }

  const destination = getDestination(dispatch);
  const stepStatuses = [
    "created",
    "dispatched",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ] as const;
  const currentStepIndex = stepStatuses.indexOf(
    dispatch.status === "failed_delivery" || dispatch.status === "cancelled"
      ? "out_for_delivery"
      : dispatch.status,
  );
  const getStepState = (index: number): TrackingEvent["status"] => {
    if (dispatch.status === "delivered") return "completed";
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "current";
    return "pending";
  };

  return [
    {
      event: "CREATED",
      location: "Origin",
      dateTime: dispatch.createdAt
        ? format(new Date(dispatch.createdAt), "MMM dd, yyyy - h:mm a")
        : undefined,
      status: getStepState(0),
    },
    {
      event: "DISPATCHED",
      location: "Origin Dispatch Center",
      dateTime: dispatch.createdAt
        ? format(new Date(dispatch.createdAt), "MMM dd, yyyy - h:mm a")
        : undefined,
      status: getStepState(1),
    },
    {
      event: "IN TRANSIT",
      location: "In transit",
      status: getStepState(2),
    },
    {
      event: "OUT FOR DELIVERY",
      location: destination,
      status: getStepState(3),
    },
    {
      event: "DELIVERED",
      location: destination,
      dateTime: dispatch.actualDeliveryDate
        ? format(new Date(dispatch.actualDeliveryDate), "MMM dd, yyyy - h:mm a")
        : undefined,
      status: getStepState(4),
    },
    ...(dispatch.status === "failed_delivery"
      ? [{ event: "FAILED DELIVERY", location: destination, status: "current" as const }]
      : []),
    ...(dispatch.status === "cancelled"
      ? [{ event: "CANCELLED", location: destination, status: "current" as const }]
      : []),
  ];
}
