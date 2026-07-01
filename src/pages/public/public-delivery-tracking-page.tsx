import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Loader2,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getPublicDeliveryTrackingCompany,
  lookupPublicDeliveries,
} from "@/service/publicDeliveryTrackingService";
import type {
  PublicDeliveryTrackingCompany,
  PublicDeliveryTrackingShipment,
} from "@/types/public-delivery-tracking";
import type { Dispatch, DispatchStatus } from "@/types/sales";
import {
  getDestination,
  getStatusDisplay,
  getTrackingHistory,
} from "@/pages/sales/components/delivery-tracking-utils";

type LookupMode = "orderNumber" | "email" | "phone";

function CarrierTrackingNumber({
  trackingNumber,
  carrierName,
}: {
  trackingNumber: string;
  carrierName?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      toast.success("Tracking number copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy. Select and copy the number manually.");
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
            Carrier tracking number
          </p>
          {carrierName ? (
            <p className="text-sm text-blue-900/80">
              Use this on {carrierName}&apos;s website to track your package.
            </p>
          ) : (
            <p className="text-sm text-blue-900/80">
              Copy this number and use it on your carrier&apos;s website.
            </p>
          )}
          <p className="font-mono text-lg font-semibold tracking-wide text-blue-950 break-all">
            {trackingNumber}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 border-blue-300 bg-white text-blue-900 hover:bg-blue-100"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy number
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function toDispatchLike(shipment: PublicDeliveryTrackingShipment): Dispatch {
  return {
    id: shipment.shipmentNumber,
    dispatchNo: shipment.shipmentNumber,
    orderId: shipment.orderNumber,
    picklistId: "",
    status: (shipment.status || "created") as DispatchStatus,
    deliveryAddress: shipment.deliveryAddress || "",
    carrierName: shipment.carrierName || undefined,
    trackingNumber: shipment.trackingNumber || undefined,
    estimatedDeliveryDate: shipment.estimatedDeliveryDate || undefined,
    actualDeliveryDate: shipment.deliveredAt || undefined,
    createdAt: shipment.createdAt || new Date().toISOString(),
    trackingEvents: (shipment.trackingEvents || []).map((event, index) => ({
      id: String(index),
      status: (event.status || "created") as DispatchStatus,
      location: event.location || undefined,
      notes: event.notes || undefined,
      eventAt: event.eventAt || undefined,
    })),
  };
}

function DeliveryTimeline({ shipment }: { shipment: PublicDeliveryTrackingShipment }) {
  const dispatch = toDispatchLike(shipment);
  const history = getTrackingHistory(dispatch);

  return (
    <div className="space-y-4">
      {history.map((event, index) => (
        <div key={`${event.event}-${index}`} className="flex gap-3">
          <div className="mt-0.5">
            {event.status === "completed" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : event.status === "current" ? (
              <Truck className="h-5 w-5 text-blue-600" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1 border-b border-border/60 pb-4 last:border-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "font-medium",
                  event.status === "current" && "text-blue-700",
                  event.status === "completed" && "text-foreground",
                  event.status === "pending" && "text-muted-foreground",
                )}
              >
                {event.event}
              </p>
              {event.status === "current" ? (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  Current
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{event.location}</p>
            {event.dateTime ? (
              <p className="text-xs text-muted-foreground mt-1">{event.dateTime}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeliveryCard({
  shipment,
  expanded,
  onToggle,
}: {
  shipment: PublicDeliveryTrackingShipment;
  expanded: boolean;
  onToggle: () => void;
}) {
  const dispatch = toDispatchLike(shipment);
  const status = getStatusDisplay(shipment.status);
  const destination = getDestination(dispatch);
  const trackingNumber = shipment.trackingNumber?.trim();

  return (
    <Card className="overflow-hidden border border-border/70 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
      >
        <CardHeader className="space-y-3 bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                Order {shipment.orderNumber}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Shipment {shipment.shipmentNumber}
              </p>
            </div>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">Destination:</span>{" "}
              {destination}
            </p>
            {shipment.carrierName ? (
              <p>
                <span className="font-medium text-foreground">Carrier:</span>{" "}
                {shipment.carrierName}
              </p>
            ) : null}
            {shipment.estimatedDeliveryDate ? (
              <p>
                <span className="font-medium text-foreground">ETA:</span>{" "}
                {shipment.estimatedDeliveryDate}
              </p>
            ) : null}
          </div>
        </CardHeader>
      </button>
      {trackingNumber ? (
        <div className="px-6 pb-4">
          <CarrierTrackingNumber
            trackingNumber={trackingNumber}
            carrierName={shipment.carrierName}
          />
        </div>
      ) : null}
      {expanded ? (
        <CardContent className="space-y-6 pt-0">
          {shipment.items.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Items
              </p>
              <div className="space-y-2">
                {shipment.items.map((item, index) => (
                  <div
                    key={`${item.itemName}-${index}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{item.itemName || "Item"}</span>
                    </div>
                    <span className="font-medium">x{item.quantity ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Tracking timeline
            </p>
            <DeliveryTimeline shipment={shipment} />
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

export default function PublicDeliveryTrackingPage() {
  const { companyCode } = useParams<{ companyCode: string }>();
  const [searchParams] = useSearchParams();
  const prefilledOrderNumber = searchParams.get("orderNumber")?.trim() || "";
  const [company, setCompany] = useState<PublicDeliveryTrackingCompany | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [lookupMode, setLookupMode] = useState<LookupMode>("orderNumber");
  const [orderNumber, setOrderNumber] = useState(prefilledOrderNumber);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<PublicDeliveryTrackingShipment[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  useEffect(() => {
    if (!companyCode) {
      setCompanyError("Invalid tracking link.");
      setCompanyLoading(false);
      return;
    }

    setCompanyLoading(true);
    setCompanyError(null);
    getPublicDeliveryTrackingCompany(companyCode)
      .then((data) => setCompany(data))
      .catch(() => setCompanyError("This tracking link is not available."))
      .finally(() => setCompanyLoading(false));
  }, [companyCode]);

  useEffect(() => {
    if (prefilledOrderNumber) {
      setLookupMode("orderNumber");
      setOrderNumber(prefilledOrderNumber);
    }
  }, [prefilledOrderNumber]);

  const lookupRequest = useMemo(() => {
    if (lookupMode === "orderNumber") {
      return { orderNumber: orderNumber.trim() || undefined };
    }
    if (lookupMode === "email") {
      return { email: email.trim() || undefined };
    }
    return { phone: phone.trim() || undefined };
  }, [lookupMode, orderNumber, email, phone]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyCode) return;

    setSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setExpandedShipment(null);

    try {
      const response = await lookupPublicDeliveries(companyCode, lookupRequest);
      setCompany(response.company);
      setDeliveries(response.deliveries);
      if (response.deliveries.length === 1) {
        setExpandedShipment(response.deliveries[0].shipmentNumber);
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Unable to look up deliveries. Check your details and try again.";
      setSearchError(message);
      setDeliveries([]);
    } finally {
      setSearching(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tracking page...
        </div>
      </div>
    );
  }

  if (companyError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            {companyError}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
          <div className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              {company?.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.companyName}
                  className="h-10 w-auto rounded bg-white/10 p-1"
                />
              ) : null}
              <h1 className="text-2xl font-bold">{company?.companyName}</h1>
              <p className="text-slate-300">
                Track your active deliveries in real time.
              </p>
            </div>
            <div className="rounded-xl bg-orange-500 px-5 py-4 text-center">
              <Truck className="mx-auto mb-1 h-5 w-5" />
              <div className="text-sm font-semibold uppercase tracking-wide">
                Delivery Tracking
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find your delivery</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your order number, email, or phone number to view shipment status.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {([
                ["orderNumber", "Order #"],
                ["email", "Email"],
                ["phone", "Phone"],
              ] as const).map(([mode, label]) => (
                <Button
                  key={mode}
                  type="button"
                  variant={lookupMode === mode ? "default" : "outline"}
                  onClick={() => setLookupMode(mode)}
                >
                  {label}
                </Button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              {lookupMode === "orderNumber" ? (
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order number</Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(event) => setOrderNumber(event.target.value)}
                    placeholder="e.g. SO-000123"
                    autoComplete="off"
                  />
                </div>
              ) : null}

              {lookupMode === "email" ? (
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              ) : null}

              {lookupMode === "phone" ? (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Enter the phone used on your order"
                    autoComplete="tel"
                  />
                </div>
              ) : null}

              {searchError ? (
                <p className="text-sm text-red-600">{searchError}</p>
              ) : null}

              <Button type="submit" className="w-full" disabled={searching}>
                {searching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track delivery
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {hasSearched ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your deliveries</h2>
              <p className="text-sm text-muted-foreground">
                {deliveries.length} result{deliveries.length === 1 ? "" : "s"}
              </p>
            </div>

            {deliveries.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No active deliveries matched those details. Double-check your order
                  number, email, or phone and try again.
                </CardContent>
              </Card>
            ) : (
              deliveries.map((shipment) => (
                <DeliveryCard
                  key={shipment.shipmentNumber}
                  shipment={shipment}
                  expanded={expandedShipment === shipment.shipmentNumber}
                  onToggle={() =>
                    setExpandedShipment((current) =>
                      current === shipment.shipmentNumber
                        ? null
                        : shipment.shipmentNumber,
                    )
                  }
                />
              ))
            )}
          </div>
        ) : null}

        <div className="rounded-xl border bg-white px-5 py-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Need help?</p>
          <p className="mt-1">
            Contact {company?.companyName}
            {company?.phoneNo ? ` at ${company.phoneNo}` : ""}
            {company?.companyEmail ? ` or ${company.companyEmail}` : ""}.
          </p>
          {company?.websiteUrl ? (
            <p className="mt-1">
              Website:{" "}
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                {company.websiteUrl}
              </a>
            </p>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">
            Last updated {format(new Date(), "MMM d, yyyy h:mm a")}
          </p>
        </div>
      </div>
    </div>
  );
}
