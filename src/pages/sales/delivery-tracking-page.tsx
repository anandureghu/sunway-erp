import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Truck,
  CheckCircle2,
  Circle,
  Package,
  Navigation,
} from "lucide-react";
import { format } from "date-fns";
import type { Dispatch } from "@/types/sales";
import { useSearchParams } from "react-router-dom";
import {
  addShipmentTrackingEvent,
  cancelShipment,
  dispatchShipment,
  listShipmentsAsDispatches,
  attachOrderAndItems,
  listSalesOrders,
  listPicklists,
  markShipmentDelivered,
  markShipmentFailedDelivery,
  markShipmentInTransit,
  markShipmentOutForDelivery,
  updateShipmentDetails,
} from "@/service/salesFlowService";
import { listItems } from "@/service/inventoryService";
import { cn } from "@/lib/utils";
import {
  getDestination,
  getStatusDisplay,
  getTrackingHistory,
} from "./components/delivery-tracking-utils";
import { SalesPageHeader } from "./components/sales-page-header";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";

export default function DeliveryTrackingPage() {
  const [searchParams] = useSearchParams();
  const selectedDispatchId = searchParams.get("dispatchId");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(
    null,
  );
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<string>("created");
  const [trackingCarrierName, setTrackingCarrierName] = useState("");
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [trackingDriverName, setTrackingDriverName] = useState("");
  const [trackingDriverPhone, setTrackingDriverPhone] = useState("");
  const [trackingEstimatedDate, setTrackingEstimatedDate] = useState("");
  const [trackingLocation, setTrackingLocation] = useState("");
  const [trackingNotes, setTrackingNotes] = useState("");

  const loadDispatches = async () => {
    const [shipments, orders, picklists, items] = await Promise.all([
      listShipmentsAsDispatches(),
      listSalesOrders(),
      listPicklists(),
      listItems(),
    ]);
    const { dispatchesEnriched } = attachOrderAndItems(
      orders,
      picklists,
      shipments,
      items,
    );
    setDispatches(dispatchesEnriched);
    return dispatchesEnriched;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const dispatchesEnriched = await loadDispatches();
        if (cancelled || !selectedDispatchId) return;
        const match = dispatchesEnriched.find(
          (dispatch) => dispatch.id === selectedDispatchId,
        );
        if (match) setSelectedDispatch(match);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "Failed to load shipments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDispatchId]);

  const filteredDispatches = useMemo(() => {
    return dispatches.filter((dispatch) => {
      const q = searchQuery.toLowerCase();
      return (
        dispatch.dispatchNo.toLowerCase().includes(q) ||
        dispatch.trackingNumber?.toLowerCase().includes(q) ||
        dispatch.order?.orderNo.toLowerCase().includes(q) ||
        dispatch.order?.customerName.toLowerCase().includes(q)
      );
    });
  }, [dispatches, searchQuery]);

  const trackingKpis = useMemo((): KpiSummaryStat[] => {
    const total = dispatches.length;
    const delivered = dispatches.filter((d) => d.status === "delivered").length;
    const pendingDispatch = dispatches.filter(
      (d) => d.status === "created",
    ).length;
    const inMotion = dispatches.filter((d) =>
      ["dispatched", "in_transit", "out_for_delivery"].includes(d.status),
    ).length;
    return [
      {
        label: "Shipments",
        value: total,
        hint: "All tracked dispatches",
        accent: "sky",
        icon: Truck,
      },
      {
        label: "Pending dispatch",
        value: pendingDispatch,
        hint: "Awaiting carrier release",
        accent: "amber",
        icon: Package,
      },
      {
        label: "In motion",
        value: inMotion,
        hint: "On road or out for delivery",
        accent: "violet",
        icon: Navigation,
      },
      {
        label: "Delivered",
        value: delivered,
        hint: "Confirmed customer receipt",
        accent: "emerald",
        icon: CheckCircle2,
      },
    ];
  }, [dispatches]);

  useEffect(() => {
    if (!selectedDispatchId || dispatches.length === 0) return;
    const match = dispatches.find(
      (dispatch) => dispatch.id === selectedDispatchId,
    );
    if (match) {
      setSelectedDispatch(match);
    }
  }, [dispatches, selectedDispatchId]);

  const trackingHistory = useMemo(
    () => (selectedDispatch ? getTrackingHistory(selectedDispatch) : []),
    [selectedDispatch],
  );

  const refreshSelectedDispatch = async () => {
    const dispatchesEnriched = await loadDispatches();
    if (selectedDispatch) {
      const updated = dispatchesEnriched.find(
        (d) => d.id === selectedDispatch.id,
      );
      if (updated) setSelectedDispatch(updated);
    }
  };

  const handleStatusAction = async (
    action:
      | "dispatch"
      | "in_transit"
      | "out_for_delivery"
      | "delivered"
      | "failed_delivery"
      | "cancelled",
  ) => {
    if (!selectedDispatch || updatingStatus) return;
    try {
      setUpdatingStatus(true);
      if (action === "dispatch") await dispatchShipment(selectedDispatch.id);
      if (action === "in_transit")
        await markShipmentInTransit(selectedDispatch.id);
      if (action === "out_for_delivery")
        await markShipmentOutForDelivery(selectedDispatch.id);
      if (action === "delivered")
        await markShipmentDelivered(selectedDispatch.id);
      if (action === "failed_delivery")
        await markShipmentFailedDelivery(
          selectedDispatch.id,
          "Marked failed from tracking screen",
        );
      if (action === "cancelled") await cancelShipment(selectedDispatch.id);
      await refreshSelectedDispatch();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const submitTrackingUpdate = async () => {
    if (!selectedDispatch) return;
    await updateShipmentDetails(selectedDispatch.id, {
      carrierName: trackingCarrierName || undefined,
      trackingNumber: trackingNumberInput || undefined,
      driverName: trackingDriverName || undefined,
      driverPhone: trackingDriverPhone || undefined,
      estimatedDeliveryDate: trackingEstimatedDate || undefined,
      deliveryAddress: selectedDispatch.deliveryAddress || undefined,
      notes: selectedDispatch.notes || undefined,
    });

    let workingStatus = selectedDispatch.status;
    const currentIndex = statusOrder.includes(workingStatus as any)
      ? statusOrder.indexOf(workingStatus as any)
      : -1;
    const targetIndex = statusOrder.includes(trackingStatus as any)
      ? statusOrder.indexOf(trackingStatus as any)
      : -1;

    if (
      targetIndex > currentIndex &&
      !["failed_delivery", "cancelled"].includes(trackingStatus)
    ) {
      for (let i = currentIndex + 1; i <= targetIndex; i += 1) {
        workingStatus = await applyStatusTransition(
          selectedDispatch.id,
          workingStatus,
          statusOrder[i],
        );
      }
    } else if (trackingStatus !== workingStatus) {
      workingStatus = await applyStatusTransition(
        selectedDispatch.id,
        workingStatus,
        trackingStatus as any,
      );
    }

    if (trackingLocation || trackingNotes) {
      await addShipmentTrackingEvent(selectedDispatch.id, {
        status: workingStatus.toUpperCase(),
        location: trackingLocation || undefined,
        notes: trackingNotes || undefined,
        eventAt: new Date().toISOString(),
      });
    }
    setTrackingDialogOpen(false);
    setTrackingCarrierName("");
    setTrackingNumberInput("");
    setTrackingDriverName("");
    setTrackingDriverPhone("");
    setTrackingEstimatedDate("");
    setTrackingLocation("");
    setTrackingNotes("");
    await refreshSelectedDispatch();
  };

  const statusOrder = [
    "created",
    "dispatched",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ] as const;

  const applyStatusTransition = async (
    id: string,
    currentStatus: Dispatch["status"],
    targetStatus: Dispatch["status"],
  ): Promise<Dispatch["status"]> => {
    if (currentStatus === targetStatus) return currentStatus;
    if (targetStatus === "cancelled") {
      await cancelShipment(id);
      return "cancelled";
    }
    if (targetStatus === "failed_delivery") {
      await markShipmentFailedDelivery(
        id,
        trackingNotes || "Marked failed from tracking update",
      );
      return "failed_delivery";
    }
    if (targetStatus === "dispatched" && currentStatus === "created") {
      await dispatchShipment(id);
      return "dispatched";
    }
    if (targetStatus === "in_transit") {
      if (currentStatus === "created") {
        await dispatchShipment(id);
      }
      await markShipmentInTransit(id);
      return "in_transit";
    }
    if (targetStatus === "out_for_delivery") {
      if (currentStatus === "created") await dispatchShipment(id);
      if (currentStatus === "created" || currentStatus === "dispatched") {
        await markShipmentInTransit(id);
      }
      await markShipmentOutForDelivery(id);
      return "out_for_delivery";
    }
    if (targetStatus === "delivered") {
      if (currentStatus === "created") await dispatchShipment(id);
      if (currentStatus === "created" || currentStatus === "dispatched") {
        await markShipmentInTransit(id);
      }
      if (
        currentStatus === "created" ||
        currentStatus === "dispatched" ||
        currentStatus === "in_transit"
      ) {
        await markShipmentOutForDelivery(id);
      }
      await markShipmentDelivered(id);
      return "delivered";
    }
    return currentStatus;
  };

  const showDispatchAction = selectedDispatch?.status === "created";
  const showInTransitAction = selectedDispatch?.status === "dispatched";
  const showOutForDeliveryAction = selectedDispatch?.status === "in_transit";
  const showDeliveredAction =
    selectedDispatch?.status === "dispatched" ||
    selectedDispatch?.status === "in_transit" ||
    selectedDispatch?.status === "out_for_delivery";
  const showFailedAction =
    selectedDispatch?.status === "dispatched" ||
    selectedDispatch?.status === "in_transit" ||
    selectedDispatch?.status === "out_for_delivery";
  const showCancelAction =
    selectedDispatch?.status !== "cancelled" &&
    selectedDispatch?.status !== "delivered";

  useEffect(() => {
    if (!trackingDialogOpen || !selectedDispatch) return;
    setTrackingStatus(selectedDispatch.status);
    setTrackingCarrierName(selectedDispatch.carrierName || "");
    setTrackingNumberInput(selectedDispatch.trackingNumber || "");
    setTrackingDriverName(selectedDispatch.driverName || "");
    setTrackingDriverPhone(selectedDispatch.driverPhone || "");
    setTrackingEstimatedDate(
      selectedDispatch.estimatedDeliveryDate
        ? selectedDispatch.estimatedDeliveryDate.slice(0, 10)
        : "",
    );
    setTrackingLocation("");
    setTrackingNotes(selectedDispatch.notes || "");
  }, [trackingDialogOpen, selectedDispatch]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <SalesPageHeader
        title="Delivery Tracking"
        description="Monitor shipment movement, update milestones, and confirm customer delivery."
        backHref="/inventory/sales"
      />

      {!loading && !loadError ? <KpiSummaryStrip items={trackingKpis} /> : null}

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
                          : "border-gray-200 hover:border-gray-300 hover:bg-muted/50",
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
                              statusDisplay.color,
                            )}
                          >
                            {statusDisplay.label}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            <span className="font-medium">Customer:</span>{" "}
                            {dispatch.order?.customerName || "Unknown"}
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
                                  "MMM dd, yyyy",
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
                      {selectedDispatch.order?.customerName || "Unknown"} →{" "}
                      {getDestination(selectedDispatch)}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-sm font-medium",
                      getStatusDisplay(selectedDispatch.status).color,
                    )}
                  >
                    {getStatusDisplay(selectedDispatch.status).label}
                  </Badge>
                </div>
                <div className="pt-3 flex flex-wrap gap-2">
                  {showDispatchAction && (
                    <Button
                      disabled={updatingStatus}
                      onClick={() => handleStatusAction("dispatch")}
                    >
                      Dispatch Shipment
                    </Button>
                  )}
                  {showInTransitAction && (
                    <Button
                      variant="secondary"
                      disabled={updatingStatus}
                      onClick={() => handleStatusAction("in_transit")}
                    >
                      Mark In Transit
                    </Button>
                  )}
                  {showOutForDeliveryAction && (
                    <Button
                      variant="secondary"
                      disabled={updatingStatus}
                      onClick={() => handleStatusAction("out_for_delivery")}
                    >
                      Mark Out For Delivery
                    </Button>
                  )}
                  {showDeliveredAction && (
                    <Button
                      variant="secondary"
                      disabled={updatingStatus}
                      onClick={() => handleStatusAction("delivered")}
                    >
                      Mark Delivered
                    </Button>
                  )}
                  {showFailedAction && (
                    <Button
                      variant="secondary"
                      disabled={updatingStatus}
                      onClick={() => handleStatusAction("failed_delivery")}
                    >
                      Mark Failed
                    </Button>
                  )}
                  {showCancelAction && (
                    <Button
                      variant="destructive"
                      disabled={updatingStatus}
                      onClick={() => handleStatusAction("cancelled")}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setTrackingDialogOpen(true)}
                    disabled={updatingStatus}
                  >
                    Update Tracking
                  </Button>
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
                        {selectedDispatch.carrierName || "Not specified"}
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
                              "MMM dd, yyyy",
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
                          : selectedDispatch.status === "out_for_delivery"
                            ? "Out for Delivery"
                            : selectedDispatch.status === "delivered"
                              ? getDestination(selectedDispatch)
                              : selectedDispatch.status === "failed_delivery"
                                ? "Delivery Attempt Failed"
                                : "Origin"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tracking History */}
                <div>
                  <CardTitle className="mb-4">Tracking History</CardTitle>
                  <div className="space-y-6">
                    {trackingHistory.map((event, index) => {
                      const isLast = index === trackingHistory.length - 1;
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
                                    : "bg-green-500",
                                )}
                              />
                            )}
                          </div>
                          <div
                            className={cn(
                              "flex-1 pb-2",
                              event.status === "current" &&
                                "border-l-2 border-blue-500 pl-4",
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
                    })}
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
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tracking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tracking-status">Status</Label>
              <Select value={trackingStatus} onValueChange={setTrackingStatus}>
                <SelectTrigger id="tracking-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">
                    Out For Delivery
                  </SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed_delivery">
                    Failed Delivery
                  </SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tracking-carrier">Carrier Name</Label>
                <Input
                  id="tracking-carrier"
                  value={trackingCarrierName}
                  onChange={(e) => setTrackingCarrierName(e.target.value)}
                  placeholder="Carrier name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking-number-input">Tracking Number</Label>
                <Input
                  id="tracking-number-input"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder="Tracking number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking-driver-name">Driver Name</Label>
                <Input
                  id="tracking-driver-name"
                  value={trackingDriverName}
                  onChange={(e) => setTrackingDriverName(e.target.value)}
                  placeholder="Driver name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking-driver-phone">Driver Phone</Label>
                <Input
                  id="tracking-driver-phone"
                  value={trackingDriverPhone}
                  onChange={(e) => setTrackingDriverPhone(e.target.value)}
                  placeholder="Driver phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking-eta">Estimated Delivery Date</Label>
                <Input
                  id="tracking-eta"
                  type="date"
                  value={trackingEstimatedDate}
                  onChange={(e) => setTrackingEstimatedDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking-location">Location</Label>
              <Input
                id="tracking-location"
                value={trackingLocation}
                onChange={(e) => setTrackingLocation(e.target.value)}
                placeholder="Current location checkpoint"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking-notes">Notes</Label>
              <Textarea
                id="tracking-notes"
                value={trackingNotes}
                onChange={(e) => setTrackingNotes(e.target.value)}
                placeholder="Any delivery/tracking notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTrackingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitTrackingUpdate}>Save Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
