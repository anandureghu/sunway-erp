import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Truck, MapPin, Clock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import type { Dispatch } from "@/types/sales";
import { Link } from "react-router-dom";
import { listShipmentsAsDispatches } from "@/service/salesFlowService";

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
        const data = await listShipmentsAsDispatches();
        if (!cancelled) setDispatches(data);
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
        dispatch.order?.orderNo.toLowerCase().includes(q)
      );
    });
  }, [dispatches, searchQuery]);

  // Backend doesn't expose tracking history in this OpenAPI spec.

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Dispatches</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search dispatches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">
                  Loading...
                </div>
              ) : loadError ? (
                <div className="py-10 text-center text-red-600">{loadError}</div>
              ) : (
                <div className="space-y-2">
                  {filteredDispatches.map((dispatch) => (
                    <div
                      key={dispatch.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setSelectedDispatch(dispatch)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{dispatch.dispatchNo}</p>
                          <p className="text-sm text-muted-foreground">
                            Picklist: {dispatch.picklistId} |{" "}
                            {dispatch.trackingNumber || "No tracking"}
                          </p>
                        </div>
                        <Badge
                          className={
                            dispatch.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : dispatch.status === "in_transit"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                          }
                        >
                          {dispatch.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedDispatch ? (
            <Card>
              <CardHeader>
                <CardTitle>Tracking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Dispatch Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">
                        Dispatch No:
                      </span>{" "}
                      {selectedDispatch.dispatchNo}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Picklist ID:</span>{" "}
                      {selectedDispatch.picklistId}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Tracking:</span>{" "}
                      {selectedDispatch.trackingNumber || "N/A"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Vehicle:</span>{" "}
                      {selectedDispatch.vehicleNumber || "N/A"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Driver:</span>{" "}
                      {selectedDispatch.driverName || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Delivery Address</h3>
                  <p className="text-sm">{selectedDispatch.deliveryAddress}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Status
                  </h3>
                  <div className="border-l-2 border-primary pl-3 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {selectedDispatch.createdAt
                          ? format(new Date(selectedDispatch.createdAt), "MMM dd, yyyy HH:mm")
                          : "—"}
                      </span>
                    </div>
                    <Badge className="mb-1">
                      {selectedDispatch.status
                        .replace("_", " ")
                        .split(" ")
                        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                        .join(" ")}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{selectedDispatch.deliveryAddress || "—"}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedDispatch(null)}
                >
                  Clear Selection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a dispatch to view tracking details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
