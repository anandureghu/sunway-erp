import { format } from "date-fns";
import type { Dispatch } from "@/types/sales";

export type TrackingEvent = {
  event: string;
  location: string;
  dateTime?: string;
  status: "completed" | "current" | "pending";
};

export function getDestination(dispatch: Dispatch): string {
  if (dispatch.deliveryAddress) {
    const parts = dispatch.deliveryAddress.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    }
    return dispatch.deliveryAddress;
  }
  return "Unknown";
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
    case "created":
      return { label: "PENDING PICKUP", color: "bg-orange-500 text-white" };
    default:
      return {
        label: status.toUpperCase().replace("_", " "),
        color: "bg-gray-500 text-white",
      };
  }
}

export function getTrackingHistory(dispatch: Dispatch): TrackingEvent[] {
  const events: TrackingEvent[] = [];
  const orderDate = dispatch.order?.orderDate || dispatch.createdAt;
  const createdAt = dispatch.createdAt ? new Date(dispatch.createdAt) : new Date();
  const destination = getDestination(dispatch);

  events.push({
    event: "Order Confirmed",
    location: "Origin",
    dateTime: orderDate ? format(new Date(orderDate), "MMM dd, yyyy - h:mm a") : undefined,
    status: "completed",
  });

  if (dispatch.status !== "created") {
    const pickedDate = new Date(createdAt);
    pickedDate.setHours(pickedDate.getHours() + 4);
    events.push({
      event: "Picked Up",
      location: "Origin Distribution Center",
      dateTime: format(pickedDate, "MMM dd, yyyy - h:mm a"),
      status: "completed",
    });
  }

  if (dispatch.status === "in_transit" || dispatch.status === "delivered") {
    const transitDate = new Date(createdAt);
    transitDate.setDate(transitDate.getDate() + 2);
    events.push({
      event: "In Transit",
      location: "Hub",
      dateTime: format(transitDate, "MMM dd, yyyy - h:mm a"),
      status: dispatch.status === "in_transit" ? "current" : "completed",
    });
  } else if (dispatch.status === "dispatched") {
    events.push({ event: "In Transit", location: "Hub", status: "current" });
  }

  events.push({
    event: "Out for Delivery",
    location: destination,
    status: dispatch.status === "delivered" ? "completed" : "pending",
  });

  events.push({
    event: "Delivered",
    location: destination,
    dateTime: dispatch.actualDeliveryDate
      ? format(new Date(dispatch.actualDeliveryDate), "MMM dd, yyyy - h:mm a")
      : undefined,
    status: dispatch.status === "delivered" ? "completed" : "pending",
  });

  return events;
}
