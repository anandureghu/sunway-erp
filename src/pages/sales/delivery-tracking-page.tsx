import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Truck, ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import type { Dispatch } from "@/types/sales";
import { Link } from "react-router-dom";
import {
  listShipmentsAsDispatches,
  attachOrderAndItems,
  listSalesOrders,
  listPicklists,
} from "@/service/salesFlowService";
import { listItems } from "@/service/inventoryService";
import { cn } from "@/lib/utils";

type TrackingEvent = {
  event: string;
  location: string;
  dateTime?: string;
  status: "completed" | "current" | "pending";
};

export default function DeliveryTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(
    null
  );
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [shipments, orders, picklists, items] = await Promise.all([
          listShipmentsAsDispatches(),
          listSalesOrders(),
          listPicklists(),
          listItems(),
        ]);
        if (cancelled) return;
        const { dispatchesEnriched } = attachOrderAndItems(
          orders,
          picklists,
          shipments,
          items
        );
        setDispatches(dispatchesEnriched);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "Failed to load shipments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDispatches = useMemo(() => {
    return dispatches.filter((dispatch) => {
      const q = searchQuery.toLowerCase();
      return (
        dispatch.dispatchNo.toLowerCase().includes(q) ||
        dispatch.trackingNumber?.toLowerCase().includes(q) ||
        dispatch.order?.orderNo.toLowerCase().includes(q) ||
        dispatch.order?.customer?.name.toLowerCase().includes(q)
      );
    });
  }, [dispatches, searchQuery]);

  // Generate tracking history based on dispatch status
  const getTrackingHistory = (dispatch: Dispatch): TrackingEvent[] => {
    const events: TrackingEvent[] = [];
    const orderDate = dispatch.order?.orderDate || dispatch.createdAt;
    const createdAt = dispatch.createdAt
      ? new Date(dispatch.createdAt)
      : new Date();
    const originCity = dispatch.order?.customer?.city || "Origin";
    const originCountry = dispatch.order?.customer?.country || "";
    const destination = getDestination(dispatch);

    // Order Confirmed
    events.push({
      event: "Order Confirmed",
      location:
        originCity && originCountry
          ? `${originCity}, ${originCountry}`.trim()
          : originCity || "Origin",
      dateTime: orderDate
        ? format(new Date(orderDate), "MMM dd, yyyy - h:mm a")
        : undefined,
      status: "completed",
    });

    // Picked Up
    if (dispatch.status !== "created") {
      const pickedDate = new Date(createdAt);
      pickedDate.setHours(pickedDate.getHours() + 4);
      events.push({
        event: "Picked Up",
        location: `${originCity} Distribution Center`,
        dateTime: format(pickedDate, "MMM dd, yyyy - h:mm a"),
        status: "completed",
      });
    }

    // In Transit
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
      events.push({
        event: "In Transit",
        location: "Hub",
        status: "current",
      });
    }

    // Out for Delivery
    if (dispatch.status === "delivered") {
      const outForDeliveryDate = new Date(createdAt);
      outForDeliveryDate.setDate(outForDeliveryDate.getDate() + 3);
      events.push({
        event: "Out for Delivery",
        location: destination,
        dateTime: format(outForDeliveryDate, "MMM dd, yyyy - h:mm a"),
        status: "completed",
      });
    } else {
      events.push({
        event: "Out for Delivery",
        location: destination,
        status: "pending",
      });
    }

    // Delivered
    if (dispatch.status === "delivered") {
      events.push({
        event: "Delivered",
        location: destination,
        dateTime: dispatch.actualDeliveryDate
          ? format(
              new Date(dispatch.actualDeliveryDate),
              "MMM dd, yyyy - h:mm a"
            )
          : undefined,
        status: "completed",
      });
    } else {
      events.push({
        event: "Delivered",
        location: destination,
        status: "pending",
      });
    }

    return events;
  };

  // Extract destination from address
  const getDestination = (dispatch: Dispatch): string => {
    if (dispatch.deliveryAddress) {
      const parts = dispatch.deliveryAddress.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
      }
      return dispatch.deliveryAddress;
    }
    if (dispatch.order?.customer) {
      const { city, country } = dispatch.order.customer;
      if (city && country) return `${city}, ${country}`;
      if (city) return city;
      if (country) return country;
    }
    return "Unknown";
  };

  // Get status display
  const getStatusDisplay = (
    status: string
  ): { label: string; color: string } => {
    switch (status) {
      case "delivered":
        return { label: "DELIVERED", color: "bg-green-500 text-white" };
      case "in_transit":
        return { label: "IN TRANSIT", color: "bg-blue-500 text-white" };
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
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Delivery Tracking</h1>
            <p className="text-muted-foreground">
              Track shipments and delivery status
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Left Sidebar - Active Dispatches */}
        <Card>
          <CardHeader>
            <CardTitle>Active Dispatches</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Q Search dispatches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">
                Loading...
              </div>
            ) : loadError ? (
              <div className="py-10 text-center text-red-600">{loadError}</div>
            ) : filteredDispatches.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                No dispatches found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDispatches.map((dispatch) => {
                  const statusDisplay = getStatusDisplay(dispatch.status);
                  const isSelected = selectedDispatch?.id === dispatch.id;
                  return (
                    <div
                      key={dispatch.id}
                      className={cn(
                        "p-4 border-2 rounded-lg cursor-pointer transition-all",
                        isSelected
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-muted/50"
                      )}
                      onClick={() => setSelectedDispatch(dispatch)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-lg">
                            {dispatch.dispatchNo}
                          </p>
                          <Badge
                            className={cn(
                              "text-xs font-medium",
                              statusDisplay.color
                            )}
                          >
                            {statusDisplay.label}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            <span className="font-medium">Customer:</span>{" "}
                            {dispatch.order?.customer?.name || "Unknown"}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Destination:</span>{" "}
                            {getDestination(dispatch)}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">ETA:</span>{" "}
                            {dispatch.estimatedDeliveryDate
                              ? format(
                                  new Date(dispatch.estimatedDeliveryDate),
                                  "MMM dd, yyyy"
                                )
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Tracking Details */}
        <div>
          {selectedDispatch ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">
                      {selectedDispatch.dispatchNo}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {selectedDispatch.order?.customer?.name || "Unknown"} →{" "}
                      {getDestination(selectedDispatch)}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-sm font-medium",
                      getStatusDisplay(selectedDispatch.status).color
                    )}
                  >
                    {getStatusDisplay(selectedDispatch.status).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        CARRIER
                      </p>
                      <p className="font-semibold">
                        {selectedDispatch.notes || "Not specified"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        ESTIMATED DELIVERY
                      </p>
                      <p className="font-semibold">
                        {selectedDispatch.estimatedDeliveryDate
                          ? format(
                              new Date(selectedDispatch.estimatedDeliveryDate),
                              "MMM dd, yyyy"
                            )
                          : "Not set"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        CURRENT LOCATION
                      </p>
                      <p className="font-semibold">
                        {selectedDispatch.status === "in_transit"
                          ? "In Transit"
                          : selectedDispatch.status === "delivered"
                          ? getDestination(selectedDispatch)
                          : "Origin"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tracking History */}
                <div>
                  <CardTitle className="mb-4">Tracking History</CardTitle>
                  <div className="space-y-6">
                    {getTrackingHistory(selectedDispatch).map(
                      (event, index) => {
                        const isLast =
                          index ===
                          getTrackingHistory(selectedDispatch).length - 1;
                        return (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              {event.status === "completed" ? (
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle2 className="h-4 w-4 text-white" />
                                </div>
                              ) : event.status === "current" ? (
                                <div className="w-6 h-6 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center flex-shrink-0">
                                  <Circle className="h-3 w-3 text-white fill-white" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex-shrink-0" />
                              )}
                              {!isLast && (
                                <div
                                  className={cn(
                                    "w-0.5 flex-1 mt-2 min-h-[40px]",
                                    event.status === "pending"
                                      ? "bg-gray-200"
                                      : "bg-green-500"
                                  )}
                                />
                              )}
                            </div>
                            <div
                              className={cn(
                                "flex-1 pb-2",
                                event.status === "current" &&
                                  "border-l-2 border-blue-500 pl-4"
                              )}
                            >
                              <p className="font-semibold text-base">
                                {event.event}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.location}
                              </p>
                              {event.dateTime ? (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {event.dateTime}
                                </p>
                              ) : event.status === "pending" ? (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  Pending
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center text-muted-foreground">
                  <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">
                    Select a dispatch to view tracking details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
