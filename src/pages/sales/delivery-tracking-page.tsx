import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { dispatches, deliveryTracking } from "@/lib/sales-data";
import { Search, Truck, MapPin, Clock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import type { Dispatch } from "@/types/sales";
import { Link } from "react-router-dom";

export default function DeliveryTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(
    null
  );

  const filteredDispatches = dispatches.filter(
    (dispatch) =>
      dispatch.dispatchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispatch.trackingNumber
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      dispatch.order?.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const trackingForDispatch = selectedDispatch
    ? deliveryTracking.filter((t) => t.dispatchId === selectedDispatch.id)
    : [];

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
                          Order: {dispatch.order?.orderNo} |{" "}
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
                      <span className="text-muted-foreground">Order No:</span>{" "}
                      {selectedDispatch.order?.orderNo}
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
                    Tracking History
                  </h3>
                  {trackingForDispatch.length > 0 ? (
                    <div className="space-y-3 mt-2">
                      {trackingForDispatch.map((track) => (
                        <div
                          key={track.id}
                          className="border-l-2 border-primary pl-3 pb-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(track.timestamp),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </span>
                          </div>
                          <Badge className="mb-1">
                            {track.status
                              .replace("_", " ")
                              .split(" ")
                              .map(
                                (s) => s.charAt(0).toUpperCase() + s.slice(1)
                              )
                              .join(" ")}
                          </Badge>
                          {track.location && (
                            <div className="flex items-center gap-1 text-sm mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{track.location}</span>
                            </div>
                          )}
                          {track.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {track.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tracking updates yet
                    </p>
                  )}
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
